# Critical Path Protection ルール

本番環境にバグを出したら致命的な機能（決済・認証・データ整合性等）を守るための運用ルール。
staging → production へのマージを CI で機械的にゲートする。

---

## 原則

1. **本番マージは CI 必須** — GitHub Actionsで重要テストが全てPASSしなければmainにマージできない
2. **Critical Pathの明示** — どのテストが本番ブロック対象か test-spec.md に明記する
3. **Branch Protection必須** — GitHubのブランチ保護ルールで人間も含めて強制する
4. **スキップ禁止** — CIを`--no-verify`や管理者権限でバイパスすることを禁止する

---

## テスト優先度の3段階

| 優先度 | マーカー | 本番マージ可否 | 実行タイミング |
|-------|---------|--------------|--------------|
| **P0-CRITICAL** | `[P0-CRITICAL]` | 1つでもFAILなら**マージ不可** | PR作成時・マージ前に必ず実行 |
| **P0** | `[P0]` | FAILは警告。マージは可能だが要判断 | PR作成時に実行 |
| **P1 / P2** | `[P1]` / `[P2]` | マージには影響しない | 定期実行・リリース前実行 |

### P0-CRITICAL に該当するテスト

以下に該当するものは原則 P0-CRITICAL に指定する:

- **決済処理** — 金額計算、Stripe/決済代行連携、返金、サブスク更新
- **認証・認可** — ログイン、セッション管理、権限チェック、パスワードリセット
- **データ整合性** — DB書き込みの一貫性、トランザクション、外部キー制約
- **個人情報保護** — ユーザーデータの暗号化、GDPR/個人情報漏洩防止
- **契約違反の防止** — 料金プランの上限、利用規約上の制限
- **復旧不能な操作** — データ削除、メール送信、外部API呼び出し

### 判断基準

「このテストがFAILしたまま本番に出したら、ユーザーに実害が出るか？」

- YES → P0-CRITICAL
- 実害は出ないが品質低下 → P0
- 使い勝手の問題 → P1 / P2

---

## CI ワークフロー

### ファイル配置

```
.github/workflows/
├── critical-tests.yml      # staging→main PR時に必須実行
├── regression-tests.yml    # 定期実行（毎日 or 週次）
└── pr-checks.yml          # 全PRで実行（lint, typecheck, unit）
```

### critical-tests.yml の責務

- **トリガー**: mainブランチへのPR、mainへの直接push
- **実行内容**:
  1. テスト仕様書から `[P0-CRITICAL]` タグのテストを抽出
  2. 対応するテストスイートを実行
  3. E2Eテスト（Playwright等）の critical path を実行
  4. 1つでもFAILしたらCI失敗
- **副作用**: 失敗時はPRにコメントで失敗内容を投稿

### Branch Protection 必須設定

GitHubの Settings → Branches → Branch protection rules で以下を設定する:

```
Branch name pattern: main

✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  Required status checks:
    - critical-tests / run-critical-tests  ← これを必須にする
    - pr-checks / lint
    - pr-checks / typecheck

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings
  ⚠ Include administrators にチェック  ← 管理者もバイパス不可
```

**この設定なしでフレームワークを運用しても CI は形骸化する。** 必ずBranch Protectionを併用せよ。

---

## test-spec.md での Critical Path 明示

テストケースに `[P0-CRITICAL]` タグをつける。優先度フィールドに記載:

```markdown
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 決済が実行できず、ユーザーが購入できない |
```

サマリーテーブルにも `P0-CRITICAL` カラムを追加する:

```markdown
| カテゴリ | 総数 | P0-CRITICAL | P0 | P1 | P2 | PASS | FAIL |
|---------|------|------------|----|----|----|----|----|
| A. 認証 | 5 | **2** | 2 | 1 | 0 | 5 | 0 |
| B. 決済 | 8 | **6** | 2 | 0 | 0 | 8 | 0 |
```

---

## 運用ルール

### 新規テストケース追加時
1. そのテストが本番で失敗した場合のユーザー影響を評価する
2. ユーザーに実害が出るなら `P0-CRITICAL` 指定
3. CI（critical-tests.yml）が自動でそのテストを拾うことを確認する

### P0-CRITICALテストがFAILした場合
1. **絶対にマージしない**（Branch Protection が物理的に阻止する）
2. 失敗原因を特定する
3. 修正 → 再テスト → PASS確認後にマージ
4. 失敗が誤検知（flaky test）だった場合 → mistakes.md に記録して原因を潰す

### flaky testの扱い
- flaky testは P0-CRITICAL から一時的に格下げ **禁止**
- 代わりに原因（タイミング・環境依存・テストデータ）を特定して修正する
- 根治するまで「暫定P0-CRITICAL（flaky監視中）」とマーキングして CI 対象から外さない

### CIバイパスの禁止
- `git push --no-verify` によるローカルhookスキップ → 禁止
- GitHub UIの「Merge without waiting for requirements」→ 管理者でも禁止
- 緊急デプロイ時も、critical-testsが通らない状態でのマージは禁止（代わりにhotfixブランチでテスト修正を優先）

---

## Secrets管理

CI でE2Eや決済テストを実行するには、テスト環境のシークレットが必要:

### 必須シークレット例（プロジェクトに応じて調整）
- `STRIPE_TEST_SECRET_KEY` — Stripe テスト環境の秘密鍵
- `TEST_DATABASE_URL` — テスト用DB接続文字列
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — E2Eログイン用
- `STAGING_BASE_URL` — staging環境のURL

### 設定方法
GitHub → Settings → Secrets and variables → Actions → New repository secret

### 禁止事項
- 本番シークレットをCIで使うこと
- シークレットをログに出力すること
- シークレットをコミットすること（`.gitignore` で `.env*` を除外済み）

---

## 関連ファイル

- `.github/workflows/critical-tests.yml` — 本番マージゲートCI
- `docs/test-spec.md` — テスト仕様書（P0-CRITICAL指定箇所）
- `.claude/rules/tdd-integrity-contract.md` — TDD不正防止（テスト弱体化禁止）

critical-tests.yml は `tdd-integrity-contract.md` と組み合わせることで、
AIがテストを弱めて通した場合も、独立したCI環境での実行で露呈する。
