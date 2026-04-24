# Phase A 設計メモ — 文言アセット（caption_assets）

商品概要キャプション編集（`CaptionBlock`）に「定型文言ライブラリ」をぶら下げる。
※※※※期間限定×数量限定です※※※※※ のような商品横断で使う定型句を、
Supabase に保存して **ボタンワンクリックでクリップボードにコピー** できるようにする。

---

## 1. ユースケース

- k2 が新商品ページを書くたびに、定型句をクリップボードに入れて手動で貼り付けたい
- 商品ごとに使う定型句は違うので、選択式（共通プールから都度選ぶ）
- アセット自体は商品横断で再利用、商品とは紐付けない（Q7-A）
- 複数端末で共有したいので localStorage ではなく Supabase（Q1-B）

---

## 2. データモデル

### テーブル `public.caption_assets`

| カラム | 型 | 制約 | 用途 |
|--------|-----|------|------|
| `id` | `text` | PK | `asset_<ts>_<rand>`（client 発行）|
| `label` | `text` | NOT NULL | ボタン上部に出す短い名前（任意入力。空なら body 先頭から自動生成） |
| `body` | `text` | NOT NULL | コピー対象の本文 |
| `category` | `text` | NOT NULL DEFAULT '' | カテゴリ（自由入力 + datalist 補完）|
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() | trigger で更新 |

- index: `(category)`, `(updated_at desc)`
- RLS: 既存に合わせて `disable`
- マイグレーション: `supabase/migrations/20260424000001_caption_assets.sql`

### TS 型（`types/index.ts` に追加）

```ts
export interface CaptionAsset {
  id: string
  label: string
  body: string
  category: string
  createdAt: string  // ISO
  updatedAt: string  // ISO
}
```

---

## 3. API

| メソッド | パス | リクエスト | レスポンス |
|---------|------|----------|------------|
| GET | `/api/caption-assets` | — | `{ assets: CaptionAsset[] }`（updated_at desc） |
| POST | `/api/caption-assets` | `{ label?, body, category? }` | `{ asset: CaptionAsset }` |
| PATCH | `/api/caption-assets/[id]` | `{ label?, body?, category? }` | `{ asset: CaptionAsset }` |
| DELETE | `/api/caption-assets/[id]` | — | `{ ok: true }` |

サーバ側ロジックは `lib/supabase/captionAssets.ts` に集約（`createServerClient` 使用）。

---

## 4. Format / Parse

### `lib/captionAssets/format.ts`
- `deriveLabel(body: string, explicitLabel?: string): string`
  - explicitLabel が trim 後で非空ならそれを使う
  - 空なら body から改行・前後空白を除き先頭 20 文字を取る
  - それも空（body が空白のみ）なら `"(無題)"`
- `listCategories(assets: CaptionAsset[]): string[]`
  - ユニークな空でない category を出現順で返す
- `groupByCategory(assets: CaptionAsset[]): Array<{ category: string; items: CaptionAsset[] }>`
  - 「未分類」(`""`) を最後に
  - 各グループ内は updated_at desc を維持

### `lib/supabase/captionAssetsParse.ts`
- snake_case Row ↔ camelCase TS の変換（既存 `parse.ts` / `serialize.ts` に倣う）

---

## 5. UI（CaptionBlock 拡張）

```
┌ 商品概要キャプション ────────────────────[編集][コピー]┐
│ ─── 文言アセット ─────────────────────────────────────│
│ [+ 追加]  カテゴリ: [販売条件 ▾]                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│ │※※期間限定×... │ │※※なくなり次第... │ │送料無料     │   │
│ │     [📋 コピー]│ │     [📋 コピー]│ │   [📋 コピー]│   │
│ └──────────────┘ └──────────────┘ └──────────────┘   │
│ ─────────────────────────────────────────────────────│
│ {既存のキャプション本文プレビュー / textarea}        │
└──────────────────────────────────────────────────────┘
```

- アセット領域は **編集モード・非編集モードとも常時表示**（Q3-α-A）
- 各ボタン: ラベル（自動生成 or k2 入力）+ body 先頭 20 文字を 2 行で表示
- 主アクション: クリック = body をクリップボードにコピー（Q4-A）
- 補助アクション: 各ボタンに小さく ✏（編集モーダル開く）/ × （削除確認）
- 「+ 追加」: モーダル（label 任意 / body 必須 / category datalist）
- カテゴリフィルタ: タブ or select で絞り込み（カテゴリが多くなった時用）

---

## 6. テスト方針

純ロジックは vitest で検証、Supabase ラッパは型レベルで担保（DB ラッパテストは既存も同様）。

- **P-FMT** `lib/captionAssets/format.ts`: deriveLabel / listCategories / groupByCategory
- **P-PRS** `lib/supabase/captionAssetsParse.ts`: parse / serialize の双方向変換

UI（CaptionBlock）は手動確認に委ねる（既存方針）。

---

## 7. Phase 分割

- **A.1** ✅予定: マイグレーション + lib + API + 基本 UI（追加・コピーまで）
- **A.2**: 編集 / 削除 / カテゴリフィルタの磨き込み（後日 k2 の使用感フィードバック後）
