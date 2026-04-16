# アリガトサン開発フレームワーク ガイドブック

## このフレームワークとは

Claude Code / Codex CLI を使った開発で、チーム全員が同じ品質・同じワークフローで開発できるようにするための共通設定テンプレート。

**核心思想**: テスト駆動開発（TDD） + 設計と実装の分離 + AIの不正を構造的に防ぐガードレール + 本番デプロイの機械的ゲート

このフレームワークは5層の守りで品質を強制する:

1. **恒久ルール** — CLAUDE.md / rules/ に契約として明記
2. **スキル** — RED/GREEN/REFACTORの進行を workflow として誘導
3. **hooks / settings** — sed -i 等の「レビュー回避手段」を deterministic にブロック
4. **外部検証（独立エージェント）** — read-only reviewer + mutation testing（推奨）
5. **CI ゲート（本番マージブロック）** — GitHub Actions + Branch Protection で P0-CRITICALテスト失敗時のマージを物理的に阻止

参考: [nizos/tdd-guard](https://github.com/nizos/tdd-guard), [obra/superpowers](https://github.com/obra/superpowers), ImpossibleBench論文（AIがテストを攻略する現象の研究）

---

## 前提条件

### visual-explainer プラグイン（必須）

アーキテクチャ図の自動生成に使用する。フレームワーク導入前にインストールしておくこと。

```
/plugin marketplace add nicobailon/visual-explainer
/plugin install visual-explainer
/reload-plugins
```

> 未インストールの場合、onboard-projectスキル実行時にインストール案内が表示される。

### GitHub CLI（推奨）

リポジトリ作成・PR操作に使用。

```bash
# インストール確認
gh --version
```

---

## セットアップ

### 方法A: 既存プロジェクトへの自動導入（推奨）

既存プロジェクトに導入する場合は、**onboard-projectスキル**で全自動化できる。

```bash
# 1. 対象プロジェクトのディレクトリに移動
cd /path/to/your-project

# 2. Claude Codeで以下を実行
# 「このプロジェクトにフレームワークを導入して」
```

#### 自動導入の流れ（PHASE 0〜4）

**PHASE 0: 前提条件チェック**
- visual-explainerプラグインの導入状態を確認
- 未導入の場合 → インストール手順を案内し、手動実行を依頼
- ユーザーが「スキップ」を選択 → PHASE 2でテキスト版フォールバックに切替

**PHASE 1: 技術スタック自動検出**
- package.json, tsconfig.json, Dockerfile, vercel.json 等をスキャン
- Runtime / Framework / DB / デプロイ先 / テストツール / CSS / 認証 / CI/CD を自動特定
- 検出結果をユーザーに提示 → 確認・修正の機会あり

**PHASE 2: アーキテクチャ可視化**
- `/visual-explainer:project-recap` → プロジェクト現状スナップショットHTML
- `/visual-explainer:generate-web-diagram` → システム構成図HTML
- 生成物は `docs/architecture/` に保存
- （visual-explainer未導入時は `docs/architecture/overview.md` にテキスト版を生成）

**PHASE 3: 既存設定との競合解消**
- 既存の CLAUDE.md, .claude/, docs/ を検出
- CLAUDE.md → プロジェクト固有ルールを保持しつつフレームワーク構造に統合
- settings.json → denyは和集合（安全側）、allowは既存を尊重してマージ
- rules/ → 重複はフレームワーク版に統合、プロジェクト固有はそのまま保持
- docs/ → 既存ファイルは一切削除しない。フレームワーク分を追加
- マージ結果をユーザーに提示 → 確認・修正の機会あり

**PHASE 4: ファイル配置と最終設定**
- CLAUDE.md の環境情報をPHASE 1の検出結果で自動記入
- settings.json のallowリストを技術スタックに最適化（pnpm検出→pnpmコマンド許可等）
- 全ファイル配置 → ユーザー最終確認 → commit

各フェーズでユーザー確認を挟むため、意図しない変更は発生しない。

### 方法B: 新規プロジェクトへの手動導入

```bash
# 1. フレームワークリポジトリをclone（初回のみ）
gh repo clone arigatosun/claude-framework ~/claude-framework

# 2. 新規プロジェクトにテンプレートをコピー
cp -r ~/claude-framework/CLAUDE.md ./
cp -r ~/claude-framework/.claude ./
cp -r ~/claude-framework/docs ./
cp ~/claude-framework/.gitignore ./

# 3. CLAUDE.md の環境情報をプロジェクトに合わせて編集
```

```markdown
## 環境情報
- OS: Windows 11
- Runtime: Node.js 20 / pnpm
- Framework: Next.js 14 (App Router)
- DB: Supabase (PostgreSQL)
- デプロイ先: Vercel
```

### 個人設定（任意・共通）

```bash
# CLAUDE.local.md を作成（git管理外）
cat > CLAUDE.local.md << 'EOF'
# 個人設定
- mainブランチへの直接push許可（単独作業時）
- コミットメッセージの補足は英語でもOK
EOF
```

### 初回commit

```bash
git add CLAUDE.md .claude/ docs/ .gitignore
git commit -m "chore: アリガトサン開発フレームワーク導入"
```

---

## 開発ワークフロー（STEP 1〜5）

### 全体の流れ

```
STEP 1: 設計 → STEP 2: テスト設計 → STEP 3: 実装 → STEP 4: 検証・commit
                 ↑                                          |
                 └──────── STEP 5: 修正・拡張時はここに戻る ──┘
```

### STEP 1: 設計フェーズ

Claude Codeに「{機能名}を実装して」と伝えると、**いきなりコードを書かない**。

Claude Codeが YES/NO・選択式で質問してくる:

```
認証方式を選択してください:
  A) メール+パスワードのみ
  B) メール+パスワード + OAuth（Google）
  C) その他
  → ?
```

全ての質問に回答すると、設計メモが `docs/design-notes/{機能名}.md` に保存される。

**ルール**: 曖昧な状態では絶対に実装に進まない。質問が多くても全て回答する。

### STEP 2: テスト設計ファースト

設計が確定したら、**実装より先に**テストケースを作る。

Claude Codeが提案してくる:

```
以下のテストケースを docs/test-spec.md に追加します:
  TC-AUTH-001 [P0] メール+パスワードで登録成功
  TC-AUTH-002 [P0] 重複メールで登録失敗
  追加してよいですか？ → Y / N
```

承認すると test-spec.md に追記され、テスト設計だけが先にcommitされる。

### STEP 3: 実装（RED → GREEN → REFACTOR 厳格分離）

テストケース1つごとに以下のループを回す:

```
RED (テストだけ追加) → GREEN (実装だけ追加) → REFACTOR (整理のみ)
```

- **RED**: テストファイルだけを編集。1つの failing test を追加し、実際に失敗することを実行ログで確認
- **GREEN**: 実装ファイルだけを編集。直前の failing test を通すための最小変更のみ
- **REFACTOR**: 振る舞いを変えない整理のみ（任意）

**重要**: 複数の failing test を一度にRED化してまとめてGREENにするのは禁止。
フェーズごとに編集可能なファイルが制限されているのは、AIがテストと実装を同時に触って「テスト側を弱めて通す」不正を防ぐため。

### STEP 4: 検証・commit

作業完了前に以下を必ず実行する:

1. **focused test** — 今回追加・修正したテスト
2. **affected suite** — 影響範囲のテストスイート
3. **lint** — コードスタイル違反チェック
4. **typecheck** — 型エラーチェック
5. **TDD Ledger 出力** — 変更ファイル・テスト結果・最小変更の根拠・想定される不正パターンを報告

全てPASSしたら commit。`docs/progress.md` が自動更新される。

### STEP 5: 修正・拡張時

後日、既存機能を修正・拡張する場合:

1. Claude Codeが既存のテストケースへの影響を分析
2. テスト設計を先に更新
3. 実装

---

## ファイル構成と役割

```
project-root/
├── CLAUDE.md                          # Claude Codeの初期設定（環境情報・ワークフロー）
├── CLAUDE.local.md                    # 個人設定（git管理外）
├── .claude/
│   ├── settings.json                  # パーミッション設定（安全柵）
│   ├── rules/
│   │   ├── tdd-workflow.md            # TDDの手順ルール
│   │   ├── tdd-integrity-contract.md  # TDD不正防止の絶対契約（RED/GREEN/REFACTOR分離）
│   │   ├── critical-path-protection.md # 本番デプロイゲートCI運用ルール
│   │   ├── design-phase.md            # 設計フェーズの質問ルール
│   │   ├── session-continuity.md      # セッション跨ぎの継続ルール
│   │   ├── coding-standards.md        # コーディング規約
│   │   ├── git-workflow.md            # Git運用ルール
│   │   └── mistakes.md               # やらかしログ
│   ├── skills/
│   │   ├── onboard-project/SKILL.md   # 既存プロジェクト自動導入スキル
│   │   ├── tdd-integrity/SKILL.md     # TDD厳格実行スキル（RED/GREEN/REFACTOR）
│   │   ├── test-design/SKILL.md       # テスト設計スキル
│   │   └── phase-commit/SKILL.md      # Phase完了時のcommitスキル
│   └── agents/
│       ├── reviewer.md                # コードレビューエージェント
│       └── security-check.md          # セキュリティチェックエージェント
├── docs/
│   ├── test-spec.md                   # テスト仕様書（一元管理）
│   ├── progress.md                    # 作業進捗（セッション跨ぎ用）
│   ├── architecture/                  # アーキテクチャ図（HTML）
│   ├── design-notes/                  # 設計メモ
│   └── framework-guide.md            # このファイル
├── .github/
│   └── workflows/
│       ├── critical-tests.yml         # 本番マージゲートCI（P0-CRITICALテスト実行）
│       └── pr-checks.yml              # 全PRで実行される軽量チェック
└── .gitignore
```

### 各ファイルの役割まとめ

| ファイル | 役割 | 編集頻度 |
|---------|------|---------|
| CLAUDE.md | Claude Codeの初期OS。環境情報・基本ルール | プロジェクト初期に1回 |
| settings.json | 実行許可・禁止の境界線 | ほぼ変更なし |
| rules/ | 詳細なルール集 | mistakes.mdは随時追記 |
| skills/ | 定型作業の自動化 | 必要に応じて追加 |
| agents/ | 独立した専門エージェント | 必要に応じて追加 |
| test-spec.md | テスト仕様書 | 実装のたびに更新（TDDの核） |
| progress.md | 作業引継ぎ | 毎Phase自動更新 |
| architecture/ | アーキテクチャ図（HTML/md） | 導入時に生成、構成変更時に更新 |

---

## スキル・エージェントの使い方

### スキル（定型作業の自動化）

| スキル | トリガー例 | 内容 |
|--------|----------|------|
| **onboard-project** | 「フレームワーク導入して」「セットアップ」 | 既存プロジェクトへの自動導入（技術スタック検出→アーキテクチャ可視化→競合解消→配置） |
| **tdd-integrity** | 「実装して」「機能追加」「バグ修正」 | RED→GREEN→REFACTORの厳格分離でTDDを強制実行。TDD Ledger出力必須 |
| **test-design** | 「テスト書いて」「テストケース追加」 | docs/test-spec.md にテストケースを追加・更新 |
| **phase-commit** | 「Phase完了」「コミットして」 | テスト実行→progress.md更新→test-spec.md更新→commit |

スキルはClaude Codeが自動的に認識するため、トリガーとなるキーワードを含む指示を出すだけでよい。

### エージェント（独立した専門家）

| エージェント | 起動方法 | 内容 |
|------------|---------|------|
| **reviewer** | 「レビューして」「コードチェック」 | 正確性・セキュリティ・保守性・テスト整合性の観点でコードレビュー。問題なければ「LGTM」 |
| **security-check** | 「セキュリティチェック」「脆弱性スキャン」 | OWASP Top 10基準で脆弱性を検出。実際に悪用可能な問題のみ報告 |

エージェントは読み取り専用。ファイルを変更することはない。

### visual-explainer コマンド（アーキテクチャ可視化）

| コマンド | 用途 |
|---------|------|
| `/visual-explainer:generate-web-diagram` | アーキテクチャ図・フロー図・ER図をHTMLで生成 |
| `/visual-explainer:project-recap` | プロジェクトの現状スナップショットを生成 |
| `/visual-explainer:generate-visual-plan` | 機能実装のビジュアル計画書を生成 |
| `/visual-explainer:diff-review` | コード変更のビジュアルレビュー |
| `/visual-explainer:plan-review` | プランをコードと照合してリスク評価 |
| `/visual-explainer:fact-check` | ドキュメントの内容をコードと照合して検証 |

生成されたHTMLは `~/.agent/diagrams/` に保存され、ブラウザで自動的に開く。
プロジェクト管理用にコピーする場合は `docs/architecture/` に配置する。

---

## セッション跨ぎの仕組み

### 作業を中断するとき

特に何もしなくてよい。Claude Codeが `docs/progress.md` を自動更新している。

### 翌日セッションを再開するとき

Claude Codeを起動するだけでよい。自動で:

1. `docs/progress.md` を読み込む
2. 前回の作業状況を要約して報告する
3. 「続きから再開しますか？」と聞いてくる

```
前回の作業状況:
- 機能: ユーザー登録
- 進捗: Phase 2/5 完了
- 次にやること: Phase 3 バリデーション実装

続きから再開しますか？ → Y / N
```

---

## settings.json の安全設定

### 自動許可（allowリスト）
npm run, git status, git diff 等の安全なコマンド → 確認なしで実行

### 絶対禁止（denyリスト）
- `rm -rf` — ファイル全削除
- `curl | sh` / `wget | bash` — 外部スクリプト実行
- `.env` ファイルの読み取り — シークレット漏洩防止
- **`sed -i` / `perl -pi` / `awk -i inplace`** — レビュー回避のためのin-place書き換えを禁止
- **`python -c` / `node -e`** — スクリプト経由のレビュー回避書き換えを禁止
- **`* > *.ts` / `* > *.py` 等** — Bash リダイレクトによるソースファイル上書きを禁止

→ ファイル編集は必ず Edit / Write ツールで行う（差分がユーザーに見える形で）

### 都度確認（askリスト）
- `git push` — プッシュ前にテスト通過を確認
- `rm` — ファイル削除は慎重に
- `gh pr create` — PR作成前に内容確認
- **`--updateSnapshot` / `-u` フラグ** — snapshot一括更新は意図確認が必要

---

## TDD Integrity Contract（AI不正防止の絶対契約）

AIがテストを「攻略」する（テストの抜け道を突く）現象は、ImpossibleBenchでも研究対象になっている実在の問題。
このフレームワークは4層でそれを防ぐ。

### 4層の守り

| 層 | 仕組み | 防げる不正 |
|----|-------|----------|
| **層1: 恒久ルール** | CLAUDE.md + `rules/tdd-integrity-contract.md` | 契約レベルでの合意形成 |
| **層2: スキル** | `skills/tdd-integrity/` | RED/GREEN/REFACTORの進行誘導 |
| **層3: hooks/settings** | `settings.json` のdeny | sed -i, snapshot一括更新等のレビュー回避 |
| **層4: 外部検証** | `agents/reviewer.md` + mutation testing | 実装と独立視点で最終チェック |

### 常に禁止される行為

#### テスト不正操作
- failing test の削除
- `skip` / `only` / `xfail` / `todo` 化
- assertion を弱めること（`toBe` → `toBeTruthy`、厳密比較 → 部分一致）
- snapshot / golden file の安易な一括更新
- coverage threshold の引き下げ

#### テスト回避のための実装汚染
- test 環境だけ通る分岐の追加（`if (process.env.NODE_ENV === 'test')`）
- テスト入力にだけ最適化したハードコード
- production code から test file / fixture を読むこと

#### レビュー回避
- `sed -i`, `perl -pi`, `awk -i inplace`
- `python -c`, `node -e` によるファイル書き換え
- Bash リダイレクトによるソースファイル上書き（`> file.ts`）

### TDD Ledger（作業完了時の必須報告）

作業を一区切りつける前に、以下を必ず出力する:

```markdown
## TDD Ledger

### Phase
{RED / GREEN / REFACTOR / 全サイクル完了}

### Behavior implemented
{実装した振る舞いを1文で}

### Changed files
- tests/foo.test.ts（追加: should handle X）
- src/foo.ts（実装: handleX関数）

### Test commands executed
- `pnpm vitest run tests/foo.test.ts` → PASS (3/3)
- `pnpm vitest run` → PASS (127/127)
- `pnpm lint` → OK
- `pnpm typecheck` → OK

### Why this change is minimal
{最小変更である根拠}

### What would count as cheating here
{想定される不正パターン}
- 例: テスト期待値をハードコードで返すこと
- 例: if (input === 'testValue') return 'expected'
```

Ledgerなしに「完了しました」と報告するのは禁止。

### 最後の砦: Mutation Testing（推奨）

AIがテストだけに最適化した実装を出しても、mutation testing で露呈しやすい。

| 言語 | ツール |
|-----|-------|
| TypeScript / JavaScript | [Stryker Mutator](https://stryker-mutator.io/) |
| Python | [mutmut](https://github.com/boxed/mutmut) |
| Go | [go-mutesting](https://github.com/avito-tech/go-mutesting) |

導入すると、「テストは全部通るのに mutation score が低い」＝テストの質が不十分、という検出ができる。

### 参考実装

- **[nizos/tdd-guard](https://github.com/nizos/tdd-guard)** — Claude Code向けのTDD強制プラグイン。hookで failing test なしの実装をブロック
- **[obra/superpowers](https://github.com/obra/superpowers)** — サブエージェント活用のプランニング→実装スキルフレームワーク

---

## Critical Path Protection（本番デプロイゲート）

決済・認証・データ整合性など、バグが本番に出たら致命的な機能は、GitHub Actionsで機械的にマージブロックする。
AIがローカルでテストを弱めても、独立したCI環境で実行されるため不正が露呈する。

### 仕組み

```
開発者/AI                  GitHub                    本番
   ↓                          ↓                        ↓
[PR作成] → [critical-tests.yml 実行] → PASS → [mainへマージ可] → [デプロイ]
              ↓
              FAIL → [Branch Protection がマージをブロック] ❌
```

### テスト優先度の3段階

| 優先度 | マーカー | 本番マージ可否 |
|-------|---------|--------------|
| **P0-CRITICAL** | `[P0-CRITICAL]` | 1つでもFAILなら**マージ不可**（CI機械ブロック） |
| **P0** | `[P0]` | FAILは警告。マージは可能だが要判断 |
| **P1 / P2** | `[P1]` / `[P2]` | マージには影響しない |

### P0-CRITICAL に該当するテスト

「このテストがFAILしたまま本番に出したら、ユーザーに実害が出るか？」がYESのもの:

- **決済処理** — 金額計算、Stripe連携、返金、サブスク更新
- **認証・認可** — ログイン、セッション、権限チェック、パスワードリセット
- **データ整合性** — トランザクション、外部キー制約、DB一貫性
- **個人情報保護** — 暗号化、GDPR、情報漏洩防止
- **契約違反の防止** — 料金プラン上限、利用規約制限
- **復旧不能な操作** — データ削除、メール送信、外部API呼び出し

### GitHub Actions ワークフロー構成

```
.github/workflows/
├── critical-tests.yml      # staging→main PR時に必須実行（マージゲート）
├── pr-checks.yml          # 全PRで実行（lint, typecheck, unit）
└── regression-tests.yml   # 定期実行（毎日 or 週次）
```

フレームワークには各ワークフローのテンプレートが `templates/github-workflows/` に用意されている。
onboard-projectスキル実行時にプロジェクトに応じて自動配置される。

### Branch Protection 必須設定

CIを配置しただけでは機能しない。**必ずGitHubの Branch Protection Rules で必須化する**:

```
Settings → Branches → Branch protection rules → Add rule

Branch name pattern: main

✅ Require a pull request before merging
  ✅ Require approvals: 1

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  必須チェック:
    - critical-tests / run-critical-tests  ← 本番マージゲート
    - pr-checks / lint
    - pr-checks / typecheck

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings
  ⚠ Include administrators  ← 管理者もバイパス不可（超重要）
```

onboard-projectスキル実行時に `gh` コマンドで自動設定できる（権限がある場合）。

### test-spec.md での Critical Path 明示

テストケースに `P0-CRITICAL` を指定し、対応する自動テストパスを記載する:

```markdown
| **優先度** | P0-CRITICAL |
| **CI実行対象** | ✅ critical-tests.yml |
| **失敗時の影響** | 決済が実行できず、ユーザーが購入できない |
| **自動テストパス** | `tests/critical/payment/checkout.test.ts` |
```

### 運用ルール

#### P0-CRITICALテストがFAILした場合
1. **絶対にマージしない**（Branch Protection が物理的に阻止）
2. 失敗原因を特定する
3. 修正 → 再テスト → PASS確認後にマージ
4. flaky testの場合は mistakes.md に記録して根本修正

#### flaky testの扱い
- P0-CRITICAL から **一時的な格下げは禁止**
- 原因（タイミング・環境依存・テストデータ）を特定して修正する
- 根治するまで「暫定P0-CRITICAL（flaky監視中）」として CI 対象から外さない

#### CIバイパスの禁止
- `git push --no-verify` でローカルhookスキップ → 禁止
- GitHub UIの「Merge without waiting for requirements」→ 管理者でも禁止
- 緊急デプロイ時も、critical-testsが通らない状態でのマージは禁止

### Secrets管理

CI でE2Eや決済テストを実行するには、テスト環境のシークレットが必要:

| シークレット名 | 用途 |
|--------------|------|
| `STRIPE_TEST_SECRET_KEY` | Stripe テスト環境の秘密鍵 |
| `TEST_DATABASE_URL` | テスト用DB接続文字列 |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | E2Eログイン用 |
| `STAGING_BASE_URL` | staging環境のURL |

GitHub → Settings → Secrets and variables → Actions → New repository secret で設定。

**禁止事項:**
- 本番シークレットをCIで使うこと
- シークレットをログに出力すること
- シークレットをコミットすること

---

## やらかしログ（mistakes.md）の運用

チーム全員で育てる最重要ファイル。

### ミスが発生したら

1. `.claude/rules/mistakes.md` を開く
2. 以下のフォーマットで追記:
   ```
   ### Case N: {タイトル}
   状況: {何が起きたか}
   原因: {なぜ起きたか}
   → 対策: {具体的な再発防止策}
   ```
3. commit: `docs: やらかしログ追記 - {タイトル}`

### ルール
- 「気をつける」は対策として認めない。具体的な行動を書く
- 人を責めない。仕組みで防ぐ方法を書く

---

## よくあるQ&A

### Q: 既存プロジェクトに導入したらCLAUDE.mdが上書きされる？
A: されない。onboard-projectスキルは既存のCLAUDE.mdを読み込み、プロジェクト固有ルールを保持したままフレームワーク構造に統合する。各フェーズでユーザー確認があるので、意図しない変更は発生しない。

### Q: visual-explainerのインストールができない
A: onboard-projectスキル実行時に案内が表示される。インストールできない場合は「スキップ」と回答すれば、テキスト版のアーキテクチャ概要（`docs/architecture/overview.md`）が代わりに生成される。後からvisual-explainerを導入してHTMLに差し替えることも可能。

### Q: 自動検出された技術スタックが間違っている
A: PHASE 1の検出結果提示時に修正できる。「修正内容を入力」を選択して正しい情報を伝えれば、修正した内容でCLAUDE.mdが生成される。

### Q: Claude Codeが設計フェーズを飛ばして実装を始めた
A: CLAUDE.md の禁止事項に記載があるため、通常は発生しない。発生した場合は「設計フェーズから始めて」と指示する。

### Q: テスト仕様書が長くなりすぎた
A: カテゴリごとに別ファイルに分割可能。`docs/test-spec/auth.md`, `docs/test-spec/editor.md` のように分ける。

### Q: 個人的なルールを追加したい
A: `CLAUDE.local.md` に書く。このファイルはgit管理外なのでチームに影響しない。

### Q: 新しいスキルやエージェントを追加したい
A: `.claude/skills/{スキル名}/SKILL.md` または `.claude/agents/{エージェント名}.md` を作成してPRを出す。

### Q: mistakes.md に書くべきか迷う
A: 迷ったら書く。不要なら後で消せる。書かなかったミスは繰り返される。

### Q: アーキテクチャ図を更新したい
A: `/visual-explainer:generate-web-diagram` を実行して再生成する。生成されたHTMLを `docs/architecture/` にコピーすればよい。

### Q: どのテストを P0-CRITICAL にすべきか判断できない
A: 「このテストがFAILしたまま本番に出したら、ユーザーに実害が出るか？」で判断する。YESなら P0-CRITICAL。決済・認証・データ整合性・個人情報保護は基本的に全て該当。迷ったら P0-CRITICAL に倒すほうが安全。

### Q: Critical Tests が flaky で毎回失敗する
A: P0-CRITICAL から外してはいけない。原因（タイミング・環境依存・テストデータ・外部API揺らぎ）を特定して根本修正する。暫定対応として `retry` 機構を追加するのは可（ただし回数制限付き）。詳細は `.claude/rules/critical-path-protection.md`。

### Q: 緊急で本番デプロイが必要だが critical-tests が FAIL している
A: それでもマージしない。CIを通すためにテストを弱めるのはTDD Integrity Contract違反。代わりに以下を選択:
  1. 失敗原因を最優先で修正して再デプロイ
  2. 前の正常なコミットにrevertして本番を安定させる
  3. Hotfix ブランチで該当テストだけ修正してマージ

### Q: Branch Protection の設定が管理者権限で必要
A: 初期設定時は管理者が1回設定すればよい。onboard-projectスキルが `gh api` コマンドで自動設定を試みるが、権限がない場合は手動設定手順を提示する。

---

## バージョン管理

このフレームワークは `arigatosun/claude-framework` リポジトリで管理。
改善提案はIssue or PRで。全員で育てていく。
