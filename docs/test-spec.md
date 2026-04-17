# テスト仕様書

> このファイルはプロジェクトのテスト設計を一元管理する。
> 実装より先にテストケースを追加・更新し、テスト設計をcommitしてから実装に入る（TDD）。

---

## テストデータ一覧

テスト実行に必要なデータを事前に準備する。データが存在しない場合、テストは実行不可。

| データID | データ名 | 作成方法 | 作成手順 | 確認方法 | 使用テストケース |
|---------|---------|---------|---------|---------|--------------|
| TD-LS-001 | 空の LocalStorage | 自動 | 各テストの `beforeEach` で `localStorage.clear()` を呼ぶ | `localStorage.length === 0` | TC-STR-001〜006, TC-PN-001〜002 |
| TD-PROD-001 | サンプル Product オブジェクト | ファクトリ関数 | `__tests__/fixtures/product.ts` の `makeProduct(overrides?)` を呼ぶ。戻り値は `types/index.ts` の `Product` 型を満たす最小データ | `product.id` が UUID 文字列で `product.productNumber` が `"59"` | TC-STR-002〜005, TC-CAP-001〜006, TC-NXT-001〜003, TC-CDN-001〜004 |
| TD-PROD-002 | 58番商品（既存最大値検証用） | ファクトリ関数 | `makeProduct({ productNumber: "58", baseProductNumber: 58 })` | `product.baseProductNumber === 58` | TC-PN-002 |
| TD-PROD-003 | 枝番商品（カラバリ最大番号検証用） | ファクトリ関数 | `makeProduct({ productNumber: "60-2", baseProductNumber: 60 })` | `product.baseProductNumber === 60` | TC-PN-002 |
| TD-SB-001 | モック Supabase クライアント | ファクトリ関数 | `__tests__/fixtures/supabaseMock.ts` の `makeSupabaseMock(overrides?)` を呼ぶ。`from()`, `storage.from().createSignedUrl()` 等を `vi.fn()` で差し替え可能なオブジェクトを返す | `client.from()` が `vi.fn()` インスタンス | TC-SB-001〜004 |
| TD-IMG-001 | サンプル ImageRecord（DB 行想定） | ファクトリ関数 | `__tests__/fixtures/imageRecord.ts` の `makeImageRecord(overrides?)` を呼ぶ。`{ id, product_id, image_type: 'composite', storage_path, bucket: 'product-images', sort_order: 0, is_primary: false }` 形式 | `record.image_type === 'composite'` | TC-SB-005, TC-SB-006 |
| TD-ENV-001 | 必須環境変数のセット/未セット切替 | テストヘルパ | `vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co')` / `vi.unstubAllEnvs()` | `process.env.SUPABASE_URL` の値が切り替わる | TC-SB-001 |
| TD-POC-FIX-001 | 2026/01 請求書パース結果の正解JSON | 手動作成 | `print-cost-estimator/tests/fixtures/invoice-2026-01.json` に `ParsedInvoice` 型で記述。`KUSOMEGANE様1月納品分ご請求金額.pdf`（合計 952,954円、明細 80〜120件）を元に手で起こす | `totalAmount === 952954` かつ `lineItems.length > 80` | TC-POC-P1-001〜002 |
| TD-POC-RAW-001 | 生 lineItem 文字列サンプル | インライン | テストコード内に `'メガメガ 14-1 front'`, `'メガメガ 袖ワッペン'`, `'メガメガ ローレンくん インク'`, `'5001-01 5.6オンス Tシャツ・XXLホワイト'`, `'たたみOPP入れ'` を直接記述 | 文字列が正しく渡る | TC-POC-CLS-001, TC-POC-NRM-001〜002 |

> **ルール:**
> - 新しいテストケースを追加する際、必要なテストデータがなければ先にこのテーブルに追加する
> - 作成手順は「この手順通りにやれば誰でも再現できる」レベルで記述する
> - ファクトリ関数 `makeProduct` は Phase 0.1 で `__tests__/fixtures/product.ts` に実装する

---

## 前提条件チェックリスト

テスト実行前に確認すべき環境・状態の一覧。

| チェック項目 | 確認方法 | 未達時の対処 |
|------------|---------|------------|
| Node.js 20 以上 | `node -v` で `v20.x.x` 以上 | `nvm install 20` |
| `kusomegane-apparel/` ディレクトリに Next.js プロジェクトが作成済み | `ls kusomegane-apparel/package.json` | Phase 0.1 の初期化タスクを実行 |
| 依存パッケージインストール済み | `ls kusomegane-apparel/node_modules/vitest` | `cd kusomegane-apparel && npm ci` |
| Vitest + jsdom セットアップ済み | `npm run test -- --version` が実行できる | Phase 0.1 で `vitest.config.ts` を作成 |

---

## テストケース一覧

### カテゴリ: A. LocalStorage 操作（`lib/storage.ts`）

> **モジュール目的:** Phase 0 のデータ永続化層。ブラウザ LocalStorage への Product / Draft の読み書きを一元化する。
> **P0-CRITICAL 指定理由:** ここが壊れると商品データが全消失する。復旧不能な破壊的影響。

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-STR-001 |
| **テスト名** | getProducts が初回呼び出し時に空配列を返す |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 初回起動時にエラーになり、アプリ全体が表示不能になる |
| **カテゴリ** | A. LocalStorage 操作 |
| **所要時間目安** | < 1秒（ユニットテスト） |
| **テストデータ要件** | TD-LS-001 |
| **前提条件** | - `beforeEach` で `localStorage.clear()` を呼んでいる<br>- `jsdom` 環境で Vitest を実行している |
| **UI実機パス** | ユニットテスト（UI操作なし）。実行: `cd kusomegane-apparel && npm run test -- storage.test.ts -t "TC-STR-001"` |
| **手順** | 1. `localStorage.clear()` を呼ぶ<br>2. `storage.getProducts()` を呼ぶ |
| **確認ポイント** | ✅ 戻り値が配列 `[]` であること<br>✅ throw が発生しないこと |
| **NG例** | ❌ `null` が返る → FAIL<br>❌ `JSON.parse` 系エラーが throw される → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/storage.test.ts`（`@critical` タグ付き） |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-STR-002 |
| **テスト名** | saveProducts で保存したデータが getProducts で取得できる |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | データ永続化が機能せず、登録した商品がリロードで消える |
| **カテゴリ** | A. LocalStorage 操作 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-LS-001, TD-PROD-001 |
| **前提条件** | `beforeEach` で `localStorage.clear()`。`makeProduct()` で Product オブジェクトを生成 |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- storage.test.ts -t "TC-STR-002"` |
| **手順** | 1. `const p = makeProduct()`<br>2. `storage.saveProducts([p])`<br>3. `const result = storage.getProducts()` |
| **確認ポイント** | ✅ `result.length === 1`<br>✅ `result[0].id === p.id`<br>✅ `result[0].productNumber === p.productNumber` |
| **NG例** | ❌ `result.length === 0` → FAIL（書き込みできていない）<br>❌ オブジェクト型が壊れている（例: colors が文字列化）→ FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/storage.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-STR-003 |
| **テスト名** | upsertProduct が新規商品を先頭に追加する |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 新規登録した商品がホーム画面の末尾や中間に挿入され、UXが壊れる |
| **カテゴリ** | A. LocalStorage 操作 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-LS-001, TD-PROD-001 |
| **前提条件** | 既存商品を1件 `saveProducts` 済み |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- storage.test.ts -t "TC-STR-003"` |
| **手順** | 1. `storage.saveProducts([makeProduct({ id: "A" })])`<br>2. `storage.upsertProduct(makeProduct({ id: "B" }))`<br>3. `const result = storage.getProducts()` |
| **確認ポイント** | ✅ `result.length === 2`<br>✅ `result[0].id === "B"`（新規は先頭）<br>✅ `result[1].id === "A"`<br>✅ `result[0].updatedAt` が ISO8601 形式 |
| **NG例** | ❌ 新規が末尾に追加される → FAIL<br>❌ `updatedAt` が未設定 → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/storage.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-STR-004 |
| **テスト名** | upsertProduct が既存 ID の商品を更新する |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 既存商品の編集が反映されず、常に新規として追加されて重複する |
| **カテゴリ** | A. LocalStorage 操作 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-LS-001, TD-PROD-001 |
| **前提条件** | 既存商品 1件保存済み |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- storage.test.ts -t "TC-STR-004"` |
| **手順** | 1. `storage.saveProducts([makeProduct({ id: "X", name: "旧名" })])`<br>2. `storage.upsertProduct(makeProduct({ id: "X", name: "新名" }))`<br>3. `const result = storage.getProducts()` |
| **確認ポイント** | ✅ `result.length === 1`（重複なし）<br>✅ `result[0].name === "新名"`<br>✅ `result[0].updatedAt` が更新されている |
| **NG例** | ❌ `result.length === 2` → FAIL（重複）<br>❌ name が "旧名" のまま → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/storage.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-STR-005 |
| **テスト名** | deleteProduct で指定 ID の商品が削除される |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 削除操作が効かない、または全件削除される（どちらも重大） |
| **カテゴリ** | A. LocalStorage 操作 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-LS-001, TD-PROD-001 |
| **前提条件** | 2件の商品を保存済み |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- storage.test.ts -t "TC-STR-005"` |
| **手順** | 1. `storage.saveProducts([makeProduct({ id: "A" }), makeProduct({ id: "B" })])`<br>2. `storage.deleteProduct("A")`<br>3. `const result = storage.getProducts()` |
| **確認ポイント** | ✅ `result.length === 1`<br>✅ `result[0].id === "B"` |
| **NG例** | ❌ 両方残る → FAIL（削除されない）<br>❌ 両方消える → FAIL（全件削除は重大バグ） |
| **自動テストパス** | `kusomegane-apparel/__tests__/storage.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-STR-006 |
| **テスト名** | getDraft/saveDraft/clearDraft が正しく動作する |
| **優先度** | P0 |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | ウィザード入力中にリロードするとデータが消える（データ損失の軽微版） |
| **カテゴリ** | A. LocalStorage 操作 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-LS-001 |
| **前提条件** | `localStorage.clear()` |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- storage.test.ts -t "TC-STR-006"` |
| **手順** | 1. `storage.getDraft()` → null を期待<br>2. `storage.saveDraft({ name: "下書き" })`<br>3. `storage.getDraft()` → `{ name: "下書き" }` を期待<br>4. `storage.clearDraft()`<br>5. `storage.getDraft()` → null を期待 |
| **確認ポイント** | ✅ 初期状態は null<br>✅ 保存後は保存内容が取得できる<br>✅ クリア後は null |
| **NG例** | ❌ 初期状態で例外が発生 → FAIL<br>❌ クリア後も値が残る → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/storage.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

### カテゴリ: B. 商品番号採番（`lib/productNumber.ts`）

> **モジュール目的:** 商品番号のユニーク採番。LocalStorage の既存商品から最大値を取得し +1 する。複数カラー時は枝番を付与する。
> **P0-CRITICAL 指定理由:** ダブりが発生すると Phase 1 で Drive フォルダ / Sheets 行が衝突し、物理的に運用が破綻する。

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-PN-001 |
| **テスト名** | LocalStorage が空のとき、次の商品番号は 59 になる |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 初回商品番号が想定外（58以下や100など）になり、既存スプシとの連番が狂う |
| **カテゴリ** | B. 商品番号採番 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-LS-001 |
| **前提条件** | `localStorage.clear()` |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- productNumber.test.ts -t "TC-PN-001"` |
| **手順** | 1. `localStorage.clear()`<br>2. `const n = getNextBaseNumber()` |
| **確認ポイント** | ✅ `n === 59`（現在の最大値 58 + 1） |
| **NG例** | ❌ `n === 1` → FAIL（初期値が反映されていない）<br>❌ `n === 58` → FAIL（+1 されていない） |
| **自動テストパス** | `kusomegane-apparel/__tests__/productNumber.test.ts`（`@critical`） |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-PN-002 |
| **テスト名** | 既存商品の最大 baseProductNumber + 1 が返る（枝番を含む） |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 商品番号の衝突。Drive フォルダ / Sheets 行の重複。 |
| **カテゴリ** | B. 商品番号採番 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-LS-001, TD-PROD-002, TD-PROD-003 |
| **前提条件** | 「58番通常商品」「60-2 枝番商品」の2件を LocalStorage に保存済み |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- productNumber.test.ts -t "TC-PN-002"` |
| **手順** | 1. `storage.saveProducts([makeProduct({ productNumber: "58", baseProductNumber: 58 }), makeProduct({ productNumber: "60-2", baseProductNumber: 60 })])`<br>2. `const n = getNextBaseNumber()` |
| **確認ポイント** | ✅ `n === 61`（最大値 60 + 1、枝番商品も正しく解釈される） |
| **NG例** | ❌ `n === 59` → FAIL（58 しか見ていない）<br>❌ `n === 62` → FAIL（ダブルカウント） |
| **自動テストパス** | `kusomegane-apparel/__tests__/productNumber.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-PN-003 |
| **テスト名** | assignProductNumbers はカラー1色のとき枝番なしを返す |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 単色商品に意図せず枝番（"59-1"）が付く、または無しで複数行生成される |
| **カテゴリ** | B. 商品番号採番 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | なし（純粋関数） |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- productNumber.test.ts -t "TC-PN-003"` |
| **手順** | 1. `const nums = assignProductNumbers(59, ["ブラック"])` |
| **確認ポイント** | ✅ `nums` が `["59"]` と deep-equal |
| **NG例** | ❌ `["59-1"]` → FAIL（1色なら枝番不要）<br>❌ 空配列 → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/productNumber.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-PN-004 |
| **テスト名** | assignProductNumbers はカラー複数のとき枝番付きを順序通り返す |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | カラバリ商品の Product レコード数・番号が狂い、Phase 1 のスプシ同期が破綻 |
| **カテゴリ** | B. 商品番号採番 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | なし |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- productNumber.test.ts -t "TC-PN-004"` |
| **手順** | 1. `const nums = assignProductNumbers(59, ["ブラック", "ホワイト", "ネイビー"])` |
| **確認ポイント** | ✅ `nums` が `["59-1", "59-2", "59-3"]` と deep-equal |
| **NG例** | ❌ `["59-0", "59-1", "59-2"]` → FAIL（0始まり禁止）<br>❌ 順序が崩れる → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/productNumber.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

### カテゴリ: C. キャプション組み立て（`lib/caption.ts`・`buildFullCaption`）

> **モジュール目的:** 02_REQUIREMENTS.md の固定テンプレに従い、商品情報とAI生成文を結合して最終キャプションを出力する。
> **P0-CRITICAL 指定理由:** 販売ページに出力される文面の整合性。受注生産フラグの取り違えや注意事項欠落は規約違反・返品リスクに直結する。

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CAP-001 |
| **テスト名** | 受注生産ON・送料無料ON のとき冒頭に2行の警告が出る |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 購入者に「受注生産」「送料無料」が告知されず、クレーム・返品要求の原因になる |
| **カテゴリ** | C. キャプション組み立て |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- caption.test.ts -t "TC-CAP-001"` |
| **手順** | 1. `const p = makeProduct({ isMadeToOrder: true, freeShipping: true, colors: ["ブラック"], material: "綿100% 5.6oz", processingType: "DTF" })`<br>2. `const text = buildFullCaption(p, "説明文です！", "デザイン説明")` |
| **確認ポイント** | ✅ 1行目 `※※※※※【この商品は受注生産商品です】※※※※※`<br>✅ 2行目 `※※※※※【この商品に送料はかかりません】※※※※※`<br>✅ 3行目が空行 |
| **NG例** | ❌ 警告行が欠落 → FAIL<br>❌ 順序が逆 → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/caption.test.ts`（`@critical`） |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CAP-002 |
| **テスト名** | 受注生産OFF・送料無料OFF のとき冒頭警告が出ない |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 在庫販売商品に誤って「受注生産」告知が出て購入者を混乱させる |
| **カテゴリ** | C. キャプション組み立て |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- caption.test.ts -t "TC-CAP-002"` |
| **手順** | 1. `const p = makeProduct({ isMadeToOrder: false, freeShipping: false })`<br>2. `const text = buildFullCaption(p, "説明文", "デザイン")` |
| **確認ポイント** | ✅ `text` に `受注生産商品です` が含まれない<br>✅ `text` に `送料はかかりません` が含まれない<br>✅ `text` は空でない（description以降は出力される） |
| **NG例** | ❌ 警告行が1行でも出る → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/caption.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CAP-003 |
| **テスト名** | 【商品情報】ブロックにカラー・デザイン・素材が含まれる |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 購入者が商品情報を確認できず、サイズ・カラー違いでクレーム発生 |
| **カテゴリ** | C. キャプション組み立て |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- caption.test.ts -t "TC-CAP-003"` |
| **手順** | 1. `const p = makeProduct({ colors: ["ブラック", "ホワイト"], material: "綿100% 5.6oz", processingType: "DTF" })`<br>2. `const text = buildFullCaption(p, "desc", "design-1文")` |
| **確認ポイント** | ✅ `text` に `【商品情報】` を含む<br>✅ `カラー：ブラック・ホワイト` を含む（中黒 `・` 区切り）<br>✅ `デザイン：design-1文` を含む<br>✅ `素材：綿100% 5.6oz` を含む |
| **NG例** | ❌ `カラー：ブラック,ホワイト`（カンマ区切り）→ FAIL<br>❌ `素材：` 行が欠落 → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/caption.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CAP-004 |
| **テスト名** | 加工種別に「刺繍」を含むと「※デザインは刺繍加工です。」が追加される |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 刺繍加工の注記が抜け、購入者が質感の期待値を誤る |
| **カテゴリ** | C. キャプション組み立て |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- caption.test.ts -t "TC-CAP-004"` |
| **手順** | 1. 純刺繍: `const p1 = makeProduct({ processingType: "刺繍" })`<br>2. 組み合わせ: `const p2 = makeProduct({ processingType: "刺繍+DTF" })`<br>3. 非刺繍: `const p3 = makeProduct({ processingType: "DTF" })`<br>4. それぞれ `buildFullCaption(p, "d", "dd")` を呼ぶ |
| **確認ポイント** | ✅ p1 の結果に `※デザインは刺繍加工です。` を含む<br>✅ p2 の結果にも含む（部分一致）<br>✅ p3 の結果には含まれない |
| **NG例** | ❌ `刺繍+DTF` で注記が出ない → FAIL（部分一致判定をミス）<br>❌ `DTF` で注記が出る → FAIL（誤検出） |
| **自動テストパス** | `kusomegane-apparel/__tests__/caption.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CAP-005 |
| **テスト名** | 受注生産ON のとき【注意事項】ブロックが末尾に追加される |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 3週間納期・返品不可の注意事項が表示されず、クレーム・返金要求が発生 |
| **カテゴリ** | C. キャプション組み立て |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- caption.test.ts -t "TC-CAP-005"` |
| **手順** | 1. `const p = makeProduct({ isMadeToOrder: true })`<br>2. `const text = buildFullCaption(p, "desc", "design")` |
| **確認ポイント** | ✅ `text` に `【注意事項】` を含む<br>✅ `※受注生産商品になりますので、お届けまで約3週間程度いただいております。ご了承の上お買い求めください。` を含む<br>✅ `※欠陥品を除いて返品、交換は受け付けておりませんのでご理解の程お願いいたします。` を含む（4行全て） |
| **NG例** | ❌ 4行のうち1行でも欠落 → FAIL<br>❌ 文言が要件定義書 02_REQUIREMENTS.md と1文字でも違う → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/caption.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CAP-006 |
| **テスト名** | 受注生産OFF のとき【注意事項】ブロックが出ない |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 在庫販売商品に「3週間納期」の誤告知が出て購入者を混乱させる |
| **カテゴリ** | C. キャプション組み立て |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- caption.test.ts -t "TC-CAP-006"` |
| **手順** | 1. `const p = makeProduct({ isMadeToOrder: false })`<br>2. `const text = buildFullCaption(p, "desc", "design")` |
| **確認ポイント** | ✅ `text` に `【注意事項】` を**含まない**<br>✅ `3週間程度` を含まない |
| **NG例** | ❌ 注意事項が1行でも出る → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/caption.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

### カテゴリ: D. 次のアクション計算（`lib/nextAction.ts`）

> **モジュール目的:** ホームカードの「次:」欄に表示する文字列を計算する。`currentStep` と `steps[]` から「次の未完了ステップ名」を導出し、全完了時は「✨ 販売中」を返す。
> **優先度:** P0（ホームでの表示情報。間違っても販売には影響しないが UX 重要）

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-NXT-001 |
| **テスト名** | 全未完了時、次のアクションは STEP 1「✏️ デザイン作成」を返す |
| **優先度** | P0 |
| **CI実行対象** | ❌（critical-tests.yml 対象外、pr-checks で実行） |
| **失敗時の影響** | ホームカードに意味不明な文字列が出る。販売には影響なし |
| **カテゴリ** | D. 次のアクション計算 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- nextAction.test.ts -t "TC-NXT-001"` |
| **手順** | 1. `const p = makeProduct()`（全 steps が status="pending"）<br>2. `const label = getNextActionLabel(p)` |
| **確認ポイント** | ✅ `label === "✏️ デザイン作成"`（アイコン + 名前）または同等の定義済み文字列 |
| **NG例** | ❌ 空文字 → FAIL<br>❌ 「STEP 1」のような番号表記 → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/nextAction.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-NXT-002 |
| **テスト名** | 途中まで完了時、最初の未完了ステップ名を返す |
| **優先度** | P0 |
| **CI実行対象** | ❌ |
| **失敗時の影響** | 次のアクションが間違って表示され、作業順序を誤る |
| **カテゴリ** | D. 次のアクション計算 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- nextAction.test.ts -t "TC-NXT-002"` |
| **手順** | 1. STEP 1〜3 を `status="done"` にした Product を作る<br>2. `const label = getNextActionLabel(p)` |
| **確認ポイント** | ✅ `label === "📤 メーカー共有（サンプル依頼）"`（STEP 4） |
| **NG例** | ❌ STEP 3 の名前が返る → FAIL（「次」の意味を取り違え）<br>❌ STEP 5 の名前が返る → FAIL（完了ステップをスキップしすぎ） |
| **自動テストパス** | `kusomegane-apparel/__tests__/nextAction.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-NXT-003 |
| **テスト名** | 全8ステップ完了時、「✨ 販売中」を返す |
| **優先度** | P0 |
| **CI実行対象** | ❌ |
| **失敗時の影響** | 完了商品に「次: STEP 9」などの破綻表記が出る |
| **カテゴリ** | D. 次のアクション計算 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- nextAction.test.ts -t "TC-NXT-003"` |
| **手順** | 1. 全8 step を `status="done"` にした Product を作る<br>2. `const label = getNextActionLabel(p)` |
| **確認ポイント** | ✅ `label === "✨ 販売中"` |
| **NG例** | ❌ undefined や空文字 → FAIL<br>❌ STEP 8 の名前が返る → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/nextAction.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

### カテゴリ: E. サンプル到着カウントダウン（`lib/sampleCountdown.ts`）

> **モジュール目的:** `sampleArrivalDate` から現在日までの残日数を計算し、カラー分類（赤/黄/通常）を返す。
> **優先度:** P0（表示情報）

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CDN-001 |
| **テスト名** | 残日数 4 日以上は色分類が "normal" を返す |
| **優先度** | P0 |
| **CI実行対象** | ❌ |
| **失敗時の影響** | ホームの色表示が崩れるが販売影響なし |
| **カテゴリ** | E. サンプル到着カウントダウン |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | なし（日付のみ） |
| **前提条件** | `vi.useFakeTimers()` で `2026-04-16T00:00:00Z` に固定 |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- sampleCountdown.test.ts -t "TC-CDN-001"` |
| **手順** | 1. `vi.setSystemTime(new Date("2026-04-16"))`<br>2. `const r = computeSampleCountdown("2026-04-30")`（残14日） |
| **確認ポイント** | ✅ `r.daysLeft === 14`<br>✅ `r.color === "normal"` |
| **NG例** | ❌ `color === "yellow"` や `"red"` → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/sampleCountdown.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CDN-002 |
| **テスト名** | 残日数 1〜3 日は色分類が "yellow" を返す |
| **優先度** | P0 |
| **CI実行対象** | ❌ |
| **失敗時の影響** | サンプル到着が近いのに注意喚起色が出ない |
| **カテゴリ** | E. サンプル到着カウントダウン |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | なし |
| **前提条件** | `2026-04-16` に固定 |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- sampleCountdown.test.ts -t "TC-CDN-002"` |
| **手順** | 1. 残3日: `computeSampleCountdown("2026-04-19")`<br>2. 残1日: `computeSampleCountdown("2026-04-17")` |
| **確認ポイント** | ✅ 両方とも `color === "yellow"`<br>✅ `daysLeft` がそれぞれ 3, 1 |
| **NG例** | ❌ 残4日が "yellow" になる → FAIL（境界バグ）<br>❌ 残1日が "red" になる → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/sampleCountdown.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CDN-003 |
| **テスト名** | 残日数 0 日以下は色分類が "red" を返す |
| **優先度** | P0 |
| **CI実行対象** | ❌ |
| **失敗時の影響** | サンプル到着遅延の警告が出ず、気付きが遅れる |
| **カテゴリ** | E. サンプル到着カウントダウン |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | なし |
| **前提条件** | `2026-04-16` に固定 |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- sampleCountdown.test.ts -t "TC-CDN-003"` |
| **手順** | 1. 当日: `computeSampleCountdown("2026-04-16")`<br>2. 1日超過: `computeSampleCountdown("2026-04-15")` |
| **確認ポイント** | ✅ 両方とも `color === "red"`<br>✅ `daysLeft` がそれぞれ 0, -1 |
| **NG例** | ❌ 残0日が "yellow" → FAIL<br>❌ 残-1 が "normal" → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/sampleCountdown.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-CDN-004 |
| **テスト名** | sampleArrivalDate 未設定時は null を返す |
| **優先度** | P0 |
| **CI実行対象** | ❌ |
| **失敗時の影響** | 未入力状態で NaN 表示や TypeError が発生しカードが壊れる |
| **カテゴリ** | E. サンプル到着カウントダウン |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | なし |
| **前提条件** | なし |
| **UI実機パス** | ユニットテスト。実行: `npm run test -- sampleCountdown.test.ts -t "TC-CDN-004"` |
| **手順** | 1. `const r1 = computeSampleCountdown(undefined)`<br>2. `const r2 = computeSampleCountdown("")` |
| **確認ポイント** | ✅ `r1 === null`<br>✅ `r2 === null`<br>✅ throw しない |
| **NG例** | ❌ オブジェクトが返る → FAIL<br>❌ TypeError が throw される → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/sampleCountdown.test.ts` |
| **最終検証日** | 2026-04-16 |
| **結果** | ⬜ 未実施 |

---

> **テストケース追加時のルール:**
>
> 1. 上記のフォーマットをコピーして使用する
> 2. `UI実機パス` は実際のルーティングとdata-testidを記載する。ボタンが見つからない場合の代替手段も書く。ユニットテストの場合は `npm run test -- <file>` のコマンドを明記する
> 3. `テストデータ要件` は必ずテストデータ一覧のIDを参照する。新規データが必要なら先にテストデータ一覧に追加する
> 4. `前提条件` は「この状態になっていないとテストが実行できない」を全て列挙する
> 5. `手順` は番号付きステップで、1ステップ1アクション。曖昧な表現（「適切に設定する」等）禁止
> 6. `NG例` はテスターが「これはFAILなのか判断に迷う」ケースを具体的に記載する
> 7. `最終検証日` はこの手順で実際に実行して確認した日付。30日以上経過したケースは再検証を推奨
>
### カテゴリ: F. Supabase クライアント基盤（`lib/supabase/*`）

> **モジュール目的:** Phase 1.1 で導入する Supabase クライアントのラッパ層。Service Role Key を持つサーバ専用クライアントの初期化、Storage の signed URL 発行、storage_path 構築、Product ⇔ DB row のシリアライズを担う。
> **P0-CRITICAL 指定理由:** ここの設定ミス・型ズレは「画像が表示されない」「DBに登録されない」「アップロード後に paths 衝突で上書きされる」など復旧不能な業務影響を起こす。

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-SB-001 |
| **テスト名** | createServerClient は SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定なら明示エラーを throw |
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 環境変数設定ミスに気付かず本番デプロイ → 起動後に Supabase 接続が黙って 401 を返し、画面は空のまま。原因特定に時間がかかる |
| **カテゴリ** | F. Supabase クライアント基盤 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-ENV-001 |
| **前提条件** | - `vi.unstubAllEnvs()` で環境変数を初期化済み<br>- `lib/supabase/server.ts` がエクスポートする `createServerClient` 関数が存在 |
| **UI実機パス** | ユニットテスト。実行: `cd kusomegane-apparel && npm run test -- supabaseServer.test.ts -t "TC-SB-001"` |
| **手順** | 1. `vi.unstubAllEnvs()` を実行<br>2. `createServerClient()` を呼ぶ<br>3. throw されたエラーをキャッチ |
| **確認ポイント** | ✅ Error が throw される<br>✅ エラーメッセージに `SUPABASE_URL` または `SUPABASE_SERVICE_ROLE_KEY` という変数名が含まれる<br>✅ `vi.stubEnv` で両方セットしてから再実行すると throw されない |
| **NG例** | ❌ undefined をそのまま supabase-js に渡して `Invalid URL` のような汎用エラーになる → FAIL（原因特定が困難）<br>❌ 片方未設定でも初期化が成功する → FAIL（事故の温床） |
| **自動テストパス** | `kusomegane-apparel/__tests__/supabaseServer.test.ts`（`@critical` タグ付き） |
| **最終検証日** | 2026-04-17 |
| **結果** | ⬜ 未実装 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-SB-002 |
| **テスト名** | issueSignedUrl はバケット名・パス・TTL を Supabase SDK に正しく渡し、URL 文字列を返す |
| **優先度** | P0 |
| **CI実行対象** | ❌（モックテストのため CI ブロック対象外） |
| **失敗時の影響** | 画像表示時に signed URL のクエリパラメータが壊れ、画面に画像が出ない |
| **カテゴリ** | F. Supabase クライアント基盤 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-SB-001 |
| **前提条件** | - `lib/supabase/signedUrl.ts` の `issueSignedUrl(bucket, path, ttlSec)` 関数が存在<br>- 内部で `supabase.storage.from(bucket).createSignedUrl(path, ttl)` を呼ぶ実装 |
| **UI実機パス** | ユニットテスト。`npm run test -- signedUrl.test.ts -t "TC-SB-002"` |
| **手順** | 1. `const mock = makeSupabaseMock({ storage: { signedUrl: 'https://x.supabase.co/storage/v1/object/sign/...' } })`<br>2. `issueSignedUrl(mock, 'product-images', 'products/abc/composite/01.jpg', 600)`<br>3. mock の呼び出し履歴を検証 |
| **確認ポイント** | ✅ 戻り値が `'https://...'` で始まる文字列<br>✅ `mock.storage.from` が `'product-images'` で1回呼ばれた<br>✅ `createSignedUrl` が `('products/abc/composite/01.jpg', 600)` で呼ばれた |
| **NG例** | ❌ TTL 引数を秒ではなく分で渡す（600 → 36000 秒になってしまう）→ FAIL<br>❌ バケット名と path を逆に渡す → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/signedUrl.test.ts` |
| **最終検証日** | 2026-04-17 |
| **結果** | ⬜ 未実装 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-SB-003 |
| **テスト名** | issueSignedUrl は Supabase エラー時にユーザー向け日本語メッセージで再 throw する |
| **優先度** | P0 |
| **CI実行対象** | ❌ |
| **失敗時の影響** | エラー時に英語のスタックトレースがそのまま画面に出る |
| **カテゴリ** | F. Supabase クライアント基盤 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-SB-001 |
| **前提条件** | - `issueSignedUrl` が Supabase の `{ data, error }` パターンに対応<br>- error.message が `'Object not found'` 等の英語の場合も再 throw する |
| **UI実機パス** | `npm run test -- signedUrl.test.ts -t "TC-SB-003"` |
| **手順** | 1. `const mock = makeSupabaseMock({ storage: { error: { message: 'Object not found' } } })`<br>2. `issueSignedUrl(mock, 'product-images', 'no/such/path.jpg', 600)` を呼ぶ<br>3. throw されたエラーをキャッチ |
| **確認ポイント** | ✅ Error が throw される<br>✅ エラーメッセージに「画像」「URL」「発行」のいずれかの日本語キーワードが含まれる<br>✅ 元の `'Object not found'` も `cause` で参照可能 |
| **NG例** | ❌ `error.message` を直接 throw して英語のままユーザーに見せる → FAIL<br>❌ throw せず `null` を返す → FAIL（呼び出し側がエラーを見逃す） |
| **自動テストパス** | `kusomegane-apparel/__tests__/signedUrl.test.ts` |
| **最終検証日** | 2026-04-17 |
| **結果** | ⬜ 未実装 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-SB-004 |
| **テスト名** | buildStoragePath は productId / image_type / 連番から `products/<uuid>/<type>/<index>.<ext>` 形式の一意なパスを返す |
| **優先度** | **P0-CRITICAL** |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | パス命名がブレると同じパスに別画像が上書きされ、商品Aの画像が商品Bに紛れる。復旧不能 |
| **カテゴリ** | F. Supabase クライアント基盤 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | なし（純関数） |
| **前提条件** | - `lib/supabase/storagePath.ts` の `buildStoragePath({ productId, imageType, sortOrder, mimeType })` 関数が存在 |
| **UI実機パス** | `npm run test -- storagePath.test.ts -t "TC-SB-004"` |
| **手順** | 1. `buildStoragePath({ productId: 'a1b2c3d4-...', imageType: 'composite', sortOrder: 0, mimeType: 'image/jpeg' })` を呼ぶ |
| **確認ポイント** | ✅ 戻り値が `products/a1b2c3d4-.../composite/00.jpg`<br>✅ `image/png` を渡すと `.png` 拡張子<br>✅ `image/webp` を渡すと `.webp` 拡張子<br>✅ `sortOrder: 12` を渡すと `12.jpg`（ゼロパディングなしでもよいが順序整合）<br>✅ 異なる `productId` または異なる `sortOrder` のとき必ず異なる文字列になる |
| **NG例** | ❌ 同じ productId + 同じ imageType + 同じ sortOrder で2回呼んだら別の文字列が返る（=非決定的）→ FAIL<br>❌ `image/heic` のような未対応 MIME を渡したらサイレントに `.bin` で返す → FAIL（`Error('未対応の画像形式')` を throw すべき） |
| **自動テストパス** | `kusomegane-apparel/__tests__/storagePath.test.ts`（`@critical` タグ付き） |
| **最終検証日** | 2026-04-17 |
| **結果** | ⬜ 未実装 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-SB-005 |
| **テスト名** | serializeProduct は Product 型を DB 行（snake_case + 配列保持）に正しく変換する |
| **優先度** | **P0-CRITICAL** |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | DB INSERT 時にカラム名ミスマッチで NULL が入り、商品が壊れた状態で保存される |
| **カテゴリ** | F. Supabase クライアント基盤 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | TD-PROD-001 |
| **前提条件** | - `lib/supabase/serialize.ts` の `serializeProduct(product: Product): ProductRow` 関数が存在<br>- `ProductRow` 型は migration `0001_init.sql` の `products` テーブル定義と一致 |
| **UI実機パス** | `npm run test -- serialize.test.ts -t "TC-SB-005"` |
| **手順** | 1. `const p = makeProduct({ productNumber: '59', baseProductNumber: 59, colors: ['黒','白'], sizes: ['M','L'], orderQuantities: { M: 3, L: 5 } })`<br>2. `const row = serializeProduct(p)` を呼ぶ |
| **確認ポイント** | ✅ `row.product_number === '59'`<br>✅ `row.base_product_number === 59`（型は number）<br>✅ `row.colors` が `['黒','白']` の配列のまま（JSON 文字列化されていない）<br>✅ `row.order_quantities` が `{ M: 3, L: 5 }` のオブジェクトのまま（jsonb 想定）<br>✅ camelCase の `productType` → snake_case の `product_type` に変換 |
| **NG例** | ❌ `row.colors` が `'["黒","白"]'` のような JSON 文字列になっている → FAIL（Postgres `text[]` 型に入らない）<br>❌ 未定義のフィールドを `null` ではなく `undefined` で返す → FAIL（supabase-js が無視してしまうため明示 null が必要） |
| **自動テストパス** | `kusomegane-apparel/__tests__/serialize.test.ts`（`@critical` タグ付き） |
| **最終検証日** | 2026-04-17 |
| **結果** | ⬜ 未実装 |

---

| 項目 | 内容 |
|------|------|
| **テストケースID** | TC-SB-006 |
| **テスト名** | parseProduct は DB 行（snake_case）を Product 型（camelCase）に正しく変換し、欠損カラムは型のデフォルト値で埋める |
| **優先度** | **P0-CRITICAL** |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | DB から取り出したデータの型が崩れ、UI が undefined を参照してクラッシュ |
| **カテゴリ** | F. Supabase クライアント基盤 |
| **所要時間目安** | < 1秒 |
| **テストデータ要件** | なし（最小行を inline で生成） |
| **前提条件** | - `lib/supabase/serialize.ts` の `parseProduct(row: ProductRow): Product` 関数が存在 |
| **UI実機パス** | `npm run test -- serialize.test.ts -t "TC-SB-006"` |
| **手順** | 1. `const row = { id: 'uuid-1', product_number: '60', base_product_number: 60, name: 'パーカー', colors: ['黒'], sizes: ['M'], order_quantities: {}, current_step: 1, ...必須カラム }` を inline 生成<br>2. `const product = parseProduct(row)` を呼ぶ |
| **確認ポイント** | ✅ `product.id === 'uuid-1'`<br>✅ `product.productNumber === '60'`（camelCase 変換）<br>✅ `product.colors` が `['黒']` のまま<br>✅ `product.orderQuantities` が `{}`（空オブジェクト）<br>✅ `serializeProduct(parseProduct(row))` がほぼ元の row と等しい（往復可逆性） |
| **NG例** | ❌ `product.productNumber` が undefined → FAIL（snake→camel 変換漏れ）<br>❌ jsonb カラムを誤って JSON.parse して二重デコード → FAIL |
| **自動テストパス** | `kusomegane-apparel/__tests__/serialize.test.ts`（`@critical` タグ付き） |
| **最終検証日** | 2026-04-17 |
| **結果** | ⬜ 未実装 |

---

> **判定基準:**
> - PASS: 確認ポイントが全て満たされている
> - FAIL: 確認ポイントのいずれかが満たされていない
> - SKIP: 前提条件不備 / テストデータ未準備 / 該当機能未実装
>
> **優先度（本番マージへの影響）:**
> - **P0-CRITICAL**: FAILなら本番マージ不可。CI（critical-tests.yml）で自動ブロック。決済・認証・データ整合性等
> - **P0**: 必須テスト。FAILは警告扱い。マージ前に要判断
> - **P1**: 重要だが本番マージはブロックしない
> - **P2**: できれば実施
>
> **P0-CRITICAL 指定基準:**
> 「このテストがFAILしたまま本番に出したら、ユーザーに実害が出るか？」で判断する。
> YESなら P0-CRITICAL。詳細は `.claude/rules/critical-path-protection.md` 参照。
>
> **重要度:**
> - 致命的: リリース不可。主要機能が動作しない、データ消失
> - 重要: リリース前に修正必須。表示崩れ、機能の一部不具合
> - 軽微: リリース後対応可。微調整レベル
> - 要望: 機能追加の提案

---

### カテゴリ: G. 加工費推定 PoC（`print-cost-estimator/src/*`）

> **モジュール目的:** 過去の請求書から加工費の統計を学習し、合成商品画像の加工費を推定する PoC エンジン。
> **優先度ポリシー:** 本番機能ではないため **P0-CRITICAL 指定なし**。全て `PoC` ラベルで管理し、CI 必須対象外（ブランチ `feature/print-cost-poc` 内のみ実行）。
> **テスト方針:** フル TDD ではなく「RED→GREEN→REFACTOR の最低限のループを各テストで回す」簡易モードで進める。
> 設計詳細: [`docs/design-notes/print-cost-estimation.md`](design-notes/print-cost-estimation.md)

**テストケース一覧（PoC-P1: 請求書パーサー + 正規化/分類辞書）**

| ID | テスト名 | 優先度 | 対象ファイル | テストパス |
|----|---------|-------|------------|-----------|
| TC-POC-CLS-001 | `classifyLineItem('メガメガ 14-1 front')` が `'processing_numbered'` を返す | PoC | `src/normalizer/classify.ts` | `tests/normalizer/classify.test.ts` |
| TC-POC-CLS-002 | `classifyLineItem('メガメガ ローレンくん')` が `'processing_named'` を返す（学習対象外タグ） | PoC | 同上 | 同上 |
| TC-POC-CLS-003 | `classifyLineItem('5001-01 5.6オンス Tシャツ・XXLホワイト')` が `'body'` を返す | PoC | 同上 | 同上 |
| TC-POC-CLS-004 | `classifyLineItem('たたみOPP入れ')` と `classifyLineItem('佐川急便 関西140サイズ')` が `'material_shipping'` を返す | PoC | 同上 | 同上 |
| TC-POC-NRM-001 | `normalizeLocation` が生データを正規化値に変換（front/back/袖→sleeve/両袖→both_sleeves/三か所→three_locations/空→unspecified） | PoC | `src/normalizer/location.ts` | `tests/normalizer/location.test.ts` |
| TC-POC-NRM-002 | `normalizeMethod` が生データを正規化値に変換（インク→ink_print/刺繍→embroidery/ワッペン→patch/相良取付→sagara_attach/空→unspecified） | PoC | `src/normalizer/method.ts` | `tests/normalizer/method.test.ts` |
| TC-POC-P1-001 | `parseInvoicePdf('2026-01.pdf')` の戻り値が `ParsedInvoice` 型の必須フィールドを満たす（sourceFile, totalAmount, lineItems[], parsedAt） | PoC | `src/parser/parseInvoicePdf.ts` | `tests/parser/parseInvoicePdf.test.ts` |
| TC-POC-P1-002 | 2026/01 PDF のパース結果が fixture と整合（totalAmount=952954、lineItems に `メガメガ 14-1 front` unitPrice=900 quantity=34 が存在） | PoC | 同上 | 同上 |

**補足**:
- TC-POC-P1-001〜002 は **Claude API 実呼び出しを含む** ため、`ANTHROPIC_API_KEY` 未設定時は `it.skipIf` でスキップする
- TC-POC-CLS-001〜004 / TC-POC-NRM-001〜002 は純関数の単体テスト。API キー不要
- fixture は `TD-POC-FIX-001` を参照
- 生文字列サンプルは `TD-POC-RAW-001` を参照

---

## サマリー

| カテゴリ | 総数 | P0-CRITICAL | P0 | P1 | P2 | PASS | FAIL | SKIP |
|---------|-----|------------|----|----|----|----|------|------|
| A. LocalStorage 操作 | 6 | **5** | 1 | 0 | 0 | 0 | 0 | 6 |
| B. 商品番号採番 | 4 | **4** | 0 | 0 | 0 | 0 | 0 | 4 |
| C. キャプション組み立て | 6 | **6** | 0 | 0 | 0 | 0 | 0 | 6 |
| D. 次のアクション計算 | 3 | 0 | 3 | 0 | 0 | 0 | 0 | 3 |
| E. サンプル到着カウントダウン | 4 | 0 | 4 | 0 | 0 | 0 | 0 | 4 |
| F. Supabase クライアント基盤（Phase 1.1） | 6 | **4** | 2 | 0 | 0 | 0 | 0 | 6 |
| G. 加工費推定 PoC（PoC-P1: パーサー/正規化/分類） | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 8 |
| **合計** | **37** | **19** | **10** | **0** | **0** | **0** | **0** | **37** |

> カテゴリ G は `PoC` ラベル（上表の優先度列とは別軸）で管理。CI 必須対象外。

### P0-CRITICAL テスト一覧（本番マージブロック対象）

CIで1つでもFAILするとmainブランチへのマージが不可になるテスト:

| ID | テスト名 | カテゴリ | 自動テストパス |
|----|---------|---------|--------------|
| TC-STR-001 | getProducts が初回呼び出し時に空配列を返す | A. LocalStorage | `kusomegane-apparel/__tests__/storage.test.ts` |
| TC-STR-002 | saveProducts で保存したデータが getProducts で取得できる | A. LocalStorage | 同上 |
| TC-STR-003 | upsertProduct が新規商品を先頭に追加する | A. LocalStorage | 同上 |
| TC-STR-004 | upsertProduct が既存 ID の商品を更新する | A. LocalStorage | 同上 |
| TC-STR-005 | deleteProduct で指定 ID の商品が削除される | A. LocalStorage | 同上 |
| TC-PN-001 | LocalStorage が空のとき、次の商品番号は 59 になる | B. 採番 | `kusomegane-apparel/__tests__/productNumber.test.ts` |
| TC-PN-002 | 既存商品の最大 baseProductNumber + 1 が返る（枝番を含む） | B. 採番 | 同上 |
| TC-PN-003 | assignProductNumbers はカラー1色のとき枝番なしを返す | B. 採番 | 同上 |
| TC-PN-004 | assignProductNumbers はカラー複数のとき枝番付きを順序通り返す | B. 採番 | 同上 |
| TC-CAP-001 | 受注生産ON・送料無料ON のとき冒頭に2行の警告が出る | C. キャプション | `kusomegane-apparel/__tests__/caption.test.ts` |
| TC-CAP-002 | 受注生産OFF・送料無料OFF のとき冒頭警告が出ない | C. キャプション | 同上 |
| TC-CAP-003 | 【商品情報】ブロックにカラー・デザイン・素材が含まれる | C. キャプション | 同上 |
| TC-CAP-004 | 加工種別に「刺繍」を含むと注記が追加される | C. キャプション | 同上 |
| TC-CAP-005 | 受注生産ON のとき【注意事項】ブロックが末尾に追加される | C. キャプション | 同上 |
| TC-CAP-006 | 受注生産OFF のとき【注意事項】ブロックが出ない | C. キャプション | 同上 |
| TC-SB-001 | createServerClient は SUPABASE_URL / SERVICE_ROLE_KEY 未設定で明示エラー | F. Supabase 基盤 | `kusomegane-apparel/__tests__/supabaseServer.test.ts` |
| TC-SB-004 | buildStoragePath が一意なパスを返す（衝突防止） | F. Supabase 基盤 | `kusomegane-apparel/__tests__/storagePath.test.ts` |
| TC-SB-005 | serializeProduct が DB 行へ正しく変換 | F. Supabase 基盤 | `kusomegane-apparel/__tests__/serialize.test.ts` |
| TC-SB-006 | parseProduct が DB 行を Product 型へ正しく変換 | F. Supabase 基盤 | 同上 |

---

## 変更履歴

| 日付 | 変更者 | 変更内容 | 関連commit |
|------|-------|---------|-----------|
| 2026-04-10 | - | テスト仕様書テンプレート作成 | 初期作成 |
| 2026-04-16 | Claude (k2指示) | KUSOMEGANE アパレル管理ツール Phase 0 のロジック層テストケース 23件を追加（TC-STR-001〜006, TC-PN-001〜004, TC-CAP-001〜006, TC-NXT-001〜003, TC-CDN-001〜004）。P0-CRITICAL 15件指定。テストデータ TD-LS-001/TD-PROD-001〜003 追加 | （このcommitで） |
| 2026-04-17 | Claude (k2指示) | Phase 1.1 用 カテゴリ F（Supabase クライアント基盤）テストケース 6件追加（TC-SB-001〜006、P0-CRITICAL 4件）。テストデータ TD-SB-001/TD-IMG-001/TD-ENV-001 追加。実 DB 接続は CI 対象外、純関数とモックで完結 | （このcommitで） |
| 2026-04-17 | Claude (k2指示) | 加工費推定 PoC 用 カテゴリ G（PoC-P1: パーサー/分類/正規化）テストケース 8件追加（TC-POC-CLS-001〜004, TC-POC-NRM-001〜002, TC-POC-P1-001〜002）。`PoC` ラベルで CI 必須対象外。テストデータ TD-POC-FIX-001/TD-POC-RAW-001 追加 | （このcommitで） |
