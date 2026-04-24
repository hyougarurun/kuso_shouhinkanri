# Phase G2 設計メモ — 請求書アップロード + 候補リスト化

加工費推定の精度を上げるため、請求書 PDF を UI からアップロードして即時解析、
解析データから「ボディ型番」「色」を選択肢として参照可能にする。

---

## 1. 現状

- 別プロジェクト `../print-cost-estimator/` に Claude ベースの PDF パーサがある（`parseInvoicePdf.ts`）
- 既存 14 件の請求書 JSON が `../print-cost-estimator/data/parsed/*.json` に存在
- メインアプリは `app/api/estimate-cost/route.ts` で `readFileSync` 直読み
- 新規請求書を入れるには CLI (`npm run parse:batch`) を別プロジェクトで回す必要がある

---

## 2. 改修方針（最小工数）

### A. パーサ移植（重複コードを許容、PoC 範囲）
- kusomegane-apparel 側に `lib/print-cost/parser/parseInvoicePdf.ts` を新規作成
- print-cost-estimator のロジックを参照しつつ、メインアプリ内で完結する形に整える
- 出力先は **`../print-cost-estimator/data/parsed/`**（既存集計ロジックがそのまま使える）
- 入力 PDF は **`../print-cost-estimator/data/raw/`** に保存

### B. lib 層追加
- `lib/print-cost/extractCatalog.ts` — invoices から bodyCode / color / bodyName のユニーク抽出（純ロジック、テスト可能）

### C. API 層追加
- `POST /api/print-cost/upload-invoice` — multipart/form-data で PDF 受信、保存、解析、JSON 出力
- `GET /api/print-cost/catalog` — invoices からカタログ（bodyCode 一覧、color 一覧）を返す

### D. UI 改修（QuickEstimateCard）
- 上部に「請求書アップロード」セクション追加（ドラッグ&ドロップ + ファイル選択）
- アップロード成功でメタ表示（学習データ件数）を更新、トースト的に「N 件追加」表示
- 既存 `bodyCode` / `color` 入力（SuggestiveInput）に **datalist** を併設し、カタログ実績を候補に出す

---

## 3. データフロー

```
[k2 ブラウザ]
  ↓ FormData(file=pdf)
POST /api/print-cost/upload-invoice
  ↓ ① 保存: ../print-cost-estimator/data/raw/<filename>.pdf
  ↓ ② 解析: parseInvoicePdf(buffer)  → ParsedInvoice
  ↓ ③ 保存: ../print-cost-estimator/data/parsed/<filename>.pdf.json
  ↓ ④ レスポンス: { invoice, savedTo }
[k2 ブラウザ]
  ↓ /api/print-cost/catalog を再取得
  → datalist 候補・meta 件数を更新
```

---

## 4. extractCatalog のロジック

```ts
export interface InvoiceCatalog {
  bodyCodes: Array<{ code: string; name: string; sampleCount: number }>
  colors: string[]
}

extractCatalog(invoices: ParsedInvoice[]): InvoiceCatalog
```

- bodyCodes: `lineItems[].bodyCode` のユニーク。`bodyName` が複数ある場合は最頻、`sampleCount` は出現数
- colors: `lineItems[].color` のユニーク（trim、空・"カラー" のみ等のノイズは除外）
- 並びは `sampleCount` desc → 名前 asc

---

## 5. パーサの実装方針

`lib/print-cost/parser/parseInvoicePdf.ts`:

```ts
export interface ParseInput {
  buffer: Buffer
  filename: string
}
export async function parseInvoicePdf(input: ParseInput): Promise<ParsedInvoice>
```

- Anthropic SDK で `claude-sonnet-4-6` 呼び出し
- PROMPT は print-cost-estimator から借用（保守は一旦両方手動同期 = 後日統合タスク）
- normalizeLocation / normalizeMethod は kusomegane-apparel 側に既にある（`lib/print-cost/normalizer/*`）
- テスト省略（外部 API 依存・PoC）

---

## 6. UI レイアウト案（QuickEstimateCard 上部）

```
┌── 請求書アップロード ──────────────────┐
│ [PDF をドラッグ or 選択]                │
│ 学習データ: 14 請求書 / 350 明細        │
│ + アップロード結果: KUSOMEGANE...pdf 解析完了 │
└────────────────────────────────────┘
```

ステータス:
- idle → ファイル選択 → "解析中..." → 成功 / 失敗

---

## 7. テスト方針

- **R-CAT** `lib/print-cost/extractCatalog.ts`: ユニーク化、空値除外、bodyName 最頻採択、sampleCount 集計（5 件）
- パーサ自体・API ルートは E2E 手動確認

---

## 8. リスク・注意

- パーサのコード重複（kusomegane-apparel ↔ print-cost-estimator）。後日統合か、共通パッケージ化が必要
- 大きい PDF では Anthropic API がタイムアウトする可能性 → maxDuration 60s
- API キー (`ANTHROPIC_API_KEY`) が `.env.local` に必要（既存と同じ）
- 認証なし（k2 単独運用前提）
