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
| M. 投稿キャプション プロンプト組み立て | 6 | 0 | 0 |
| N. 投稿キャプション プリセット I/O | 5 | 0 | 0 |
| **合計** | **77** | **61** | **0** |

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

## M. 投稿キャプション プロンプト組み立て（Phase C1）

対象モジュール: `lib/postCaption/buildPrompt.ts`

プリセット本文 + 状況箇条書き + 文字数 + 文体 から、AI に投げるプロンプト文字列を構築する。

### TC-PP-001: 基本構造 — 指示 + 状況 + 文体 + 文字数
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **入力**: `{ presetBody: "日記風に仕上げて", situation: ["朝寝坊", "雨"], targetLength: 500, tone: "tame" }`
- **期待結果**: 以下を全て含む
  - `"日記風に仕上げて"`
  - `"- 朝寝坊"`
  - `"- 雨"`
  - `"500"`（文字数）
  - タメ口指示（例: "タメ口" を含む）

### TC-PP-002: 状況が空配列なら「画像から推測」指示を追加
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **入力**: `{ presetBody: "...", situation: [], targetLength: 500, tone: "tame" }`
- **期待結果**: 「画像」または「イラスト」を含む文言で推測を指示。箇条書きセクションは出ない。

### TC-PP-003: 文体 `desu` → です・ます調を指示
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **期待結果**: プロンプトに「です・ます」を含む

### TC-PP-004: 文体 `dearu` → だ・である調を指示
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **期待結果**: プロンプトに「だ・である」を含む

### TC-PP-005: targetLength が反映される
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P0
- **入力**: `targetLength: 800`
- **期待結果**: プロンプトに "800" を含む

### TC-PP-006: 不正トーン → タメ口フォールバック（クラッシュしない）
- **ファイル**: `__tests__/postCaption/buildPrompt.test.ts`
- **優先度**: P1
- **入力**: `tone: "invalid" as any`
- **期待結果**: 例外を投げず、デフォルト（タメ口）相当の指示が入る

## N. 投稿キャプション プリセット I/O（Phase C1）

対象モジュール: `lib/postCaption/presets.ts`

LocalStorage にプリセット（雛形プロンプト）を保存・読込・編集・削除する。

### TC-PR-001: 初回ロード時にデフォルト4プリセット（日記風/独り言風/ポエム風/ツッコミ風）
- **ファイル**: `__tests__/postCaption/presets.test.ts`
- **優先度**: P0
- **前提**: LocalStorage 空
- **期待結果**: 長さ4、各 preset に `{ id, name, body }`。`name` は `"日記風"`, `"独り言風"`, `"ポエム風"`, `"ツッコミ風"`

### TC-PR-002: savePresets で永続化、再 load で取れる
- **ファイル**: `__tests__/postCaption/presets.test.ts`
- **優先度**: P0
- **期待結果**: 保存 → load で同じ配列が返る

### TC-PR-003: プリセット追加・削除
- **ファイル**: `__tests__/postCaption/presets.test.ts`
- **優先度**: P0
- **期待結果**: `addPreset` で末尾追加、`removePreset(id)` で削除

### TC-PR-004: プリセット編集（body 変更）
- **ファイル**: `__tests__/postCaption/presets.test.ts`
- **優先度**: P0
- **期待結果**: `updatePreset(id, { body: "..." })` で該当プリセットだけ更新

### TC-PR-005: 不正 JSON → デフォルト4プリセットにフォールバック
- **ファイル**: `__tests__/postCaption/presets.test.ts`
- **優先度**: P1
- **前提**: LocalStorage に壊れた JSON
- **期待結果**: デフォルト 4 プリセットが返る（クラッシュしない）
