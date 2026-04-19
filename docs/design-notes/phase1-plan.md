# KUSOMEGANE アパレル管理ツール Phase 1 実装計画

作成日: 2026-04-17
ステータス: 計画策定（k2 確認待ち）
前提: Phase 0 完了（23テスト全PASS、LocalStorage MVP）
関連: `docs/design-notes/kusomegane-apparel.md`, `docs/design-notes/google-integration-prep.md`, `要件定義書-最新版.md`

---

## 1. 概要・目標

Phase 0 の LocalStorage MVP を、Supabase（DB + Storage）に永続化された本番運用基盤へ昇格させる。同時に、要件定義書で未着手だった「複数画像アップロード」「AI 着画生成（日本人モデル）」「Gemini 2.5 Flash キャプション生成」「Google Sheets/Drive 自動転記」「.ai 後追いアップロード」の 5 機能を一気通貫で完成させ、k2 が「画像をアップする」だけで ASTORE 出品直前まで到達できる状態にする。

---

## 2. アーキテクチャ図（テキスト）

```
[Browser (Next.js 16 App Router)]
        |
        | (画像アップロード / 操作)
        v
[Next.js API Routes (runtime: nodejs)]
        |
        +--> [Supabase Storage]   product-images / generated-images / ai-files (全 private)
        |        ^ signed URL (5-15min) を返却
        |
        +--> [Supabase Postgres]  products / product_images / product_status_events / ai_generation_logs / body_models
        |        ^ Service Role Key 経由（RLS は Phase 1 では disable）
        |
        +--> [fal.ai] Kling Kolors VTON v1.5（着画 3 案）
        |        ^ queue mode + webhook、結果は generated-images に保存
        |
        +--> [Google Generative AI] Gemini 2.5 Flash（キャプション）
        |
        +--> [Google Sheets API v4]  ASTORE 製品管理シート
        |        ^ OAuth 2.0 リフレッシュトークン
        |
        +--> [Google Drive API v3]  k2 個人 Drive 配下フォルダ
                 ^ OAuth 2.0 リフレッシュトークン（service account では quota で詰む）
```

---

## 3. 技術選定の根拠

- **着画生成 = ハイブリッド構成**: fal.ai 経由 Kling Kolors VTON v1.5 で 2案（$0.08/枚、VTON特化でロゴ崩れ少）+ Google Gemini 3 Pro Image (Nano Banana Pro) で 1案（$0.134/枚、日本人顔自然・14枚参照可で仕上げ用）。月100商品で約$29.4/月。fal.ai は queue mode + webhook で並列、Nano Banana Pro は同期呼び出し。
- **Google 認証 = OAuth 2.0 リフレッシュトークン方式**: サービスアカウントは個人 Drive で `403 storageQuotaExceeded` が確定するため。Workspace 共有ドライブ前提なら回避可能だが k2 は契約なし。`googleapis@^144` を採用、API Route は `export const runtime = 'nodejs'` 必須（Edge 非対応）。詳細: `docs/design-notes/google-integration-prep.md`。
- **キャプション = Gemini 2.5 Flash**: 1M トークンコンテキスト、レイテンシ・コスト・日本語品質のバランスが最良。`@google/generative-ai` SDK で統合。Anthropic SDK は Phase 1 でアンインストール候補。
- **Supabase**: バケットは全 private、API Route 経由で signed URL（5-15 分）発行。RLS は Phase 1 では disable し、Service Role Key を持つサーバ側で担保（1 人運用でブラウザから直接 DB を叩かないため十分）。LocalStorage の既存データは捨てる（移行スクリプトなし）。

---

## 4. Phase 分割（Phase 1.1 〜 1.6）

### Phase 1.1 — Supabase 基盤 + DB スキーマ + Storage バケット
- **やること**:
  - `.mcp.json` を新規作成し Supabase MCP を登録（project ref `gdzkpakkalnyrgbchmtq`）
  - `supabase/migrations/` 配下に SQL migration を追加: `products` / `product_images` / `product_status_events` / `ai_generation_logs` / `body_models` 5 テーブル + enum 定義（`image_type`, `step_status` 等）
  - Storage バケット 3 つ（`product-images`, `generated-images`, `ai-files`）を private で作成、CORS 設定
  - `lib/supabase/server.ts`（Service Role）と `lib/supabase/signedUrl.ts` を追加
  - `.env.local.example` を更新（`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`）
- **触るファイル**: `/.mcp.json`（新規）, `kusomegane-apparel/supabase/migrations/0001_init.sql`（新規）, `kusomegane-apparel/lib/supabase/*`（新規）, `.env.local.example`
- **テスト追加カテゴリ**: F. Supabase クライアント（接続スモーク、signed URL 発行）。実 DB 接続は CI でなく手動確認、ロジックはモック可能な層に閉じる
- **依存**: なし（Phase 1 の起点）

### Phase 1.2 — 複数画像アップロード対応（UI のみ、LocalStorage 互換維持）
- **やること**:
  - `ProductImages` 型を `composite/processing/wearing/sizeDetail` の 4 スロット固定 → `image_type` enum + 配列構造に拡張（後方互換のため `images.compositeList: string[]` を追加し既存 `composite` も残す）
  - `StepA_ImageUpload.tsx` を「複数ファイル DnD + サムネ並べ替え + 削除」UI へ改修
  - 800px リサイズ + Base64 化を 1 ファイルずつ並列実行（`Promise.all`）
- **触るファイル**: `kusomegane-apparel/types/index.ts`, `kusomegane-apparel/components/WizardSteps/StepA_ImageUpload.tsx`, `kusomegane-apparel/lib/wizardState.ts`
- **テスト追加カテゴリ**: G. 複数画像 state 管理（追加・並べ替え・削除のロジック関数を `lib/imageList.ts` に切り出して TDD）
- **依存**: 1.1 不要（ローカル完結）

### Phase 1.3 — LocalStorage → Supabase 移行（storage 層差し替え）
- **やること**:
  - `lib/storage.ts` を「LocalStorage 直叩き」から「`/api/products` 経由」に差し替え。インターフェース（`getProducts/upsertProduct/deleteProduct/draft 系`）は維持し、既存 23 テストが通る形にする
  - `app/api/products/route.ts`（GET/POST）と `app/api/products/[id]/route.ts`（GET/PATCH/DELETE）を新規作成
  - 画像は `app/api/uploads/product-image/route.ts` 経由で Storage に直接アップロード、戻り値の `storage_path` を DB に保存
  - 画像表示は signed URL（短命）を都度発行する `useSignedUrl(path)` フックで解決
  - **既存 LocalStorage データは移行しない**（k2 了承済み・Phase 0 のシード再投入のみ）
- **触るファイル**: `kusomegane-apparel/lib/storage.ts`, `kusomegane-apparel/app/api/products/**`（新規）, `kusomegane-apparel/app/api/uploads/**`（新規）, `kusomegane-apparel/lib/supabase/*`, `kusomegane-apparel/components/ProductCard.tsx`（signed URL 対応）
- **テスト追加カテゴリ**: H. API Route 統合（products CRUD、Supabase クライアントはモック）。既存 TC-STR-001〜006 は「`storage` のインターフェース契約テスト」として維持し、内部実装差し替えで GREEN を保つ
- **依存**: 1.1（必須）

### Phase 1.4 — AI 着画生成（ハイブリッド: fal.ai Kling + Nano Banana Pro + ベースモデル管理 + Vercel 初回デプロイ）
- **やること**:
  - **STEP 1 (Vercel 初回デプロイ)**: fal.ai webhook 用の公開URL確保。GitHub 連携 + 環境変数登録 + プレビュー URL を `APP_URL` に設定
  - **STEP 2 (モデル画像マスター生成)**: Claude が Nano Banana Pro で性別×年代×ポーズ別 18 枚生成 → k2 が採用判定 → `base-models` バケット + `body_models` テーブル登録
  - **STEP 3 (着画生成 API)**: `app/api/generate-wearing/route.ts` (POST) — fal.ai に Kling 並列 2件 + Nano Banana Pro 同期 1件 → 3案を `generated-images` に保存 → `ai_generation_logs` に記録
  - **STEP 4 (UI)**: 商品詳細ページに「着画タブ」、3案を「Kling案/Kling案/仕上げ案」ラベルで表示。再生成は自然言語プロンプト追加フィールド付き
- **触るファイル**: `.github/workflows/`（Vercel不要）, Vercel ダッシュボード設定, `kusomegane-apparel/app/api/generate-wearing/route.ts`（新規）, `kusomegane-apparel/app/api/generate-wearing/webhook/route.ts`（新規・fal用）, `kusomegane-apparel/lib/fal.ts`（新規）, `kusomegane-apparel/lib/nanoBanana.ts`（新規・Gemini Image SDK ラッパ）, `kusomegane-apparel/components/WearingGallery.tsx`（新規）, `kusomegane-apparel/app/products/[id]/page.tsx`
- **テスト追加カテゴリ**: I. fal.ai ラッパ（モック）、I-2. Nano Banana Pro ラッパ（モック）、I-3. 3案統合ロジック（Kling 2件 + NanoBanana 1件のマージ・順序）、I-4. 着画選択ロジック（採用済 1 枚を `images.wearing` に昇格）
- **依存**: 1.1（generated-images / base-models バケット必須）, 1.3（products テーブル必須）

```ts
// 統合ポイント例: app/api/generate-wearing/route.ts
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const { productId, gender, ageRange, prompt } = await req.json();
  const baseModel = await pickBodyModel({ gender, ageRange });
  const garmentUrl = await getSignedUrl(productImagePath, 600);
  // fal.ai に 3 並列投入（queue mode、webhook で結果回収）
  const requests = await Promise.all([1, 2, 3].map(seed =>
    fal.queue.submit('fal-ai/kling-virtual-try-on/v1-5', {
      input: { human_image_url: baseModel.url, garment_image_url: garmentUrl, seed, prompt },
      webhookUrl: `${process.env.APP_URL}/api/generate-wearing/webhook?productId=${productId}`,
    })
  ));
  return Response.json({ jobIds: requests.map(r => r.request_id) });
}
```

### Phase 1.5 — キャプション生成 Gemini 2.5 Flash 置換
- **やること**:
  - `@google/generative-ai` を導入、`@anthropic-ai/sdk` を依存から削除
  - `lib/anthropic.ts` を `lib/gemini.ts` にリネーム（インターフェースは維持し既存 STEP3 から無改修で呼べる形）
  - `app/api/generate-caption/route.ts` の中身を Gemini 呼び出しに差し替え。出力契約（`{ description, designDescription }`）は変えない
  - `buildFullCaption`（既存 P0-CRITICAL）は無改修で使えること
- **触るファイル**: `kusomegane-apparel/lib/gemini.ts`（旧 anthropic.ts を rename）, `kusomegane-apparel/app/api/generate-caption/route.ts`, `kusomegane-apparel/package.json`
- **テスト追加カテゴリ**: J. Gemini ラッパ（SDK モック、出力 JSON parse のフォールバック分岐）。既存 TC-CAP-001〜006 は無改修で GREEN を維持
- **依存**: なし

### Phase 1.6 — Google Sheets 転記（新規シート方式）+ Drive 保存 + .ai 後追いアップロード
- **やること**:
  - `lib/google/auth.ts`: OAuth 2.0 リフレッシュトークンから access token 取得（`googleapis@^144`）
  - `lib/google/sheetTemplate.ts`: 「リスト1」シートの**ヘッダー雛形**を JSON 化して保持。`spreadsheets.batchUpdate` で新規シート作成 + ヘッダー貼り付け
  - `app/api/sheets/transcribe/route.ts`: 商品データを新規シートに転記（雛形コピー → 該当列に値挿入）
  - `lib/google/folderName.ts`: 短縮商品名アルゴリズム（全角10文字以内、特殊記号除去）。**P0-CRITICAL** 候補
  - `app/api/drive/upload/route.ts`: `[商品コード]_短縮商品名` フォルダを作成、商品画像 + .ai ファイルをアップロード（**着画は除外**）
  - `app/api/products/[id]/ai-file/route.ts`: 商品詳細ページから後追いアップロード。既存 Drive フォルダがあれば追加、無ければ作成
  - 商品詳細ページに「Sheets 転記」「Drive 同期」「.ai アップロード」ボタン
- **触るファイル**: `kusomegane-apparel/lib/google/{auth,sheets,sheetTemplate,drive,folderName}.ts`（全て新規）, `kusomegane-apparel/app/api/sheets/transcribe/route.ts`, `kusomegane-apparel/app/api/drive/**`, `kusomegane-apparel/app/api/products/[id]/ai-file/route.ts`, `kusomegane-apparel/app/products/[id]/page.tsx`
- **テスト追加カテゴリ**: K. シート雛形の列マッピング（リスト1の構造を不変として整形ロジックを純関数化）、K-2. 新規シート作成リクエスト整形、L. Drive 命名（**P0-CRITICAL**: 短縮商品名アルゴリズム）+ 着画除外ロジック
- **前提**: k2 が E-1（リスト1のヘッダー構造スクショ）を共有済みであること
- **依存**: 1.3（products テーブル）, 1.4（着画除外判定に image_type 必要）

---

## 5. テスト方針

- **TDD 厳格分離（RED→GREEN→REFACTOR）を継続**。`.claude/rules/tdd-integrity-contract.md` 準拠
- **追加カテゴリ**:
  - F. Supabase クライアント（モック層の契約テスト）
  - G. 複数画像 state 管理
  - H. /api/products 系 API Route 統合（Supabase モック）
  - I. fal.ai ラッパ + 着画選択
  - J. Gemini ラッパ
  - K. Sheets 転記行整形
  - L. Drive 命名 + 着画除外
- **既存 23 テストは全 GREEN を維持**（特に P0-CRITICAL 15 件）。storage 層は内部実装が変わっても契約テストとして機能させる
- **P0-CRITICAL 候補**:
  1. **商品番号採番（既存 TC-PN-001〜004）の Supabase 版**: `getNextBaseNumber` を DB クエリで再実装する際にも同じ振る舞いを保証
  2. **画像 storage_path と DB レコードの整合性**: アップロード成功時に必ず DB INSERT、ロールバック対応
  3. **Sheets 行のヘッダーマッピング**: 列順がズレると業務破綻
  4. **着画の Drive 除外**: 着画を間違って Drive に上げないこと
  5. **OAuth リフレッシュトークン失効時の明示エラー**: 401 をユーザー向けメッセージに変換

詳細テストケースは別ファイル `docs/test-spec.md` に追記する（Phase 1.x 着手時に test-design スキル経由）。

---

## 6. 想定リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| fal.ai レイテンシ（VTON は 30-90 秒/枚） | UX 悪化 | queue mode + webhook、UI は「生成中」プレースホルダ表示。3 並列で体感短縮 |
| OAuth リフレッシュトークン失効（Google セキュリティ更新時） | Sheets/Drive 全停止 | OAuth 同意画面を Production 公開（Testing だと 7 日失効）。401 検知 → k2 に再認証導線（`/api/auth/google/refresh`）提示 |
| Supabase free tier の Storage 容量（1GB） | 月 100 商品 ×（商品 5 枚 + 着画 3 枚）× 200KB ≒ 160MB/月で 6 ヶ月で枯渇 | Pro プラン（$25/月、100GB）への移行を Phase 2 で検討。古い generated-images は 90 日で auto-delete ジョブ |
| AI 生成コスト暴走（再生成連打） | 月コスト想定外 | 1 商品あたり再生成は最大 5 回まで UI で制限、`ai_generation_logs` で月次集計表示 |
| fal.ai webhook が localhost に届かない（開発時） | ローカル開発困難 | `cloudflared tunnel` か Vercel preview URL を `APP_URL` に設定する手順を README に記載 |

---

## 7. コスト試算（月 100 商品想定）

- **AI 着画（ハイブリッド）**: 100 商品 × ($0.08 × 2 + $0.134 × 1) = **$29.4/月**（再生成込みで上振れ余地 +$15）
- **Gemini 2.5 Flash キャプション**: 100 商品 × 約 2K トークン入出力 ≒ **$0.5/月**（無視レベル）
- **Supabase**: free tier で当面 $0、Storage 枯渇時 Pro $25/月
- **Google API**: Sheets/Drive は無料枠内
- **合計目安**: **$25-35/月**（Supabase free のうち）→ **$50-60/月**（Supabase Pro 移行後）

---

## 確定事項（2026-04-17 k2 回答済み）

### Q1. 着画 AI の構成 → **ハイブリッド（Kling×2 + Nano Banana Pro×1）**
- 1商品あたり: Kling Kolors VTON v1.5 で 2案 + Nano Banana Pro（Gemini 3 Pro Image）で 1案
- コスト: ($0.08 × 2 + $0.134 × 1) × 100商品/月 = **約 $29.4/月**
- Phase 1.4 で fal.ai SDK と Google Generative AI の両方を統合
- UI: 3案を並べて表示する際、「Kling案 / 仕上げ案」のラベルで区別する

### Q2. Sheets 転記モード → **新規シート作成方式（雛形フォーマット必要）**
- 既存ASTOREシート内の **「リスト1」シート（k2 表記の "商品しょうあ"）を雛形** として参照
- 新規シート（例: 商品ごと or 月次）に既存フォーマットを継承して転記
- **追加実装が必要**:
  - 「リスト1」のヘッダー構造をテンプレート化（Phase 1.6 内 `lib/google/sheetTemplate.ts`）
  - `spreadsheets.batchUpdate` で新規シート作成 + 雛形ヘッダー貼り付け
  - 新規シート命名規則の確定（商品コード単位 or 月次バッチ単位 → k2 とE-1 のスクショ共有時に確定）
- E-1 で k2 がリスト1のスクショ共有 → ヘッダー構造確定 → 雛形 SQL/JSON 化

### Q3. 日本人モデル画像マスター → **Claude が AI 生成（Phase 1.4 着手時）**
- Phase 1.4 開始時に Nano Banana Pro / Imagen 4 で **性別×年代×ポーズ別 18枚** を生成
- 生成時は背景無地グレー or 白で統一（VTON 精度向上）
- 生成後 k2 が採用判定 → 採用したものを Supabase Storage `base-models` バケット + `body_models` テーブルに登録
- → preparation-checklist の F-2 はスキップ可

### Q4. Drive フォルダ命名規則 → **`[商品コード]_短縮商品名`**
- 例: `KM-2604-001_オーバーサイズT`
- 短縮商品名のルール: 全角10文字以内、特殊記号 (`/\:*?"<>|`) は除去
- 短縮アルゴリズム: `lib/google/folderName.ts` に純関数化して TDD（P0-CRITICAL候補）

### Q5. Vercel デプロイ時期 → **Phase 1.4 で着手**
- fal.ai webhook が公開URL必須のため Phase 1.4 で本番URL確保
- 1.4 でデプロイ → 1.5/1.6 は本番URL前提で Sheets/Drive OAuth リダイレクトを設定
- 本格運用切り替えは Phase 1.6 完了後

---

## 6. Sheets / Drive 確定仕様（2026-04-19 k2 回答に基づく再確定）

### 6.1 Sheets（ASTORE 製品管理シート）
- **書き込み先**: 既存シートの **「リスト1」に直接追記** （新規シート作らず、一貫性重視）
  - `GOOGLE_SHEETS_SPREADSHEET_ID=1ZygaSDtEF5w3a8URi6dA4Don4YWZ0vmNFjx93zr1jU4`
  - リスト1 タブ（gid=1641291870）
- **トリガー**: 商品詳細画面の **「シートに登録」ボタン**（手動）
- **書き込む列**（k2 共有 Excel の 1 行目ヘッダー通り、新列追加なし）:
  | 列 | 項目 | 格納値 |
  |---|---|---|
  | A | 商品 | 合成画像（セルに画像埋め込み、または空欄で画像リンクは G 列へ） |
  | B | 商品番号 | `product.productNumber` 例: `59`, `60-1` |
  | C | 色 | `product.colors.join("・")` |
  | D | サイズ | `product.sizes.join("・")` |
  | E | 加工 | `product.processingInstruction`（①タグ付け ②正面インク 等） |
  | F | ボディ型番 | `product.bodyModelNumber` |
  | G | デザインファイル | **Drive 商品番号フォルダの URL** |
  | H | 備考 | `product.notes` |
- **差分方針（Q6 = A）**: 同じ商品番号の行が既にあれば **上書き（UPDATE）**、なければ末尾に追加（APPEND）
  - 内部で `product.sheetRowNumber` を保持して行番号を追跡

### 6.2 Drive（添付ファイル置き場）
- **フォルダ構成（Q3）**: 商品番号ごとに 1 フォルダ、命名は **商品番号のみ**（例: `59/`, `60-1/`）
  - 親フォルダ: `GOOGLE_DRIVE_PARENT_FOLDER_ID=1jP6r0FSeSva_4z-XXiguKHzZ5uAYL1L1`
- **対応ファイル形式（Q4）**: `.ai / .psd / .png / .jpg / .pdf / .zip` 等 **MIME 無制限**
- **UI（Q5）**: 商品詳細画面に **D&D 添付領域**（`<input type="file" multiple>` + ドロップ対応）
  - 添付済みファイル一覧（ファイル名 / サイズ / Drive View リンク）
- **カード表示（Q5）**: Drive に 1 ファイル以上格納済みの商品は **カードを黄緑枠**で表示

### 6.3 UI 追加ボタン（Phase 1 で実 API に接続）
- 商品詳細画面:
  - 「シートに登録」ボタン → `POST /api/sheets/register`（Phase 1.6 で実装）
  - Drive D&D エリア → `POST /api/drive/upload`（Phase 1.5 で実装）
- ホーム商品カード:
  - Drive 格納済み判定: `product.driveFiles && product.driveFiles.length > 0`
  - シート登録済み判定: `product.sheetRegisteredAt != null`

### 6.4 Product 型の追加フィールド
```typescript
interface DriveFile {
  id: string              // Drive file id
  name: string
  mimeType: string
  sizeBytes?: number
  webViewLink?: string    // 閲覧 URL
  uploadedAt: string
}

interface Product {
  // ...既存
  driveFolderUrl: string        // 既存、Phase 1 で実値を書き込み
  driveFiles?: DriveFile[]      // 新規、ドライブ添付ファイル
  sheetRegisteredAt?: string    // 新規、シート登録日時
  sheetRowNumber?: number       // 新規、リスト1 の行番号（上書き判定用）
}
```

