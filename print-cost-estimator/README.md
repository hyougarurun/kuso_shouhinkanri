# print-cost-estimator (PoC)

KUSOMEGANE 加工費推定 PoC。過去の請求書データと ASTORE 製品管理シートから学習し、合成商品画像の加工費を推定する検証プロジェクト。

設計詳細: [`docs/design-notes/print-cost-estimation.md`](../docs/design-notes/print-cost-estimation.md)

## スタック

- TypeScript + Node.js (ESM)
- Vitest（テスト）
- `@anthropic-ai/sdk`（PDF パース・画像解析）

## Phase 構成

| Phase | 内容 |
|---|---|
| P1 | 請求書パーサー（PDF → JSON） |
| P2 | 正規化辞書（箇所・方法） |
| P3 | 加工費統計集計 |
| P4 | ボディ単価レンジ辞書 |
| P5 | ASTORE シート読み取り |
| P6 | 推論エンジン（ルールベース） |
| P7 | 類似画像検索補正（OpenCLIP） |
| P8 | 推論 UI |
| P9 | 精度検証（MAPE < 20%） |

## ディレクトリ

```
src/
├── types.ts           # 共通型
├── parser/            # P1: PDF パーサー
├── normalizer/        # P2: 正規化辞書
├── aggregator/        # P3: 統計集計
├── bodyPrice/         # P4: ボディ単価レンジ
├── sheets/            # P5: ASTORE シート読み取り
└── estimator/         # P6〜P7: 推論エンジン

tests/
├── fixtures/          # テストデータ（正解JSON）
└── **/*.test.ts

data/                  # .gitignore
├── raw/               # 請求書PDFを再配置
├── parsed/            # 構造化JSON
└── stats/             # 集計結果
```

## セットアップ

```bash
npm install
```

## テスト

```bash
npm test            # 1回実行
npm run test:watch  # watch モード
npm run typecheck   # 型チェック
```

## 環境変数

`.env`（`.gitignore` 対象）:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## 注意

- これは検証用 PoC であり、本番アプリ（`../kusomegane-apparel/`）とは独立して動作する
- PoC 完了後、Phase 2 で本体統合判断を行う
- 推定加工費は ASTORE シートには書き戻さない（ツール内のみで管理）
