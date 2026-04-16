# KUSOMEGANE アパレル商品管理ツール 設計メモ

**作成日:** 2026-04-16
**ステータス:** 設計完了 → テスト設計へ
**要件定義書:** `要件定義書類/00_AGENT_PROMPT.md`, `01_PURPOSE.md`, `02_REQUIREMENTS.md`, `03_TECHNICAL_SPEC.md`

---

## 1. 機能概要

合同会社アリガトサン（KUSOMEGANEブランド）のアパレル商品発売フロー（8STEP）を一元管理する社内ツール。
利用者は k2（吉川遼）1名のみ。合成画像1枚のアップロードから、AI解析・商品登録・キャプション生成・進捗管理までをシングルページアプリで完結させる。

---

## 2. 確定した要件（Q1〜Q10）

| # | 項目 | 確定内容 |
|---|---|---|
| Q1 | プロジェクト配置 | サブディレクトリ `kusomegane-apparel/` に Next.js を展開。ルートの `docs/`, `.claude/` はそのまま流用 |
| Q2 | Phase 0 スコープ | ホーム/新規登録ウィザード/商品詳細の3画面 + LocalStorage + Anthropic API のみ。**Sheets/Drive/認証は Phase 1 送り** |
| Q3 | サンプルデータ | LocalStorage が空の時のみシード投入（2〜3件）。ユーザー削除後は再投入しない |
| Q4 | テスト戦略 | **ロジック層のみ厳格TDD**（storage/productNumber/caption）。UI は目視確認（Phase 0） |
| Q5 | Anthropic API テスト | lib/anthropic.ts はモック化、API route の統合テストもモック。実 API は手動確認のみ |
| Q6 | P0-CRITICAL | ①商品番号採番の一意性 ②LocalStorage 読み書き整合性 ③キャプション組み立てテンプレ遵守 |
| Q7 | バリデーション | 必須: 商品名・カラー（1色以上）・サイズ（1つ以上）。素材デフォルト「綿100% 5.6oz」 |
| Q8 | 次のアクション表示 | `currentStep` の次の未完了ステップ名。全完了時「✨ 販売中」 |
| Q9 | サンプル到着カウントダウン | 0日以下=赤太字 / 1〜3日=黄太字 / 4日以上=通常色 |
| Q10 | APIキー | 実装先行、ユーザーが後日 `.env.local` に設定。実 AI 呼び出し動作確認は後日 |

---

## 3. スコープ外（Phase 1 以降）

- Google Sheets API（`/api/sheets/*`・行追加・最大番号取得・発注数量更新）
- Google Drive API（`/api/drive/*`・フォルダ作成・画像アップロード）
- Supabase Auth / Supabase DB 移行
- Vercel デプロイ設定
- スマートフォン最適化（レスポンシブの作り込み）

Phase 0 では上記のボタン・UI 自体は描画してもよいが、クリック時は「Phase 1 で実装予定」と表示するモックにとどめる。

---

## 4. ディレクトリ構成

```
/Users/mega/Desktop/arigatosan-dev/
├── .claude/                          # フレームワーク（既存）
├── docs/                             # フレームワーク（既存・共用）
│   ├── test-spec.md                  # テスト仕様書
│   ├── progress.md                   # 作業進捗
│   └── design-notes/
│       └── kusomegane-apparel.md     # 本ファイル
├── 要件定義書類/                       # 入力資料（既存）
├── templates/                        # フレームワーク（既存）
└── kusomegane-apparel/               # ★Next.js アプリ本体
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── products/
    │   │   ├── new/page.tsx
    │   │   └── [id]/page.tsx
    │   └── api/
    │       ├── analyze-image/route.ts
    │       └── generate-caption/route.ts
    ├── components/
    │   ├── ProductCard.tsx
    │   ├── ProgressBar.tsx
    │   ├── StatusBadge.tsx
    │   ├── SampleCountdown.tsx
    │   ├── StepTimeline.tsx
    │   └── WizardSteps/
    │       ├── StepA_ImageUpload.tsx
    │       ├── StepB_BasicInfo.tsx
    │       ├── StepC_Caption.tsx
    │       └── StepD_Confirm.tsx
    ├── lib/
    │   ├── storage.ts                # LocalStorage 操作（TDD対象）
    │   ├── productNumber.ts          # 商品番号採番（TDD対象・P0-CRITICAL）
    │   ├── caption.ts                # キャプション組み立て（TDD対象・P0-CRITICAL）
    │   ├── anthropic.ts              # Anthropic SDK ラッパ（モック化してテスト）
    │   ├── nextAction.ts             # 次のアクション計算（TDD対象）
    │   ├── sampleCountdown.ts        # 残日数計算（TDD対象）
    │   └── seed.ts                   # 初回シードデータ
    ├── types/
    │   └── index.ts
    ├── constants/
    │   └── index.ts
    ├── __tests__/                    # Vitest
    │   ├── storage.test.ts
    │   ├── productNumber.test.ts
    │   ├── caption.test.ts
    │   ├── nextAction.test.ts
    │   └── sampleCountdown.test.ts
    ├── vitest.config.ts
    ├── package.json
    ├── tsconfig.json
    └── .env.local                    # ANTHROPIC_API_KEY（git 管理外）
```

---

## 5. テスト戦略

### 対象
- **ロジック層（TDD対象・必須）**
  - `lib/storage.ts` — getProducts / saveProducts / upsertProduct / deleteProduct / draft 系
  - `lib/productNumber.ts` — getNextBaseNumber / assignProductNumbers
  - `lib/caption.ts` — buildFullCaption（テンプレ遵守の全分岐）
  - `lib/nextAction.ts` — 次の未完了ステップ取得 / 全完了時表記
  - `lib/sampleCountdown.ts` — 残日数計算 + 色分類

### 対象外（Phase 0）
- UI コンポーネントテスト（RTL）→ Phase 1 以降で検討
- E2E テスト（Playwright）→ Phase 1 以降
- Anthropic API への実呼び出しテスト → 手動確認

### テストランナー
- Vitest（Next.js 14 App Router と相性がよく、Jest 互換）
- `jsdom` 環境で LocalStorage を使うテストを実行

### P0-CRITICAL 指定範囲
1. **商品番号採番** — ダブりが本番に出ると Drive/Sheets 連携時に致命的（Phase 1 で）
2. **LocalStorage 整合性** — 壊れたら全データ喪失
3. **キャプション組み立て** — 受注生産フラグ等の分岐を間違えると販売ページ上で誤情報

---

## 6. Phase 分割案

### Phase 0.1 — プロジェクト初期化 + 型 + LocalStorage 層
- `npx create-next-app@latest kusomegane-apparel --typescript --tailwind --app --no-src-dir`
- Vitest 導入
- `types/index.ts`, `constants/index.ts` 作成
- `lib/storage.ts` を RED→GREEN で実装
- テストケース: TC-STR-001〜006（getProducts / upsert / delete / draft）

### Phase 0.2 — 商品番号採番 + キャプション組み立て
- `lib/productNumber.ts` を RED→GREEN（TC-PN-001〜004）
- `lib/caption.ts`（buildFullCaption）を RED→GREEN（TC-CAP-001〜006）
- `lib/nextAction.ts`, `lib/sampleCountdown.ts` を RED→GREEN（TC-NXT-001〜003 / TC-CDN-001〜004）

### Phase 0.3 — ホーム画面 UI
- `app/layout.tsx`, `app/page.tsx`
- `components/ProductCard.tsx`, `ProgressBar.tsx`, `StatusBadge.tsx`, `SampleCountdown.tsx`
- フィルター（全て / 対応中 / 完了）
- サマリー（総数 / 対応中 / 完了）
- `lib/seed.ts` による初回シードデータ投入
- 目視確認: カードに画像が表示される / フィルターが効く / サマリーが正しい

### Phase 0.4 — 新規登録ウィザード + Anthropic API route
- `app/products/new/page.tsx`（4ステップ state machine）
- `components/WizardSteps/StepA_ImageUpload.tsx`（DnD + canvas 800px リサイズ + Base64 化）
- `StepB_BasicInfo.tsx`（バリデーション: 商品名・カラー・サイズ必須）
- `StepC_Caption.tsx`（AI 生成キャプションの編集・再生成）
- `StepD_Confirm.tsx`（保存 → カラー数分 Product レコード作成）
- `app/api/analyze-image/route.ts`, `app/api/generate-caption/route.ts`
- `lib/anthropic.ts`（SDK ラッパ）— テストではモック
- 目視確認: 画像アップ → AI 解析（要 APIキー）→ 枝番付与 → ホームに反映

### Phase 0.5 — 商品詳細（8STEPタイムライン）
- `app/products/[id]/page.tsx`
- `components/StepTimeline.tsx`（8 行、丸ボタンで toggle）
- STEP 5: 日付入力欄 → `sampleArrivalDate` に保存
- STEP 7: サブチェックリスト（5 項目）
- キャプション表示 + コピーボタン
- 商品情報テーブル
- 目視確認: STEP クリックで進捗バーが更新される / リロードしても保持

各 Phase 完了時に TDD Ledger を出力し、`docs/progress.md` を更新してから commit する。

---

## 7. 実装ポリシー（再確認）

1. **RED→GREEN→REFACTOR 厳格分離** — 一度に複数 failing test を作らない
2. **テストファースト** — 全てのロジック層は失敗するテストを書いてから実装
3. **Edit/Write ツールのみ** — sed -i 等の直接書き換え禁止（`.claude/settings.json` で deny）
4. **Base64 の data URL をそのまま `<img src>` に渡す** — 要件定義書指摘の既知バグ対策
5. **カラー複数選択時は Product レコードをカラー数分生成** — 枝番 `59-1`, `59-2`
6. **Anthropic モデル ID**: `claude-sonnet-4-20250514`（要件定義書の指定。Phase 0 時点では実呼び出ししないのでそのまま）
7. **LocalStorage は `"use client"` コンポーネント内でのみ触る** — SSR で `window` が無い環境をガード

---

## 8. 未解決の設計判断

現時点で残っている未解決項目は **なし**。全項目ユーザー推奨に従って確定済み。

Phase 1（Sheets/Drive/認証）着手時に再度設計フェーズを開くこと。
