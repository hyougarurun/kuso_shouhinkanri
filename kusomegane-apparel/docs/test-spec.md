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
| **合計** | **61** | **61** | **0** |

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
