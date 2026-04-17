# 作業進捗

## 現在の作業
- 機能: **加工費推定 PoC**（画像から加工費を自動推定するエンジンの検証）
- 状態: **PoC-P1 完了（2026-04-17）**。feature/print-cost-poc ブランチで 8/8 テスト PASS
- 次にやること:
  1. PoC-P2 着手: 他 13 PDF の一括パース → `data/parsed/*.json` 生成
  2. PoC-P3: 加工費統計集計（番号付きメガメガ明細のみ）
  3. 業者調査は別タスク化（issuer が null で返ったため、プロンプト改善 or PDFヘッダ再確認が必要）
- ブロッカー: なし
- 進行方針: **直列処理**（Phase 1.1 と PoC の並行作業は避ける。PoC 完了後に Phase 1.1 を再開）
- 確定事項（2026-04-17 PoC）:
  - Q1 開始時期 = B（Phase 1 と並行ブランチ）
  - Q3 PDF 解析 = C（Claude API PDF 直接 → 精度不足なら pdfplumber）
  - Q4 推定ロジック = C（ルールベース + 類似画像検索ハイブリッド）
  - Q5 結果粒度 = B（内訳付き）
  - Q6 シート連携 = A（読み取り専用、推定加工費は ASTORE 非公開）
  - Q7 画像位置 = A 列
  - Q8 ボディ単価 = 最小〜最大レンジ表記
  - Q11 推論入力 = C（画像 + ボディ型番 + 加工箇所チェック）
  - Q14 業者調査 = 自律実行
- 設計メモ: `docs/design-notes/print-cost-estimation.md`

## 保留中の作業
- **Phase 1（KUSOMEGANE アパレル管理ツール本体）**
  - Phase 1.1 Supabase 基盤: テスト設計 commit 済（82df461）。**実装は PoC 完了まで待機**
  - 確定事項（2026-04-17 Phase 1）:
    - Q1: AI 着画 = ハイブリッド（Kling×2 + Nano Banana Pro×1、月$29.4）
    - Q2: Sheets = 新規シート方式、リスト1を雛形にする
    - Q3: モデル画像 = Phase 1.4 で Claude が AI 生成 → k2 採用判定
    - Q4: Drive 命名 = `[商品コード]_短縮商品名`
    - Q5: Vercel = Phase 1.4 で初回デプロイ（fal.ai webhook 用）
  - k2 側の準備: `docs/preparation-checklist.md` A〜D + E + G + H

## テスト状況（全 23 件 PASS）
- TC-STR-001〜006: LocalStorage 操作（P0-CRITICAL × 5, P0 × 1）✅ 6/6
- TC-PN-001〜004: 商品番号採番（**P0-CRITICAL** × 4）✅ 4/4
- TC-CAP-001〜006: キャプション組み立て（**P0-CRITICAL** × 6）✅ 6/6
- TC-NXT-001〜003: 次のアクション計算（P0 × 3）✅ 3/3
- TC-CDN-001〜004: サンプル到着カウントダウン（P0 × 4）✅ 4/4
- **P0-CRITICAL 合計: 15件 全 PASS**

## Phase 分割（Phase 0）
- Phase 0.1: プロジェクト初期化 + 型 + LocalStorage 層（TDD）
- Phase 0.2: 商品番号採番 + キャプション組み立て（TDD・P0-CRITICAL）
- Phase 0.3: ホーム画面 UI
- Phase 0.4: 新規登録ウィザード + Anthropic API route
- Phase 0.5: 商品詳細（8STEPタイムライン）

## Phase 分割（加工費推定 PoC）
- PoC-P1: 請求書パーサー（Claude API で PDF → JSON）
- PoC-P2: 正規化辞書（加工箇所・加工方法）
- PoC-P3: 加工費統計集計（番号付きメガメガ明細のみ）
- PoC-P4: ボディ単価レンジ辞書
- PoC-P5: ASTORE シート読み取り（画像 × 商品番号マップ）
- PoC-P6: 推論エンジン（ルールベース）
- PoC-P7: 類似画像検索補正（OpenCLIP）
- PoC-P8: 推論 UI（Next.js 検証ページ）
- PoC-P9: 精度検証（MAPE < 20% 目標）

## 直近の完了タスク
- 2026-04-17 **PoC-P1 完了**: 請求書パーサー実装。全 8 テスト PASS（分類4 + 正規化2 + Claude API実呼び出し2）。2026/01 PDF（合計 952,954円）から メガメガ14-1 front (900円×34枚) を自動抽出確認。Stream API + claude-sonnet-4-6、API 使用量 約 $0.41/PDF
  - commit: 3bc57c4（正規化層）, e1904c2（parseInvoicePdf 本体）
- 2026-04-17 加工費推定 PoC 設計完了: Q1〜Q14 確定 → `docs/design-notes/print-cost-estimation.md` 作成（請求書14 PDF カタログ、学習ルール、Phase 分割、ディレクトリ構成）
- 2026-04-17 Phase 1.1 テスト設計: Supabase クライアント基盤のテストケース6件追加（commit 82df461、PoC 完了まで実装保留）
- 2026-04-17 Phase 1 調査完了: 既存実装/着画AI/Google API/Supabase の4並列リサーチ → `docs/design-notes/phase1-plan.md` + `docs/design-notes/google-integration-prep.md` + `docs/preparation-checklist.md` 作成
- 2026-04-16 設計フェーズ完了: `docs/design-notes/kusomegane-apparel.md` 作成
- 2026-04-16 テスト設計完了: `docs/test-spec.md` に 23 テストケース追加（P0-CRITICAL 15件）
- 2026-04-16 Phase 0.1 完了: Next.js 16 + Tailwind v4 + Vitest + happy-dom 初期化、型定義、定数、LocalStorage 層（TC-STR-001〜006 全 PASS）
- 2026-04-16 Phase 0.2 完了: 商品番号採番・キャプション組み立て・次のアクション・サンプル到着カウントダウン（TC-PN-001〜004, TC-CAP-001〜006, TC-NXT-001〜003, TC-CDN-001〜004 全 PASS、P0-CRITICAL 15件 全 PASS）
- 2026-04-16 Phase 0.3 完了: ホーム画面 UI（ProductCard, ProgressBar, StatusBadge, SampleCountdown, Summary, FilterTabs, lib/productStatus.ts, lib/seed.ts, lib/colorPalette.ts, globals.css ブランドカラー）。build PASS、dev server 200 返却確認
- 2026-04-16 Phase 0.4 完了: 新規登録ウィザード（StepA〜D）+ Anthropic API route（/api/analyze-image, /api/generate-caption）+ 画像リサイズ（canvas 800px）+ lib/wizardState.ts + Chip/Field UI。build PASS
- 2026-04-16 Phase 0.5 完了: 商品詳細 /products/[id]（ヒーロー画像200px + 8STEPタイムライン + STEP5日付入力 + STEP7素材チェックリスト5項目 + キャプションコピー + 商品情報テーブル + 削除機能）。全 6 ルート build PASS、dev server 全 URL 200 返却

## 設計メモへのリンク
- [加工費推定 PoC 設計メモ](design-notes/print-cost-estimation.md) **← 現在アクティブ**
- [KUSOMEGANE アパレル商品管理ツール 設計メモ（Phase 0）](design-notes/kusomegane-apparel.md)
- [Phase 1 実装計画書](design-notes/phase1-plan.md)
- [Google API 統合準備](design-notes/google-integration-prep.md)
- [k2 準備チェックリスト](preparation-checklist.md)
