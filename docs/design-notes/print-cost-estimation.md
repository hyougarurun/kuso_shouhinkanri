# 加工費推定 PoC 設計メモ

## 1. 目的

合成商品画像をアップロードした際に、過去の請求書データと ASTORE 製品管理シートから学習した統計を使って、**加工費を自動推定**する機能を構築する。

運用しながら精度を上げる「継続学習型」のコスト推定エンジン。

---

## 2. スコープ

### 2.1 学習フェーズ
- **請求書PDF**: `~/Downloads/` 配下に存在する加工業者請求書（2024/09 ご注文分 〜 2026/01 納品分、計 14 ファイル）
- **ASTORE 製品管理シート**: https://docs.google.com/spreadsheets/d/1ZygaSDtEF5w3a8URi6dA4Don4YWZ0vmNFjx93zr1jU4/
  - 各シートに 1 商品が登録されている（A 列に合成商品画像）
- 学習結果は PoC 内ストレージに蓄積（ASTORE シートへは書き戻さない）

### 2.2 推論フェーズ
- 入力: **合成商品画像** + **ボディ型番** (例: `5001-01`) + **加工箇所チェックボックス** (front / back / 袖 / 両袖 / 刺繍三か所)
- 出力: 加工費の**内訳** + 合計推定値（例: `front インク 800 / back インク 1,000 / 袖ワッペン 600 → 合計 2,400円`）

### 2.3 非スコープ
- ASTORE シートへの書き込み（**読み取り専用**）
- 本番 Phase 1 機能との統合（PoC 完了後、別途 Phase 2 で統合判断）
- キャラ名付き商品（`メガメガ ローレンくん` 等）の学習（ルール化困難のため学習対象外）

---

## 3. 要件擦り合わせ結果（2026-04-17 確定）

| Q | 決定 | 備考 |
|---|---|---|
| Q1 開始時期 | **B**: Phase 1 と並行で PoC ブランチ検証 | Phase 1 の TDD サイクルとは切り離す |
| Q2 学習データ入手 | **A**: Downloads にある請求書 PDF を一括パース | |
| Q3 PDF 解析方針 | **C**: Claude API PDF 直接 → 精度不足なら pdfplumber + 正規表現 | |
| Q4 加工費推定ロジック | **C**: ハイブリッド（ルールベース + 類似画像検索） | |
| Q5 推定結果の粒度 | **B**: 内訳付き | |
| Q6 ASTORE シートへの関わり | **A**: 読み取り専用（推定加工費は ASTORE に見せず、ツール内のみで管理） | |
| Q7 合成商品画像の位置 | **A 列** | スクショ確認済 |
| Q8 ボディ単価表記 | 最小〜最大レンジ | 例: `5001-01 ホワイト: 633〜955円` |
| Q9 PDF 範囲 | 今ある分のみ（14 ファイル） | |
| Q10 正規表現ルール | 任せる | §5.2 に記載 |
| Q11 推論時の入力 | **C**: 画像 + ボディ型番 + 加工箇所チェック | 精度重視 |

---

## 4. 請求書 PDF カタログ（重複排除後、計 14 ファイル）

| # | ファイル名 | サイズ | 納品/発注月（推定） | 備考 |
|---|---|---|---|---|
| 1 | `KUSOMEGA様9月ご注文分ご請求書.pdf` | 654KB | 2024/09 ご注文 | ファイル名の KUSOMEGA は KUSOMEGANE のタイポ |
| 2 | `megamegakun_20240531-20250331/KUSOMEGANE様-11月納品分ご請求書.pdf` | 607KB | 2024/11 納品 | サブフォルダ |
| 3 | `KUSOMEGANE様11月納品分ご請求金額.pdf` | 761KB | 2024/11 納品 | ★ #2 と同月 → **内容重複 or 修正版の確認要** |
| 4 | `KUSOMEGANE様-12月納品分ご請求書.pdf` | 568KB | 2024/12 納品 | |
| 5 | `KUSOMEGANE様12月ご注文分ご請求金額.pdf` | 742KB | 2024/12 ご注文 | 納品月（#4）とは別 |
| 6 | `KUSOMEGANE様202501.pdf` | 339KB | 2025/01 | ★ **別業者の可能性**（サイズが他より小さい） |
| 7 | `KUSOMEGANE様_1月納品分御請求書.pdf` | 782KB | 2025/01 納品 | ★ #6 と同月 → 業者比較要 |
| 8 | `KUSOMEGANE様202502.pdf` | 339KB | 2025/02 | ★ **別業者の可能性** |
| 9 | `KUSOMEGANE様-2月納品分御請求書.pdf` | 558KB | 2025/02 納品 | ★ #8, #10 と同月 |
| 10 | `KUSOMEGANE様2月納品分ご請求金額.pdf` | 507KB | 2025/02 納品 | ★ 同月重複の確認要 |
| 11 | `KUSOMEGANE様_5月納品分御請求書.pdf` | 640KB | 2025/05 納品 | |
| 12 | `KUSOMEGANE様_6月納品分御請求書.pdf` | 612KB | 2025/06 納品 | |
| 13 | `KUSOMEGANE様8月発注分請求書.pdf` | 649KB | 2025/08 発注 | |
| 14 | `KUSOMEGANE様1月納品分ご請求金額.pdf` | 691KB | 2026/01 納品 | md5 重複した `(1)` 付きは除外済 |

**欠損月**: 2025/03, 2025/04, 2025/07, 2025/09, 2025/10, 2025/11, 2025/12

**アクション**: PoC Phase P1 の最初で、上記★の重複候補を中身 1 ページ目だけ確認し、発行者 / 請求番号で一意化する。

---

## 5. 請求書明細の分類ルール

### 5.1 明細タイプ（4 種）

| タイプ | パターン例 | 扱い |
|---|---|---|
| **ボディ** | `5001-015.6オンス ハイクオリティーTシャツ〈アダルト〉・XXLホワイト` | ボディ単価辞書に登録（§7） |
| **加工費（番号付き）** | `メガメガ 14-1 front`, `メガメガ 40 back`, `メガメガ 52-BK` | **学習対象**（§6） |
| **加工費（キャラ名付き）** | `メガメガ ローレンくん インク`, `メガメガ ラブくん 刺繍front` | **学習対象外**（ルール化困難） |
| **副資材・送料** | `たたみOPP入れ`, `タグ一辺縫い`, `佐川急便 関西140サイズ`, `ユナイテッドアスレ取り寄せ手数料`, `ボディ手配送料` | 固定辞書として別管理 |

### 5.2 加工費（番号付き）の判定正規表現

学習対象となる加工明細の識別ルール:

```
^メガメガ\s?(?<productNumber>\d+(-\d+(,\d+)?)?)(?<suffix>\s.*)?$
```

- 学習対象例:
  - `メガメガ 14-1 front` (商品14-1, front)
  - `メガメガ 14-1 back` (商品14-1, back)
  - `メガメガ 20-1 袖` (商品20-1, 袖)
  - `メガメガ 21-1,2 front` (商品21-1,2, front)
  - `メガメガ 38 インク` (商品38, 箇所未指定, 方法インク)
  - `メガメガ 52-BK` (商品52, 色BK, 箇所・方法未指定)
  - `メガメガ 55` (商品55, 他情報なし)

- 学習対象外例:
  - `メガメガ ローレンくん` (キャラ名含む)
  - `メガメガ ソデメガネ プリント三か所` (キャラ名)
  - `メガメガ 堺税メガネ front 刺繍` (キャラ名)

### 5.3 加工箇所の正規化辞書

| 生データ | 正規化 |
|---|---|
| `front` / `正面` | `front` |
| `back` / `bavk` (タイポ許容) | `back` |
| `袖` / `そで` | `sleeve` |
| `両袖` / `両腕` | `both_sleeves` |
| `三か所` / `3か所` / `プリント三か所` | `three_locations` |
| `袖ワッペン` | `sleeve_patch`（部品扱い） |
| （記載なし） | `unspecified` |

### 5.4 加工方法の正規化辞書

| 生データ | 正規化 |
|---|---|
| `インク` / `プリント` | `ink_print` |
| `刺繍` | `embroidery` |
| `ワッペン` | `patch` |
| `相良取付` / `相良縫付` | `sagara_attach` |
| （記載なし） | `unspecified` |

---

## 6. 学習データの構造

### 6.1 正規化後の加工明細スキーマ

```typescript
type ProcessingCostRecord = {
  invoiceFile: string;         // "KUSOMEGANE様1月納品分ご請求金額.pdf"
  invoiceDate: string;         // "2026/01/14"
  deliveryNumber: string;      // "6435"
  productNumber: string;       // "14-1" | "38" | "52-BK"
  location: NormalizedLocation;  // "front" | "back" | ...
  method: NormalizedMethod;    // "ink_print" | "embroidery" | ...
  unitPrice: number;           // 900
  quantity: number;            // 34
};
```

### 6.2 集計（推論用統計）

商品番号ごとに **画像 × (箇所×方法) ペア** の単価統計を持つ:

```typescript
type ProductCostStats = {
  productNumber: string;
  image: string;  // ASTORE A列の画像URL（1枚）
  records: {
    location: NormalizedLocation;
    method: NormalizedMethod;
    min: number;
    median: number;
    max: number;
    samples: number;
    lastSeen: string;  // 直近値上げ追従のため
  }[];
};
```

---

## 7. ボディ単価レンジ辞書

`(ボディ型番, 色) → [最低単価, 最高単価]` の辞書。

```typescript
type BodyPriceRange = {
  bodyCode: string;    // "5001-01"
  color: string;       // "ホワイト" | "カラー"
  minPrice: number;    // 633
  maxPrice: number;    // 955
  sizeExamples: string[];  // ["S~XL", "XXL", "XXXL"]
  lastSeen: string;
};
```

UI 表示例: `5001-01 ホワイト: ¥633〜¥955`

---

## 8. 推論ロジック（ハイブリッド）

### 8.1 入力
- 合成商品画像
- ボディ型番 (例: `5001-01`)
- 加工箇所チェックボックス (例: `front`, `back`, `袖`)

### 8.2 処理

1. **画像ベクトル化**: Claude API のマルチモーダルで画像の特徴量抽出 or CLIP 等で embeddings 生成
2. **類似画像検索**: 既存学習データの画像と cos 類似度で top-k 取得
3. **ルールベース初期値**:
   - 選択された加工箇所ごとに、学習データ全体の**中央値**を初期値として算出
4. **類似画像による補正**:
   - top-k の実績値が中央値から ±15% 以上ズレていれば、類似商品側の値に寄せる
5. **時系列補正**:
   - 直近 6 ヶ月のデータに重み 2.0、6〜12 ヶ月は 1.0、12 ヶ月以上は 0.5

### 8.3 出力

```json
{
  "bodyPrice": { "range": "633〜955", "bodyCode": "5001-01", "color": "ホワイト" },
  "processing": [
    { "location": "front", "method": "ink_print", "estimatedPrice": 800, "confidence": "high", "basedOn": 12 },
    { "location": "back", "method": "ink_print", "estimatedPrice": 1000, "confidence": "high", "basedOn": 10 },
    { "location": "sleeve", "method": "patch", "estimatedPrice": 600, "confidence": "medium", "basedOn": 5 }
  ],
  "subtotalProcessing": 2400,
  "notes": ["副資材・送料は別途"]
}
```

---

## 9. ディレクトリ構成（PoC）

```
packages/print-cost-estimator/           # 新規モノレポパッケージ
├── src/
│   ├── parser/              # PDF → 明細JSON
│   ├── normalizer/          # 加工箇所・方法の辞書
│   ├── aggregator/          # 統計集計
│   ├── bodyPrice/           # ボディ単価レンジ辞書
│   ├── sheets/              # ASTORE シート読み取り
│   ├── estimator/           # 推論エンジン（ルール+類似画像）
│   └── ui/                  # 検証用 Next.js ページ
├── tests/
├── data/
│   ├── raw/                 # 請求書PDFを再配置（.gitignore）
│   ├── parsed/              # 構造化JSON（.gitignore）
│   └── stats/               # 集計結果（.gitignore）
└── package.json
```

`data/` はサイズが大きいため git 管理外にする。

---

## 10. Phase 分割（PoC 内）

| Phase | 内容 | 成果物 |
|---|---|---|
| **P1** | 請求書パーサー（Claude API で JSON 化） | `parsed/*.json` |
| **P2** | 正規化辞書 + 4 タイプ分類 | `src/normalizer/` |
| **P3** | 加工費統計集計（番号付きのみ） | `stats/processing-cost-stats.json` |
| **P4** | ボディ単価レンジ辞書 | `stats/body-price-ranges.json` |
| **P5** | ASTORE シート読み取り（画像×商品番号マップ） | `stats/product-image-map.json` |
| **P6** | 推論エンジン（ルールベースのみ先行） | 関数 `estimate(image, bodyCode, locations)` |
| **P7** | 類似画像検索補正 | ベクトル DB（SQLite + pgvector or in-memory） |
| **P8** | 推論 UI（Next.js 検証ページ） | `/poc/print-cost` |
| **P9** | 精度検証（学習済商品で予測と実績を照合） | レポート |

各 Phase で TDD Ledger を出力する（本番と同じルール）。

---

## 11. 残論点（実装着手前に解決したい）

### 11.1 請求書の業者特定
2025/02 に 3 ファイル、2024/11 に 2 ファイル、2025/01 に 2 ファイル存在する。これが
- (a) 同じ業者の「下書き/修正版」なら片方を採用
- (b) 別業者（例: ユナイテッドアスレ vs メガメガくん）なら両方採用し業者タグを付与

どちらかを PoC P1 の最初で各 PDF の 1 ページ目を確認して判断する。

### 11.2 画像ベクトル化の手段

- A) Claude API（画像 → 特徴量テキスト記述 → text-embedding）
- B) OpenCLIP（ローカル、SigLIP 等）
- C) Vertex AI Multimodal Embeddings（Google）

PoC では **B** で始める想定（コスト 0、速い）。

### 11.3 ASTORE シートのシート数と命名

Phase 1 の `google-integration-prep.md` と整合を取る必要あり。
シートタブ名 = 商品番号（メガメガ 14-1 等）かどうかを k2 に確認する。

### 11.4 類似画像検索の k 値とマッチ閾値

PoC P7 で実データを見ながらチューニング。

---

## 12. 進行ルール（本番フレームワークからの逸脱）

PoC なのでフルの TDD は適用しないが、以下は厳守:

- **請求書パーサーの出力 JSON スキーマ** はテスト駆動（JSON 検証）
- **正規化辞書** は単体テストを書く
- **推論結果** は「学習済商品で MAPE < 20%」を目標（未達なら類似画像補正を強化）

本番統合時（Phase 2）は、フル TDD + Critical Path Protection を適用する。

---

## 13. ブランチ戦略

- `main`: Phase 1 と共有
- `feature/print-cost-poc`: PoC 専用ブランチ（main からの派生）
- PoC 内で Phase P1〜P9 を順に commit
- 完了後、`main` にマージせず、別リポジトリ化 or Phase 2 で本体に移植判断

---

## 14. 変更履歴

- 2026-04-17: 初版作成（Q1〜Q11 確定事項反映）
