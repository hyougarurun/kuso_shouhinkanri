# テスト仕様書

## サマリー

| カテゴリ | 総数 | PASS | FAIL |
|---------|------|------|------|
| A. Storage層 | 6 | 6 | 0 |
| B. 商品番号採番 | 5 | 5 | 0 |
| C. キャプション生成 | 5 | 5 | 0 |
| D. 次のアクション | 4 | 4 | 0 |
| E. カウントダウン | 3 | 3 | 0 |
| F. ボディ型番マスタ | 8 | 8 | 0 |
| G. 商品複製 | 6 | 6 | 0 |
| H. 画像マイグレーション | 4 | 4 | 0 |
| I. ZIPエクスポート | 4 | 4 | 0 |
| J. BaseModel serialize | 6 | 6 | 0 |
| K. 入力履歴サジェスト | 10 | 10 | 0 |
| L. 投稿キャプション 状況メモパース | 5 | 0 | 0 |
| M. 投稿キャプション キャラ + プロンプト組み立て | 8 | 0 | 0 |
| N. 投稿キャプション カウンター | 6 | 0 | 0 |
| O. 投稿キャプション 最終キャプション組み立て | 7 | 0 | 0 |
| P. 文言アセット | 11 | 0 | 0 |
| Q. 商品番号 競合検出 | 5 | 0 | 0 |
| R. 請求書カタログ抽出 | 5 | 0 | 0 |
| **合計** | **108** | **61** | **0** |

注: B. 商品番号採番（既存 5 件）のうち TC-PN-003 / 004 は Phase E2 で「枝番採番廃止」仕様に書き換えるため、再 PASS が必要。

## H. 画像マイグレーション（Phase 0.7）

### TC-MIG-001: images未定義 + imagePreviewあり → composite補完
- **ファイル**: `__tests__/migrateProduct.test.ts`
- **優先度**: P0
- **期待結果**: `images.composite` に `imagePreview` の値が入り、他は null

### TC-MIG-002: images未定義 + imagePreviewもnull → 全てnull
- **ファイル**: `__tests__/migrateProduct.test.ts`
- **優先度**: P0
- **期待結果**: 全スロットが null

### TC-MIG-003: images既存 → そのまま返す
- **ファイル**: `__tests__/migrateProduct.test.ts`
- **優先度**: P0
- **期待結果**: 同一オブジェクト参照を返す

### TC-MIG-004: イミュータブル動作
- **ファイル**: `__tests__/migrateProduct.test.ts`
- **優先度**: P1
- **期待結果**: 元のproductが変更されない

## I. ZIPエクスポート（Phase 0.7）

### TC-EXP-001: buildProductInfoText 全フィールド
- **ファイル**: `__tests__/exportZip.test.ts`
- **優先度**: P0
- **期待結果**: 全フィールドがテキストに含まれる

### TC-EXP-002: buildProductInfoText 受注生産なし・送料有料
- **ファイル**: `__tests__/exportZip.test.ts`
- **優先度**: P0
- **期待結果**: 「なし」表記が正しい

### TC-EXP-003: dataUrlToUint8Array 正常変換
- **ファイル**: `__tests__/exportZip.test.ts`
- **優先度**: P0
- **期待結果**: base64 → Uint8Array に正しく変換

### TC-EXP-004: dataUrlToUint8Array 空データ
- **ファイル**: `__tests__/exportZip.test.ts`
- **優先度**: P1
- **期待結果**: 長さ0のUint8Arrayを返す

## J. BaseModel serialize/parse（Phase 1.4a）

### TC-BM-001: serializeBaseModel 全フィールドを Row 形式に変換
- **ファイル**: `__tests__/baseModelSerialize.test.ts`
- **優先度**: P0
- **期待結果**: camelCase → snake_case 変換、optional 値は null に

### TC-BM-002: serializeBaseModel sizeBytes / width / height undefined → null
- **ファイル**: `__tests__/baseModelSerialize.test.ts`
- **優先度**: P0
- **期待結果**: undefined は null に正規化

### TC-BM-003: parseBaseModel Row → BaseModel 変換
- **ファイル**: `__tests__/baseModelSerialize.test.ts`
- **優先度**: P0
- **期待結果**: snake_case → camelCase、null は undefined に

### TC-BM-004: parseBaseModel null フィールドの取り扱い
- **ファイル**: `__tests__/baseModelSerialize.test.ts`
- **優先度**: P0
- **期待結果**: size_bytes/width/height が null の場合 undefined になる

### TC-BM-005: buildBaseModelStoragePath フォーマット
- **ファイル**: `__tests__/baseModelSerialize.test.ts`
- **優先度**: P0
- **期待結果**: `base-models/<id>.<ext>` 形式、拡張子の `.` は除去、小文字化

### TC-BM-006: buildBaseModelStoragePath 大文字拡張子
- **ファイル**: `__tests__/baseModelSerialize.test.ts`
- **優先度**: P1
- **期待結果**: 拡張子が大文字でも小文字に正規化

## K. 入力履歴サジェスト（共通）

### TC-IH-001: 空キー → 空配列
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P0

### TC-IH-002: push したら load で取れる（新しい順）
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P0

### TC-IH-003: 同一値再 push で先頭に集約（重複排除）
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P0

### TC-IH-004: 空文字 / 空白のみは push されない
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P0

### TC-IH-005: 前後 trim される
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P0

### TC-IH-006: HISTORY_MAX 超過で古いものから押し出される
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P0

### TC-IH-007: 異なるキーは独立保存
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P0

### TC-IH-008: removeInputHistoryItem で個別削除
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P1

### TC-IH-009: clearInputHistory でキーごと削除（他キーは保持）
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P1

### TC-IH-010: 不正 JSON は空配列フォールバック
- **ファイル**: `__tests__/inputHistory.test.ts`
- **優先度**: P1

## L. 投稿キャプション 状況メモパース（Phase C1）

対象モジュール: `lib/postCaption/parseSituation.ts`

状況メモ textarea の入力（複数行・箇条書き記号混在）を、プロンプトに差し込み可能な正規化済み配列に変換する。

### TC-PS-001: 改行区切りで項目化
- **ファイル**: `__tests__/postCaption/parseSituation.test.ts`
- **優先度**: P0
- **入力**: `"朝寝坊\nコーヒー切れてた\n雨"`
- **期待結果**: `["朝寝坊", "コーヒー切れてた", "雨"]`

### TC-PS-002: 行頭 `-` / `・` / `*` は除去
- **ファイル**: `__tests__/postCaption/parseSituation.test.ts`
- **優先度**: P0
- **入力**: `"- 朝寝坊\n・コーヒー切れてた\n* 雨"`
- **期待結果**: `["朝寝坊", "コーヒー切れてた", "雨"]`

### TC-PS-003: 空行は除外
- **ファイル**: `__tests__/postCaption/parseSituation.test.ts`
- **優先度**: P0
- **入力**: `"朝寝坊\n\n\n雨"`
- **期待結果**: `["朝寝坊", "雨"]`

### TC-PS-004: 前後 trim（全角スペース含む）
- **ファイル**: `__tests__/postCaption/parseSituation.test.ts`
- **優先度**: P0
- **入力**: `"  朝寝坊　\n　雨　"`
- **期待結果**: `["朝寝坊", "雨"]`

### TC-PS-005: 空入力 → 空配列
- **ファイル**: `__tests__/postCaption/parseSituation.test.ts`
- **優先度**: P0
- **入力**: `""` / `"   "` / `"\n\n"`
- **期待結果**: `[]`

## M. 投稿キャプション キャラ + プロンプト組み立て（Phase C2.1）

対象モジュール: `lib/postCaption/characters.ts`, `lib/postCaption/buildPrompt.ts`

KUSOMEGANE 6 キャラ（ハリメガネズミ / クソメガネ母 / クソメガネ父 / さくら / いもうと / 兄）の定数と、
それを起点に AI プロンプトを構築するロジック。プリセット機構は廃止。

### TC-CH-001: CHARACTERS は 6 件で id がユニーク
- **ファイル**: `__tests__/postCaption/characters.test.ts`
- **優先度**: P0
- **期待結果**: 配列長は 6、`id` の重複なし、各エントリに `{ id, name, titleLabel, promptBody, defaultLength }` が揃う

### TC-CH-002: 期待されるキャラ id 6 種が全て存在
- **ファイル**: `__tests__/postCaption/characters.test.ts`
- **優先度**: P0
- **期待結果**: id セットが `["char-harimeganezumi", "char-kuso-mom", "char-kuso-dad", "char-sakura", "char-imouto", "char-ani"]` と一致

### TC-CH-003: getCharacter(id) で該当キャラを取得、不正 id は undefined
- **ファイル**: `__tests__/postCaption/characters.test.ts`
- **優先度**: P0
- **期待結果**: `getCharacter("char-harimeganezumi")?.titleLabel === "【ハリメガネズミの日記】"`、`getCharacter("missing") === undefined`

### TC-PP-001: buildPrompt 基本構造 — promptBody + 状況 + 文字数 + 「本文のみ」指示
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **入力**: `{ characterId: "char-harimeganezumi", situation: ["朝寝坊", "雨"], targetLength: 450 }`
- **期待結果**: プロンプトに以下を全て含む
  - キャラの `promptBody` の本文（例: 「おもしろおかしく日記風に説明」）
  - `"## 状況メモ"` セクション
  - `"- 朝寝坊"`、`"- 雨"`
  - `"450"`（文字数）
  - `"本文のみ"`（タイトル/タグ/Post No. を返さない指示）

### TC-PP-002: 状況メモが空配列なら「画像から読み取って」指示が入る
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **入力**: `{ characterId: "char-harimeganezumi", situation: [], targetLength: 450 }`
- **期待結果**: `"## 状況メモ"` セクションは出ず、「画像」または「イラスト」を含む推測指示が入る

### TC-PP-003: キャラごとに異なる promptBody が反映される
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **期待結果**: クソメガネ母 → 「スピリチュアル」「お母さん」を含む、いもうと → 「ひらがな」を含む、兄 → 「ヤンキー」「卍」を含む

### TC-PP-004: targetLength を省略するとキャラの defaultLength が使われる
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **入力**: `{ characterId: "char-ani", situation: [] }`（兄: defaultLength = 120）
- **期待結果**: プロンプトに `"120"` を含む

### TC-PP-005: 不正 characterId → 例外を投げる
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **入力**: `{ characterId: "char-unknown", situation: [], targetLength: 400 }`
- **期待結果**: 例外（メッセージに `"unknown character"` 等のヒント）

## N. 投稿キャプション カウンター（Phase C2.1）

対象モジュール: `lib/postCaption/counters.ts`

`localStorage` に「話数（episode）」「Post No.（postNo）」を **独立に** 永続化する。
未設定なら手動入力、設定済みなら +1 自動採番。

### TC-CT-001: 初期状態は null（未設定）
- **ファイル**: `__tests__/postCaption/counters.test.ts`
- **優先度**: P0
- **期待結果**: `getCounter("episode") === null`、`getCounter("postNo") === null`

### TC-CT-002: setCounter / getCounter ラウンドトリップ
- **ファイル**: `__tests__/postCaption/counters.test.ts`
- **優先度**: P0
- **期待結果**: `setCounter("episode", 143)` 後 `getCounter("episode") === 143`

### TC-CT-003: episode と postNo は独立保存
- **ファイル**: `__tests__/postCaption/counters.test.ts`
- **優先度**: P0
- **期待結果**: 片方を set しても他方は null のまま、両方 set 後はそれぞれ独立した値が返る

### TC-CT-004: bumpCounter で +1 して新値を返す（永続化される）
- **ファイル**: `__tests__/postCaption/counters.test.ts`
- **優先度**: P0
- **期待結果**: `setCounter("episode", 143)` → `bumpCounter("episode") === 144` → `getCounter("episode") === 144`

### TC-CT-005: 未設定の bumpCounter は例外
- **ファイル**: `__tests__/postCaption/counters.test.ts`
- **優先度**: P0
- **期待結果**: `bumpCounter("episode")` は `null` のとき例外を投げる（メッセージに「未設定」相当のヒント）

### TC-CT-006: 不正値（負・小数・NaN・Infinity）の setCounter は例外
- **ファイル**: `__tests__/postCaption/counters.test.ts`
- **優先度**: P1
- **期待結果**: `setCounter("episode", -1)` / `setCounter("episode", 1.5)` / `setCounter("episode", NaN)` 全て例外

## O. 投稿キャプション 最終キャプション組み立て（Phase C2.1）

対象モジュール: `lib/postCaption/composeCaption.ts`

タイトル / 話数 / 【○○の日記】 / AI 生成本文 / Post No. / `.` / `#KUSOMEGANE` / `#ショートアニメ` を組み立てて完成キャプション文字列を返す。

完成形フォーマット:
```
{title}#{episode}

【{titleLabel}】
{body}

Post No.{postNo}
.
#KUSOMEGANE
#ショートアニメ
```

### TC-CC-001: 完成形フォーマット全要素が含まれる（ハリメガネズミ / 実例）
- **ファイル**: `__tests__/postCaption/composeCaption.test.ts`
- **優先度**: P0
- **入力**: `{ title: "ダメージジーンズ病院で回復させメガネ", episode: 143, characterId: "char-harimeganezumi", body: "今日は父の病院受付の手伝い。", postNo: 168 }`
- **期待結果**: 戻り値が以下と完全一致
  ```
  ダメージジーンズ病院で回復させメガネ#143

  【ハリメガネズミの日記】
  今日は父の病院受付の手伝い。

  Post No.168
  .
  #KUSOMEGANE
  #ショートアニメ
  ```

### TC-CC-002: titleLabel はキャラから取得（クソメガネ母）
- **ファイル**: `__tests__/postCaption/composeCaption.test.ts`
- **優先度**: P0
- **期待結果**: `characterId: "char-kuso-mom"` のとき本文行直前に `"【クソメガネ母の日記】"` が入る

### TC-CC-003: 兄（titleLabel が「日記」でない）でも正しく組み立てる
- **ファイル**: `__tests__/postCaption/composeCaption.test.ts`
- **優先度**: P0
- **期待結果**: `characterId: "char-ani"` のとき `"【兄のデコログ】"` が入る

### TC-CC-004: body の前後改行・空白は trim される（中の改行は保持）
- **ファイル**: `__tests__/postCaption/composeCaption.test.ts`
- **優先度**: P0
- **入力**: `body: "\n\n  本文一行目\n本文二行目  \n\n"`
- **期待結果**: 出力中に `"本文一行目\n本文二行目"` が含まれ、その前後に余分な改行・空白が付かない

### TC-CC-005: 末尾は固定で `Post No.{n}\n.\n#KUSOMEGANE\n#ショートアニメ`
- **ファイル**: `__tests__/postCaption/composeCaption.test.ts`
- **優先度**: P0
- **期待結果**: 出力末尾が正規表現 `/Post No\.\d+\n\.\n#KUSOMEGANE\n#ショートアニメ$/` にマッチ

### TC-CC-006: 不正 characterId は例外
- **ファイル**: `__tests__/postCaption/composeCaption.test.ts`
- **優先度**: P0
- **期待結果**: `characterId: "char-unknown"` で例外

### TC-CC-007: title が空文字でも例外を投げず、1 行目は `#{episode}` のみになる
- **ファイル**: `__tests__/postCaption/composeCaption.test.ts`
- **優先度**: P1
- **入力**: `{ title: "", episode: 1, characterId: "char-harimeganezumi", body: "ほげ", postNo: 1 }`
- **期待結果**: 1 行目が `"#1"`（先頭にゴミ文字なし）。UI 側で必須バリデーションを掛ける前提

## P. 文言アセット（Phase A.1）

対象モジュール: `lib/captionAssets/format.ts`, `lib/supabase/captionAssetsParse.ts`

商品概要キャプション編集画面に出す「定型文言ボタン」のラベル自動生成・カテゴリ集計、および DB ↔ TS 変換。

### TC-AS-001: deriveLabel — explicit が非空ならそのまま返す
- **ファイル**: `__tests__/captionAssets/format.test.ts`
- **優先度**: P0
- **入力**: `deriveLabel("本文ABCDE", "期間限定")`
- **期待結果**: `"期間限定"`

### TC-AS-002: deriveLabel — explicit が空なら body 先頭 20 文字
- **ファイル**: `__tests__/captionAssets/format.test.ts`
- **優先度**: P0
- **入力**: `deriveLabel("あいうえお" + "あいうえお" + "あいうえお" + "あいうえお" + "あいうえお")` (25文字)
- **期待結果**: 先頭 20 文字（`"あいうえお" * 4`）

### TC-AS-003: deriveLabel — explicit が空白のみなら body から自動生成
- **ファイル**: `__tests__/captionAssets/format.test.ts`
- **優先度**: P0
- **入力**: `deriveLabel("本文", "  　 ")`
- **期待結果**: `"本文"`

### TC-AS-004: deriveLabel — body の前後改行・空白は除いて先頭から取る
- **ファイル**: `__tests__/captionAssets/format.test.ts`
- **優先度**: P0
- **入力**: `deriveLabel("\n\n  ABCDE\n  ", "")`
- **期待結果**: `"ABCDE"`

### TC-AS-005: deriveLabel — body も空白のみなら "(無題)"
- **ファイル**: `__tests__/captionAssets/format.test.ts`
- **優先度**: P0
- **入力**: `deriveLabel("   \n  ", "")`
- **期待結果**: `"(無題)"`

### TC-AS-006: listCategories — ユニーク・空除外・出現順保持
- **ファイル**: `__tests__/captionAssets/format.test.ts`
- **優先度**: P0
- **入力**: 4 件、category が `["販売条件", "", "配送", "販売条件"]`
- **期待結果**: `["販売条件", "配送"]`

### TC-AS-007: groupByCategory — カテゴリごとにまとめ、未分類("")を末尾
- **ファイル**: `__tests__/captionAssets/format.test.ts`
- **優先度**: P0
- **期待結果**: 戻り値の最後の要素が `category: ""` のグループ

### TC-AS-008: groupByCategory — 既存の updated_at desc 順を各グループ内で維持
- **ファイル**: `__tests__/captionAssets/format.test.ts`
- **優先度**: P1
- **期待結果**: 入力順が保たれる（呼び出し側で order 済みを前提）

### TC-AS-009: parseCaptionAsset — DB Row → TS（snake_case → camelCase）
- **ファイル**: `__tests__/captionAssets/parse.test.ts`
- **優先度**: P0
- **入力**: `{ id: "asset_1", label: "L", body: "B", category: "C", created_at: "2026-04-24T10:00:00Z", updated_at: "2026-04-24T11:00:00Z" }`
- **期待結果**: `{ id: "asset_1", label: "L", body: "B", category: "C", createdAt: "2026-04-24T10:00:00Z", updatedAt: "2026-04-24T11:00:00Z" }`

### TC-AS-010: serializeCaptionAsset — TS → DB Row Insert（id/created_at/updated_at は除外）
- **ファイル**: `__tests__/captionAssets/parse.test.ts`
- **優先度**: P0
- **期待結果**: `{ label, body, category }` のみ

### TC-AS-011: serializeCaptionAsset — category undefined / null は空文字に正規化
- **ファイル**: `__tests__/captionAssets/parse.test.ts`
- **優先度**: P1
- **期待結果**: `category: ""`

## Q. 商品番号 競合検出（Phase E1）

対象モジュール: `lib/productNumber.ts`

商品番号インライン編集時のリアルタイム競合チェック関数。

### TC-PNC-001: 競合なし → null
- **ファイル**: `__tests__/productNumber.test.ts`
- **優先度**: P0
- **入力**: products = `[{id:"a", productNumber:"58"}, {id:"b", productNumber:"60"}]`、candidate = `"59"`、selfId = `"a"`
- **期待結果**: `null`

### TC-PNC-002: 自分自身は競合扱いしない
- **ファイル**: `__tests__/productNumber.test.ts`
- **優先度**: P0
- **入力**: products = `[{id:"a", productNumber:"58"}]`、candidate = `"58"`、selfId = `"a"`
- **期待結果**: `null`

### TC-PNC-003: 他商品と完全一致 → その商品を返す
- **ファイル**: `__tests__/productNumber.test.ts`
- **優先度**: P0
- **入力**: products = `[{id:"a", productNumber:"58"}, {id:"b", productNumber:"60"}]`、candidate = `"60"`、selfId = `"a"`
- **期待結果**: id = `"b"` の Product

### TC-PNC-004: 前後 trim して比較
- **ファイル**: `__tests__/productNumber.test.ts`
- **優先度**: P0
- **入力**: products = `[{id:"a", productNumber:"58"}]`、candidate = `"  58  "`、selfId = `"x"`
- **期待結果**: id = `"a"`

### TC-PNC-005: candidate が空文字 / 空白のみ → null（バリデーションは UI 側）
- **ファイル**: `__tests__/productNumber.test.ts`
- **優先度**: P1
- **期待結果**: `null`

### TC-PN-003 (改): assignProductNumbers はカラー数によらず常に [base] 単一を返す（Phase E2）
- **ファイル**: `__tests__/productNumber.test.ts`
- **優先度**: P0
- **入力**: `assignProductNumbers(59, ["黒", "白", "青"])`
- **期待結果**: `["59"]`（旧仕様の `["59-1", "59-2", "59-3"]` から変更）

### TC-PN-004 (改): assignProductNumbers はカラー 0 件でも [base] を返す
- **ファイル**: `__tests__/productNumber.test.ts`
- **優先度**: P0
- **入力**: `assignProductNumbers(59, [])`
- **期待結果**: `["59"]`

## R. 請求書カタログ抽出（Phase G2）

対象モジュール: `lib/print-cost/extractCatalog.ts`

請求書 ParsedInvoice の配列から、bodyCode と color のユニーク一覧を抽出する。
QuickEstimateCard の datalist 候補に使う。

### TC-CAT-001: 空配列 → 空カタログ
- **ファイル**: `__tests__/printCost/extractCatalog.test.ts`
- **優先度**: P0
- **入力**: `[]`
- **期待結果**: `{ bodyCodes: [], colors: [] }`

### TC-CAT-002: 同じ bodyCode は集約、sampleCount は出現数の合計
- **ファイル**: `__tests__/printCost/extractCatalog.test.ts`
- **優先度**: P0
- **入力**: 5001-01 の body 行 3 件、5011-01 の body 行 1 件
- **期待結果**: `bodyCodes` 長さ 2、`5001-01` の `sampleCount === 3`

### TC-CAT-003: bodyCode が同じで bodyName が複数 → 最頻採択
- **ファイル**: `__tests__/printCost/extractCatalog.test.ts`
- **優先度**: P0
- **入力**: bodyCode `5001-01` で bodyName `"A"` 2 件 + `"B"` 1 件
- **期待結果**: `name === "A"`

### TC-CAT-004: color はユニーク・空文字とノイズ「カラー」を除外
- **ファイル**: `__tests__/printCost/extractCatalog.test.ts`
- **優先度**: P0
- **入力**: color `["ホワイト", "", "カラー", "ホワイト", "ナチュラル・カラー"]`
- **期待結果**: `["ホワイト", "ナチュラル・カラー"]`（カラー単独除外、`ナチュラル・カラー` は残す）

### TC-CAT-005: bodyCodes は sampleCount desc → code asc でソート
- **ファイル**: `__tests__/printCost/extractCatalog.test.ts`
- **優先度**: P1
- **期待結果**: 同件数の場合は code asc
