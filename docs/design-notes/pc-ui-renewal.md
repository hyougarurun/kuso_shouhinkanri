# PC UI フルリニューアル 設計メモ

## 1. 目的

KUSOMEGANE 商品管理ツール（`kusomegane-apparel`）を **PC 専用** UI にフルリニューアルする。併せて、商品管理と加工費推定（PoC 成果）を統合した一貫フローを構築する。

## 2. 確定事項（2026-04-18、k2 の「推奨で」指示に基づく）

| Q | 決定 | 備考 |
|---|---|---|
| Q1 ホームレイアウト | **A: 左右 2 カード横並び**（商品管理 + 加工費推定） | |
| Q2-1 加工費推測の入力 | **b: 画像 + 型番 + 加工箇所** | 画像から Claude Vision が推定、ユーザーが補正 |
| Q2-2 登録情報入力 | **a: 基本情報 + キャプションを 1 画面に統合** | PC 幅を活かす |
| Q2-3 登録完了 | **YES**（確認 + 保存 + 完了サマリー） | |
| Q3 BOX 表記 | **A: 各ステップを 1 つの大きな BOX** | k2 文言に最も素直 |
| Q4 横幅 | **B: 最大 1440px**（FHD 対応、ブラウザ幅広い時は中央寄せ） | |
| Q5 ナビ | **B: 左サイドバー固定** | PC らしさと機能拡張性 |
| Q6 Claude Design | **B: 私がテキスト仕様 → k2 確認 → Claude Design → 実装** | 本文書がテキスト仕様 |

## 3. 全体レイアウト

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR (48px)  ロゴ / パンくず / ユーザー                │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ SIDEBAR  │   MAIN AREA  max-w-[1440px] mx-auto          │
│  220px   │                                              │
│  固定    │                                              │
│          │                                              │
│ ▣商品管理 │                                              │
│ ▢加工費推定│                                              │
│          │                                              │
│ ---      │                                              │
│ 設定     │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

- サイドバー: 固定、メニュー選択でメインエリアが切り替わる
- メインエリア: `mx-auto max-w-[1440px] px-8`、背景 zinc-50
- カード: `rounded-lg border border-zinc-200 bg-white p-6 shadow-sm`

## 4. ホーム画面 `/`

```
┌─ MAIN ───────────────────────────────────────────────────┐
│  こんにちは、KUSOMEGANE           [+ 新規商品登録]          │
│                                                          │
│ ┌─── 商品管理 ────────────┐  ┌─── 加工費推定ツール ──┐     │
│ │ Summary: 45件中 進行中12│  │ 学習データ: 14請求書    │     │
│ │ [フィルタ: 全て/要確認...]│  │         1,930明細      │     │
│ │                         │  │                       │     │
│ │ ProductCard grid (2列)   │  │ [クイック推定を試す] │      │
│ │ - 画像                   │  │                       │     │
│ │ - 商品番号 / 商品名       │  │ 最近の推定履歴:        │     │
│ │ - ステータス / 進捗バー   │  │ • 5001-01: ¥2,424〜  │     │
│ │ - サンプル到着カウントダウン│ │ • 5044-01: 算出不可 │      │
│ │                         │  │                       │     │
│ └─────────────────────────┘  └───────────────────────┘   │
│       flex-[2]                     flex-[1]              │
└──────────────────────────────────────────────────────────┘
```

- 比率は **2:1**（商品管理がメイン、加工費推定は補助）
- 加工費推定カードは**クイック推定フォーム埋め込み**で、入力だけで完結する簡易版
- 「新規商品登録」ボタンで `/products/new` へ

## 5. 新規登録フロー `/products/new`（3 ステップ）

上部に **進行バー**（「1 加工費推測 / 2 登録情報 / 3 登録完了」）を常時表示。

### Step 1: 加工費推測

```
┌─ 進行バー: ●──○──○ ────────────────────┐

┌─ 大 BOX ─────────────────────────────────────────────┐
│ STEP 1 / 3  加工費推測                                 │
│                                                      │
│ ┌── 左カラム (画像) ───┐ ┌── 右カラム (入力) ──────┐   │
│ │ 画像ドラッグ&ドロップ │ │ ボディ型番 [5001-01]   │   │
│ │ プレビュー           │ │ 色 [ホワイト]           │   │
│ │ [画像解析 (AI)]      │ │ 加工箇所:              │   │
│ │                     │ │   [front] × [ink_print]│   │
│ │ 解析結果:            │ │   [back]  × [ink_print]│   │
│ │ ・front に印刷あり   │ │   [+ 追加]              │   │
│ │ ・…                 │ │                         │   │
│ └─────────────────────┘ └────────────────────────┘   │
│                                                      │
│ [加工費を推定する]                                    │
│                                                      │
│ ┌─ 推定結果 ────────────────────────────────┐        │
│ │ ボディ ¥574〜870  front ¥1,000  back ¥900  │       │
│ │ 加工費小計: ¥1,900                         │       │
│ │ ★ 商品単価合計: ¥2,474 〜 ¥2,770 ★          │       │
│ └──────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────┘

[← キャンセル]                             [次へ →]
```

- Step 1 の入力は **Step 2 に自動引継ぎ**（型番、色、画像など）
- 推定結果は wizardState に保持、Step 3 の完了画面でも表示

### Step 2: 登録情報入力

```
┌─ 進行バー: ●──●──○ ────────────────────┐

┌─ 大 BOX ────────────────────────────────────────┐
│ STEP 2 / 3  登録情報                            │
│                                                 │
│ ┌── 基本情報 ─────────┐ ┌── カラー・サイズ ───┐ │
│ │ 商品名 [     ]      │ │ カラー:              │ │
│ │ シリーズ [   ]      │ │  [+ホワイト][+レッド]│ │
│ │ 商品タイプ [ ▼]     │ │ サイズ:              │ │
│ │ 素材 [       ]      │ │  [M][L][XL] (ON/OFF)│ │
│ │ 受注生産 ☑          │ │                     │ │
│ │ 送料無料 ☑          │ │ ※Step1の型番・加工は│ │
│ │                    │ │  引継ぎ済み          │ │
│ └────────────────────┘ └─────────────────────┘ │
│                                                 │
│ ┌── キャプション生成 ──────────────────────┐    │
│ │ [AI で生成]  [手動編集]                  │    │
│ │ [ textarea: キャプション全文 ]           │    │
│ └───────────────────────────────────────┘    │
│                                                 │
│ ┌── 備考 ────────────────────────────────┐    │
│ │ [ textarea ]                            │    │
│ └───────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘

[← 戻る]                                 [次へ →]
```

### Step 3: 登録完了（確認 + 保存）

```
┌─ 進行バー: ●──●──● ────────────────────┐

┌─ 大 BOX ─────────────────────────────────────────────┐
│ STEP 3 / 3  内容確認・登録                             │
│                                                      │
│ ┌── ヘッダ ──────────────────────────────────┐      │
│ │ [画像240px]  商品名 / シリーズ              │      │
│ │             商品番号: 59 / 59-1 / 59-2     │      │
│ │             カラー: ホワイト・レッド・ブルー   │      │
│ │             サイズ: M / L / XL              │      │
│ └────────────────────────────────────────────┘      │
│                                                      │
│ ┌── 詳細 ────────────────────────────────────┐      │
│ │ 商品タイプ / 素材 / 加工種別 / ボディ型番     │      │
│ │ 受注生産 / 送料無料 / 備考                   │      │
│ └────────────────────────────────────────────┘      │
│                                                      │
│ ┌── キャプション ────────────────────────────┐      │
│ │ [整形表示 - readonly]                        │      │
│ └────────────────────────────────────────────┘      │
│                                                      │
│ ┌── 加工費推定（Step 1 より）──────────────────┐    │
│ │ ボディ ¥574〜870 / front ¥1,000 / ...       │    │
│ │ ★ 商品単価合計: ¥2,474 〜 ¥2,770 ★           │    │
│ └──────────────────────────────────────────┘    │
│                                                      │
│ Phase 1 で自動化予定: Drive/Sheets 追記             │
└──────────────────────────────────────────────────────┘

[← 戻って編集]                       [この内容で登録する]
```

## 6. デザイントークン（Tailwind）

```
/* カラー */
brand-yellow: #FBBF24
brand-black:  #0a0a0a
background:   #fafafa  (zinc-50)
surface:      #ffffff
border:       #e4e4e7  (zinc-200)
text:         #18181b  (zinc-900)
text-muted:   #71717a  (zinc-500)

/* スペーシング */
card-padding: 24px (p-6)
section-gap:  24px (gap-6)
main-max:     1440px
sidebar:      220px

/* フォント */
base:  14px / leading-relaxed
h1:    24px font-bold
h2:    18px font-bold
h3:    16px font-semibold
small: 12px
```

## 7. Claude Design に投入するプロンプト（k2 が使う雛形）

### 画面 1: ホーム（商品管理 + 加工費推定 2 分割）

```
Design the home screen of a PC-only apparel product management tool for KUSOMEGANE brand.

LAYOUT:
- Left sidebar (220px fixed, zinc-900 bg, yellow-400 accent)
  - Logo "KUSOMEGANE"
  - Nav items: 商品管理 (active), 加工費推定, 設定
- Top bar (48px) with breadcrumb and "新規商品登録" CTA button (yellow)
- Main area: max-w-[1440px], zinc-50 bg, padding 32px

MAIN CONTENT: Two cards side by side (grid-cols-3, left spans 2, right spans 1)

LEFT CARD (商品管理, flex-2):
- Header: "商品管理" + filter tabs (全て / 要確認 / 進行中 / 完了)
- Summary row: "45件中 進行中12 / 完了30 / 要確認3"
- Product grid 2-columns with cards showing:
  - Thumbnail 120px
  - Product number (bold, yellow highlight)
  - Product name
  - Status badge
  - Progress bar (Phase 1〜8 of 8)
  - Sample countdown "発送後3日目"

RIGHT CARD (加工費推定ツール, flex-1):
- Header: "加工費推定ツール" + PoC badge
- Stats: "学習データ 14請求書 / 1,930明細"
- Quick form: bodyCode input + location chips + "推定する" button
- Result area (initially empty, shows range + subtotal on submit)
- Recent estimates list (last 5)

STYLE:
- Cards: rounded-lg border-zinc-200 bg-white shadow-sm p-6
- Font: system-ui, JP-supported
- Typography: h1 24px bold, body 14px, muted 12px zinc-500
- Use brand-yellow (#FBBF24) only for CTAs and active nav highlight
- No mobile responsive, PC only
```

### 画面 2: 新規登録 Step 1（加工費推測）

```
Design STEP 1 of a 3-step product registration wizard for KUSOMEGANE.

TOP: Progress bar showing "1 加工費推測" active, "2 登録情報" pending, "3 登録完了" pending

MAIN: One large card (rounded-lg bg-white p-8 border) containing:

LEFT COLUMN (50%):
- Drag-and-drop image upload area (zinc-100 bg, dashed border)
- Preview when uploaded (max 400px height)
- "画像を解析する" button (blue)
- Result list: detected print locations and methods

RIGHT COLUMN (50%):
- Body code input: "ボディ型番" [5001-01]
- Color select: dropdown "ホワイト"
- Processing locations (dynamic list):
  - Row: location select + method select + delete button
  - "+ 加工箇所を追加" button
- Large "加工費を推定する" button (black bg, white text)

BELOW (full width):
- Estimate result section (appears after click):
  - Body price range
  - Processing breakdown table
  - Highlighted total: "商品単価合計 ¥1,574 〜 ¥1,870"
  - Based-on: "14請求書 1,930明細より"

FOOTER: "← キャンセル" (left) and "次へ →" (right, yellow if estimate completed)

Max width 1200px, centered.
```

### 画面 3: 新規登録 Step 2（登録情報） / 画面 4: Step 3（完了）
※ 同様の雛形を後で追加。Step 1 を先に Claude Design に投入して感触を確認後に調整。

## 8. 実装計画（Phase 分割）

| Phase | 内容 | 所要 |
|---|---|---|
| P1 | サイドバー + レイアウト基盤（layout.tsx 書き換え） | 1h |
| P2 | ホーム画面 2 分割（商品管理カード + 加工費推定カード） | 2h |
| P3 | 新規登録ウィザードを 3 ステップに再編（現行 A/B/C/D の論理移行） | 3h |
| P4 | Step 1: 加工費推測画面（現 D-2 の機能を Step 1 に前倒し） | 2h |
| P5 | Step 2: 登録情報入力（B+C を 1 画面に統合） | 2h |
| P6 | Step 3: 登録完了（確認 + 加工費表示 + 保存） | 1h |
| P7 | 商品詳細画面 PC 用調整（`/products/[id]`） | 2h |
| P8 | 動作確認・微調整・commit/push | 1h |

合計: **約 14 時間**（1〜2 日）

## 9. 既存機能との整合性

- 既存の `lib/storage.ts`, `lib/caption.ts`, `lib/productNumber.ts` 等はそのまま使う
- `/api/analyze-image`, `/api/generate-caption`, `/api/estimate-cost` もそのまま
- 画像解析結果（ImageAnalysis）を wizardState に保持する現行仕様は維持
- Phase 1（Supabase 移行）後も UI 構造は変わらない想定

## 10. 残論点

- **商品詳細画面** `/products/[id]` の PC リデザイン（Phase 4 相当）: 今回の範囲外
- **サイドバーの「加工費推定」メニュー**をクリック時に何を表示するか:
  - A) 独立した推定ツール画面（print-cost-estimator/page.tsx 相当）
  - B) ホーム画面の加工費推定カードに飛ぶだけ
  - → A を推奨（独立ツールとして使いたい場合に対応）
- **認証**: 将来 Supabase 統合時に必要。今回は対象外

## 11. 変更履歴

- 2026-04-18: 初版（k2 の「推奨で」確認に基づく）
