# 作業進捗

## 現在の作業
- 機能: KUSOMEGANE アパレル商品管理ツール（**Phase 1 設計フェーズ**）
- 状態: Phase 1 設計確定（Q1〜Q5 すべて k2 回答済み）→ **k2 の準備チェックリスト着手 + Phase 1.1 のテスト設計に並行進行可**
- 次にやること:
  1. k2: `docs/preparation-checklist.md` の A〜D + E + G + H を上から順に完了
  2. Claude: Phase 1.1（Supabase 基盤）のテスト設計を `docs/test-spec.md` に追加
  3. k2 から E-1（リスト1 のヘッダースクショ）が届いたら sheetTemplate JSON 化
- ブロッカー: なし（並行進行可）
- 確定事項（2026-04-17）:
  - Q1: AI 着画 = ハイブリッド（Kling×2 + Nano Banana Pro×1、月$29.4）
  - Q2: Sheets = 新規シート方式、リスト1を雛形にする（雛形抽出のため k2 がスクショ共有）
  - Q3: モデル画像 = Phase 1.4 で Claude が AI 生成 → k2 採用判定
  - Q4: Drive 命名 = `[商品コード]_短縮商品名`
  - Q5: Vercel = Phase 1.4 で初回デプロイ（fal.ai webhook 用）

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

## 直近の完了タスク
- 2026-04-17 Phase 1 調査完了: 既存実装/着画AI/Google API/Supabase の4並列リサーチ → `docs/design-notes/phase1-plan.md` + `docs/design-notes/google-integration-prep.md` + `docs/preparation-checklist.md` 作成
- 2026-04-16 設計フェーズ完了: `docs/design-notes/kusomegane-apparel.md` 作成
- 2026-04-16 テスト設計完了: `docs/test-spec.md` に 23 テストケース追加（P0-CRITICAL 15件）
- 2026-04-16 Phase 0.1 完了: Next.js 16 + Tailwind v4 + Vitest + happy-dom 初期化、型定義、定数、LocalStorage 層（TC-STR-001〜006 全 PASS）
- 2026-04-16 Phase 0.2 完了: 商品番号採番・キャプション組み立て・次のアクション・サンプル到着カウントダウン（TC-PN-001〜004, TC-CAP-001〜006, TC-NXT-001〜003, TC-CDN-001〜004 全 PASS、P0-CRITICAL 15件 全 PASS）
- 2026-04-16 Phase 0.3 完了: ホーム画面 UI（ProductCard, ProgressBar, StatusBadge, SampleCountdown, Summary, FilterTabs, lib/productStatus.ts, lib/seed.ts, lib/colorPalette.ts, globals.css ブランドカラー）。build PASS、dev server 200 返却確認
- 2026-04-16 Phase 0.4 完了: 新規登録ウィザード（StepA〜D）+ Anthropic API route（/api/analyze-image, /api/generate-caption）+ 画像リサイズ（canvas 800px）+ lib/wizardState.ts + Chip/Field UI。build PASS
- 2026-04-16 Phase 0.5 完了: 商品詳細 /products/[id]（ヒーロー画像200px + 8STEPタイムライン + STEP5日付入力 + STEP7素材チェックリスト5項目 + キャプションコピー + 商品情報テーブル + 削除機能）。全 6 ルート build PASS、dev server 全 URL 200 返却

## 設計メモへのリンク
- [KUSOMEGANE アパレル商品管理ツール 設計メモ（Phase 0）](design-notes/kusomegane-apparel.md)
- [Phase 1 実装計画書](design-notes/phase1-plan.md)
- [Google API 統合準備](design-notes/google-integration-prep.md)
- [k2 準備チェックリスト](preparation-checklist.md)
