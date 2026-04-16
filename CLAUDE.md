# アリガトサン開発フレームワーク

## プロファイル

- 日本語で対話する（コード・ファイル名・コマンドは英語OK）
- 結論から先に言え。前置き・お世辞・リアクション不要
- わからないことは「わからない」と言え。推測で埋めるな
- 「良い感じに」「適切に」等の曖昧指示は受け付けるな。具体化を求めろ
- 500字以上の成果物は必ずファイルに保存しろ。チャットに流すだけは禁止

## 環境情報

- OS: macOS (Darwin 24.0.0)
- Shell: zsh
- Runtime: （プロジェクト開始時に設定）
- Framework: （プロジェクト開始時に設定）
- DB: （プロジェクト開始時に設定）
- デプロイ先: （プロジェクト開始時に設定）

> このフォルダは arigatosan-dev ワークスペース。新規プロジェクト開始時に Runtime 以下を埋める。未設定で実装を始めるな。

## 開発ワークフロー（TDD）

全ての実装は以下の順序で進める。順序の入れ替え禁止。

### STEP 1: 設計フェーズ
- ユーザーの要件をYES/NO・選択式の質問で徹底的に明確化する
- 曖昧な状態では絶対に実装に進まない
- 設計結果は `docs/design-notes/` に保存する

### STEP 2: テスト設計ファースト
- 実装より先に `docs/test-spec.md` にテストケースを追加・更新する
- テストデータが必要なら、テストデータ一覧にも追加する
- テスト設計を単独でcommitする

### STEP 3: 実装（RED → GREEN → REFACTOR 厳格分離）
各テストケースごとに以下のループを回す:
- **RED**: テストファイルのみ編集し、1つの failing test を追加
- **GREEN**: 実装ファイルのみ編集し、最小変更で PASS させる
- **REFACTOR**: 振る舞いを変えない整理のみ

複数 failing test を一度にRED化してまとめてGREENにするのは禁止。
Phase単位（4-5ステップ以内）で分割して進行する。

### STEP 4: 検証・commit
- TDD Ledger を出力する（変更ファイル・テスト実行結果・最小変更の根拠・想定される不正パターン）
- 全テストがPASSしてからcommitする
- `docs/progress.md` を更新する

### 既存機能の修正・拡張時
- STEP 2に戻る: テスト設計を先に更新してから実装

## TDD Integrity Contract（絶対契約）

AIがテストを「攻略」することを構造的に防ぐための絶対ルール。詳細は `.claude/rules/tdd-integrity-contract.md`。

### 常に禁止
- failing test の削除・skip化・only化・xfail化・todo化
- assertion を弱めること（`toBe` → `toBeTruthy` への後退等）
- snapshot / golden file の安易な一括更新（`-u` / `--updateSnapshot`）
- coverage threshold の引き下げ
- test 環境だけ通る分岐の追加（`if (process.env.NODE_ENV === 'test')`）
- テスト入力にだけ最適化したハードコード（`if (input === 'testValue')`）
- production code から test file / fixture を読むこと
- `sed -i` / `perl -pi` / `python -c` / `node -e` 等でのファイル直接書き換え（レビュー回避）
- Bash リダイレクトによるソースファイル書き換え（`> file.ts`, `>> file.py`）

### 違反検出時
作業を即座に停止し、ユーザーに報告する。自己判断で続行するな。

## セッション開始時の自動アクション

1. `docs/progress.md` を読み込んで前回の作業状況を把握する
2. `docs/test-spec.md` を読み込んでテスト状況を把握する
3. `git log --oneline -10` で直近の変更を確認する
4. ユーザーに現在の状況を要約して報告し、次のアクションを提案する

## 禁止事項

- 設計フェーズを飛ばして実装に入ること
- テスト設計なしでコードをcommitすること
- 推測でAPIやライブラリのメソッドを使うこと（公式ドキュメントを確認しろ）
- ユーザーの承認なしにファイルを削除すること
- .envファイルの内容を読み取ること・出力すること

## プラグイン前提条件

以下のClaude Codeプラグインが導入済みであること:
- `visual-explainer` — アーキテクチャ図・計画書・レビューのHTML生成
  - インストール: `/plugin marketplace add nicobailon/visual-explainer && /plugin install visual-explainer && /reload-plugins`
  - 主要コマンド: `/visual-explainer:generate-web-diagram`, `/visual-explainer:project-recap`

## Critical Path Protection（本番デプロイゲート）

決済・認証・データ整合性など、バグが本番に出たら致命的な機能は、GitHub Actionsで機械的にマージブロックする。

### 運用ルール
- テストケースに `P0-CRITICAL` を指定すると、CI（`.github/workflows/critical-tests.yml`）が自動実行する
- 1つでもFAILしたら mainブランチへのマージは不可（Branch Protection Rulesで強制）
- `--no-verify` や管理者権限によるバイパスは禁止
- flaky test は P0-CRITICAL から外すのではなく、根本原因を特定して修正する

詳細は `.claude/rules/critical-path-protection.md` を参照。

## 詳細ルール

以下のファイルに詳細が定義されている:
- `.claude/rules/tdd-workflow.md` — TDDワークフローの詳細手順
- `.claude/rules/tdd-integrity-contract.md` — TDD Integrity Contract（不正防止絶対契約）
- `.claude/rules/critical-path-protection.md` — 本番デプロイゲートCI運用ルール
- `.claude/rules/design-phase.md` — 設計フェーズの質問ルール
- `.claude/rules/session-continuity.md` — セッション継続の仕組み
- `.claude/rules/coding-standards.md` — コーディング規約
- `.claude/rules/git-workflow.md` — Git運用ルール
- `.claude/rules/mistakes.md` — やらかしログ（運用しながら育てる）

## スキル

- `.claude/skills/onboard-project/` — 既存プロジェクトへの自動導入（技術スタック検出・アーキテクチャ可視化・競合解消）
- `.claude/skills/tdd-integrity/` — RED→GREEN→REFACTOR厳格分離でTDDを強制実行
- `.claude/skills/test-design/` — テスト設計の追加・更新
- `.claude/skills/phase-commit/` — Phase完了時のcommitと進捗更新

## エージェント

- `.claude/agents/reviewer.md` — 読み取り専用レビュアー（TDD不正検出含む）
- `.claude/agents/security-check.md` — セキュリティ脆弱性スキャン
