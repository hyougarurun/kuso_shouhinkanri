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
| J. BaseModel serialize | 6 | 0 | 0 |
| **合計** | **51** | **45** | **0** |

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
