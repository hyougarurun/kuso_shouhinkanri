# Phase E 設計メモ — 商品番号編集 + 枝番採番の廃止

商品番号 (`productNumber`) を後から編集できるようにする。
同時に「複数色 → 自動 `nn-1, nn-2` 採番」のスタイルを廃止して、新規登録は常に単一商品 1 番号に統一する。

---

## 1. ユースケース

- k2 が登録後に商品番号の付け間違いに気づいたら、ヘッダーから直接書き換えたい
- 複数色を入れても自動で枝番が付く現挙動は今後不要。色違いも 1 商品 1 番号
- 既存データに残っている `nn-n` は編集 UI で k2 が手動で直す（マイグレーション不要）

---

## 2. Phase 分割

### Phase E1: 商品番号編集 UI + 競合チェック
- ヘッダーの `No.{productNumber}` をクリック → input に切り替わる（インライン）
- 入力中にリアルタイム競合チェック（自分以外の商品で同じ番号があれば警告）
- 競合中は保存ボタン無効
- 保存前に確認ダイアログ「Sheets / Drive 側の名前は手動で更新が必要です」
- 保存後は `update(...)` で `productNumber` を上書き、`updatedAt` も更新

### Phase E2: 枝番採番ロジックの廃止
- `assignProductNumbers(base, colors)` を **常に `[String(base)]` を返す**ように変更（colors 引数無視）
- 既存テスト TC-PN-003 / TC-PN-004 は新仕様に書き換え
- `app/products/new/page.tsx` の「カラー N 色 → 枝番自動採番」フッタ表示を削除
- `wizardToProducts` は既存ロジックのまま OK（productNumbers.length === 1 のとき全色 1 商品にまとめる分岐が既にある）
- `baseProductNumber` / `colorVariantIndex` は型として残す（既存データ互換）。新規は base のみ・variant は undefined

---

## 3. 競合チェック

`lib/productNumber.ts` に以下を追加:

```ts
export function findConflictingProduct(
  candidate: string,
  selfId: string | null,
  products: Product[]
): Product | null
```

- candidate の前後 trim
- 空文字 → null（バリデーションは UI 側で別途）
- 自分自身（`selfId === product.id`）は除外
- 完全一致 (`p.productNumber === candidate`) で最初にヒットしたものを返す
- ヒットしなければ null

---

## 4. 編集 UI 仕様

### `app/products/[id]/page.tsx` ヘッダー部分

```
[戻る] No.{productNumber}  {名前}                [Status]
        ↑ クリックで [No.] [_____] [×][✓ 保存]
```

### 状態
- `editingNumber: boolean`
- `draftNumber: string`
- `conflict: Product | null`（draftNumber に基づく competitor）

### 振る舞い
- ヘッダーの `No.{productNumber}` ボタンクリック → editing 開始、draft = 現在値
- input onChange で draft 更新 → 同時に conflict を再計算
- conflict あり → 「⚠ 商品「{competitor.name}」(id末尾) と重複」を warn 表示、保存ボタン disable
- 「保存」 → confirm("Sheets / Drive 側のフォルダ名や行は手動で直してください。続行しますか？") → OK で `update({ ...product, productNumber: trimmedDraft })` 後 editing 解除
- 「×」キャンセル → editing 解除、draft 破棄
- draft が trim 後で空 → 保存ボタン disable

---

## 5. テスト方針

純ロジックのみ vitest:

- **Q-CONF**: `findConflictingProduct` の競合検出（5 件）
- **R-PN**: `assignProductNumbers` の単純化（既存 TC-PN-003 / 004 を書き換え、3 件）

UI（編集 input・dialog）は手動確認に委任。

---

## 6. 影響箇所

E1 で触る:
- `lib/productNumber.ts`（findConflictingProduct 追加）
- `app/products/[id]/page.tsx`（ヘッダー編集 UI）
- `__tests__/productNumber.test.ts`（Q-CONF 追加）

E2 で触る:
- `lib/productNumber.ts`（assignProductNumbers 単純化）
- `app/products/new/page.tsx`（枝番表示フッタ削除）
- `__tests__/productNumber.test.ts`（TC-PN-003 / 004 書き換え）
- `lib/wizardState.ts`（既に対応済みなので変更不要、確認のみ）
