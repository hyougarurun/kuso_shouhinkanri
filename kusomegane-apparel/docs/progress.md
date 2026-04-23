# 作業進捗

## 現在の作業
- 機能: Phase Caption v2（6キャラ雛形ベースへリライト）
- 状態: Phase C2.1（lib / API / UI リライト）完了
- 次にやること: /captions UI を実機で通し確認 → Phase C3（3件並列生成・各カード再生成）着手
- ブロッカー: なし
- 未解決の設計判断: 各キャラ titleLabel の最終確定文字列（k2 から全員分送付予定）

## テスト状況（サマリー）
- A〜K（既存）: 合計 61 件 全 PASS
- L. 投稿キャプション 状況メモパース: 5 件 ✅ PASS
- M. 投稿キャプション キャラ + プロンプト組み立て: 8 件 ✅ PASS（Phase C2.1）
- N. 投稿キャプション カウンター: 6 件 ✅ PASS（Phase C2.1）
- O. 投稿キャプション 最終キャプション組み立て: 7 件 ✅ PASS（Phase C2.1）
- vitest 実行上: 21 ファイル 119 件 all PASS

## 直近の完了タスク（新しい順）
- 2026-04-23 Phase C2.1: Phase Caption v2（6キャラ雛形ベース + カウンター + composeCaption）
- 2026-04-22 fix(ProductCard): gallery 追加サムネが 'thumb' 表示になる問題を修正 (3e0028f)
- 2026-04-22 feat: 背景タイトル後編集 + Animator ライブラリ Supabase 化 (3d5696e)
- 2026-04-22 fix(creator/bg): moderation_blocked 回避 + プロンプト完全上書きモード (fb9e292)
- 2026-04-21 Phase P: 背景生成アシスタント /creator/backgrounds (6326201)
- 2026-04-21 feat: KUSOMEGANE Animator を /animator で iframe 埋め込み + Supabase バックアップ (d4dac51)
- 2026-04-21 Phase G: 商品ギャラリーを Supabase Storage に移行 (6158cc1)
- 2026-04-20 Phase 1.4d: 合成機能削除 + 派生プロンプト柔軟化 (34b5590)
- 2026-04-19 Phase 1.4c: 合成画像生成（ベース + デザイン → 商品合成）(7f89999)
- 2026-04-19 Phase 1.4b: 派生バリエーション生成 + パフォーマンス改善 (2389bce)
- 2026-04-18 Phase 1.4a: base モデル画像基盤 (0c691f8)
- 2026-04-16 Phase 0.1〜0.7: MVP（ホーム / ウィザード / 詳細 / ボディ型番マスタ / 画像スロット拡張 / ZIP エクスポート等）

## Phase Caption 分割案（v2）
- ~~C1〜C2: プリセット機構・1件生成~~（破棄して v2 に置換）
- **C2.1** ✅: lib リライト（characters / buildPrompt / counters / composeCaption）+ API/UI 更新
- **C3**: 3件並列生成 + 再生成/コピー/編集ボタン
- **C4**: キャラプロンプト編集 UI（微調整）+ 文字数プリセットのキャラ別 default
- **C5**: Supabase ナレッジ保存 + 一覧/タグ検索
- **C6**: OpenAI / Gemini プロバイダ追加

## 設計メモへのリンク
- /docs/design-notes/phase-caption-v2.md（現行・6キャラ雛形ベース）
