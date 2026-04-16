---
name: onboard-project
description: >
  既存プロジェクトにアリガトサン開発フレームワークを自動導入する。
  「フレームワーク導入」「セットアップ」「onboard」「初期導入」
  「このプロジェクトにフレームワークを入れて」などのキーワードで起動する。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Skill, Agent
---

# 既存プロジェクト自動導入スキル

既存プロジェクトの技術スタックを自動検出し、フレームワークを最適化して導入する。

## 実行条件

- カレントディレクトリが対象プロジェクトのルートであること
- フレームワークテンプレートが `~/dev/claude-framework/` に存在すること

---

## PHASE 0: 前提条件チェック（最初に必ず実行）

PHASE 1に入る前に、必要なプラグインの導入状態を確認する。

### 0-1. visual-explainer プラグインの確認

visual-explainerスキル（`/visual-explainer:generate-web-diagram` 等）が利用可能か確認する。
利用できない場合、**以下のメッセージをユーザーに表示して手動インストールを依頼する**:

```
⚠ visual-explainer プラグインが未導入です。
アーキテクチャ図の自動生成に必要なため、以下の3コマンドを順番に実行してください:

  /plugin marketplace add nicobailon/visual-explainer
  /plugin install visual-explainer
  /reload-plugins

完了したら「done」と入力してください。
```

- ユーザーが「done」と回答したら、再度利用可能か確認する
- 利用可能になったらPHASE 1に進む
- ユーザーが「スキップ」と回答した場合、PHASE 2（アーキテクチャ可視化）をスキップしてPHASE 1に進む。スキップ時はテキストベースのアーキテクチャ記録（`docs/architecture/overview.md`）を代わりに生成する

**プラグイン未導入のままPHASE 2を実行しようとするな。必ずこのチェックを先に行う。**

---

## PHASE 1: 技術スタック自動検出（コード書くな。読み取りのみ）

以下のファイルを順番にスキャンして技術スタックを特定する:

### 1-1. パッケージマネージャ・ランタイム検出
| 検出ファイル | 判定結果 |
|-------------|---------|
| `package.json` + `pnpm-lock.yaml` | Node.js / pnpm |
| `package.json` + `yarn.lock` | Node.js / yarn |
| `package.json` + `package-lock.json` | Node.js / npm |
| `requirements.txt` or `pyproject.toml` | Python / pip or poetry |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `Gemfile` | Ruby |
| `composer.json` | PHP |

### 1-2. フレームワーク検出
`package.json` の `dependencies` / `devDependencies` を読んで判定:
| パッケージ名 | 判定結果 |
|-------------|---------|
| `next` | Next.js（バージョンも記録。App Router / Pages Router判定: `app/` ディレクトリ有無） |
| `react` (nextなし) | React SPA |
| `vue` | Vue.js |
| `@angular/core` | Angular |
| `svelte` | Svelte |
| `express` | Express.js |
| `fastify` | Fastify |
| `hono` | Hono |
| `django` | Django |
| `flask` | Flask |
| `fastapi` | FastAPI |

### 1-3. DB検出
| パッケージ名 / ファイル | 判定結果 |
|------------------------|---------|
| `@supabase/supabase-js` | Supabase (PostgreSQL) |
| `@prisma/client` + `prisma/schema.prisma` | Prisma（schema読んでDB種別も特定） |
| `pg` or `postgres` | PostgreSQL (直接接続) |
| `mysql2` | MySQL |
| `mongodb` or `mongoose` | MongoDB |
| `@planetscale/database` | PlanetScale |
| `better-sqlite3` | SQLite |
| `drizzle-orm` | Drizzle（config読んでDB種別も特定） |

### 1-4. デプロイ先検出
| 検出ファイル | 判定結果 |
|-------------|---------|
| `vercel.json` or `.vercel/` | Vercel |
| `netlify.toml` | Netlify |
| `fly.toml` | Fly.io |
| `Dockerfile` + `docker-compose.yml` | Docker (セルフホスト) |
| `render.yaml` | Render |
| `railway.json` or `railway.toml` | Railway |
| `wrangler.toml` | Cloudflare Workers |
| `.github/workflows/*.yml` (deployジョブ) | GitHub Actions → デプロイ先を推定 |

### 1-5. テストフレームワーク検出
| パッケージ名 | 判定結果 |
|-------------|---------|
| `vitest` | Vitest |
| `jest` | Jest |
| `@playwright/test` | Playwright |
| `cypress` | Cypress |
| `pytest` | pytest |

### 1-6. その他の重要技術
- TypeScript: `tsconfig.json` の有無
- ESLint: `.eslintrc.*` / `eslint.config.*` の有無
- Prettier: `.prettierrc.*` の有無
- Tailwind CSS: `tailwind.config.*` の有無
- Monorepo: `turbo.json` / `lerna.json` / `pnpm-workspace.yaml` の有無
- 状態管理: `zustand`, `jotai`, `recoil`, `@reduxjs/toolkit` 等
- 認証: `next-auth` / `@clerk/nextjs` / `@auth/core` 等
- CI/CD: `.github/workflows/` 内のファイル

### 1-7. 検出結果をユーザーに提示

```
技術スタック検出結果:
  Runtime: Node.js 20 / pnpm
  Framework: Next.js 14 (App Router)
  DB: Supabase (PostgreSQL) + Prisma ORM
  デプロイ先: Vercel
  テスト: Vitest + Playwright
  TypeScript: 5.3
  スタイル: Tailwind CSS 3.4
  認証: NextAuth.js v5
  CI/CD: GitHub Actions

この内容でCLAUDE.mdに記載します。修正はありますか？ → Y(確定) / 修正内容を入力
```

**ユーザーの確認なしに次のフェーズに進むな。**

---

## PHASE 2: アーキテクチャ可視化

ユーザーが技術スタックを確認したら、アーキテクチャを可視化する。

### visual-explainerが利用可能な場合（通常フロー）

#### 2-1. プロジェクト現状スナップショット
`/visual-explainer:project-recap` を実行して、プロジェクトの全体像を把握する。
生成されたHTMLを `docs/architecture/project-recap.html` にコピーする。

#### 2-2. アーキテクチャ図生成
`/visual-explainer:generate-web-diagram` を実行して、以下のアーキテクチャ図を生成する:
- システム全体のアーキテクチャ図（フロントエンド ↔ API ↔ DB ↔ 外部サービス）

生成されたHTMLを `docs/architecture/system-architecture.html` にコピーする。

#### 2-3. 結果報告
```
アーキテクチャドキュメント生成完了:
  - docs/architecture/project-recap.html（プロジェクト現状）
  - docs/architecture/system-architecture.html（システム構成図）

ブラウザで確認しますか？ → Y / N
```

### PHASE 0でスキップされた場合（フォールバック）

visual-explainerなしの場合、PHASE 1で検出した技術スタック情報とコードベースの読み取り結果から、テキストベースのアーキテクチャ概要を生成する。

`docs/architecture/overview.md` に以下を記録:
- システム構成（フロントエンド / API / DB / 外部サービス）
- 主要ディレクトリとその役割
- データフロー概要
- 依存関係の一覧

```
アーキテクチャ概要を生成しました:
  - docs/architecture/overview.md（テキスト版）

※ visual-explainer導入後に `/visual-explainer:generate-web-diagram` で
  HTML版に差し替え可能です。
```

---

## PHASE 3: 既存設定との競合解消

### 3-1. 既存ファイルの検出
以下のファイルの存在を確認する:
- `CLAUDE.md` — 既存のClaude Code設定
- `.claude/` — 既存のClaude Codeディレクトリ
- `.claude/settings.json` — 既存のパーミッション設定
- `.claude/rules/` — 既存のルールファイル
- `docs/` — 既存のドキュメントディレクトリ

### 3-2. 競合解消戦略

#### CLAUDE.md が既に存在する場合
1. 既存の `CLAUDE.md` を読み込む
2. フレームワーク版の構造（プロファイル / 環境情報 / ワークフロー / 禁止事項）に照らし合わせる
3. **既存の内容を保持しつつ、フレームワークの構造に統合する**:
   - 既存のプロジェクト固有ルール → そのまま残す（「プロジェクト固有ルール」セクションに移動）
   - 環境情報 → PHASE 1の検出結果で上書き
   - ワークフロー → フレームワーク版を採用（既存のカスタムワークフローは設計メモに移動）
4. 統合結果をユーザーに提示して確認を取る

#### .claude/settings.json が既に存在する場合
1. 既存のallow/deny/askリストを読み込む
2. フレームワーク版とマージする:
   - **denyリスト**: 両方の和集合（安全側に倒す）
   - **allowリスト**: 既存にあってフレームワークにないもの → ユーザーに確認
   - **askリスト**: 既存の設定を優先
3. マージ結果をユーザーに提示

#### .claude/rules/ が既に存在する場合
1. 既存のルールファイルを全て読む
2. フレームワークのルールと重複するもの → フレームワーク版に統合
3. プロジェクト固有のルール → そのまま保持
4. 競合するルール → ユーザーに選択させる

#### docs/ が既に存在する場合
- 既存の `docs/` 配下のファイルは一切削除しない
- フレームワークのファイル（test-spec.md, progress.md, design-notes/）を追加
- ファイル名が競合する場合 → ユーザーに確認

### 3-3. 競合解消結果の報告
```
競合解消結果:
  CLAUDE.md: 統合完了（既存ルール3件を「プロジェクト固有ルール」セクションに移動）
  settings.json: マージ完了（denyに2件追加、allow既存分を維持）
  rules/: 既存ルール2件を保持、フレームワーク6件を追加
  docs/: 既存ドキュメント未変更、フレームワーク3ファイルを追加

確定してよいですか？ → Y / N
```

---

## PHASE 4: ファイル配置と最終設定

### 4-1. CLAUDE.md を生成・更新
PHASE 1の検出結果 + PHASE 3の統合結果で CLAUDE.md を生成する。

### 4-2. 全ファイルを配置
- `.claude/settings.json` — マージ済み設定
- `.claude/rules/` — 統合済みルール
- `.claude/skills/` — スキル一式
- `.claude/agents/` — エージェント一式
- `docs/test-spec.md` — テスト仕様書テンプレート
- `docs/progress.md` — 初期状態
- `docs/architecture/` — PHASE 2で生成したHTML
- `docs/design-notes/` — 空ディレクトリ
- `.gitignore` — 必要な行を追記（既存内容は保持）

### 4-3. settings.json のallowリストをプロジェクトに最適化
検出した技術スタックに基づいて、allowリストに追加:

| 検出技術 | 追加するallowコマンド |
|---------|---------------------|
| pnpm | `pnpm run *`, `pnpm test`, `pnpm build`, `pnpm install` |
| npm | `npm run *`, `npm test`, `npm run build`, `npm install` |
| yarn | `yarn *`, `yarn test`, `yarn build`, `yarn install` |
| Vitest | `npx vitest *`, `pnpm vitest *` |
| Jest | `npx jest *`, `pnpm jest *` |
| Playwright | `npx playwright test *` |
| pytest | `pytest *`, `python -m pytest *` |
| Next.js | `pnpm dev`, `pnpm next *` |
| Docker | `docker compose *`（askリストに追加。allowではない） |
| Prisma | `npx prisma *`（askリストに追加。マイグレーション確認のため） |

### 4-4. 最終確認
```
フレームワーク導入完了:
  配置ファイル: {N}ファイル
  既存ファイル変更: {M}ファイル（差分を表示）
  新規ファイル: {L}ファイル
  
  commitしますか？ → Y / N
```

### 4-5. Critical Path Protection CI の配置

本番マージゲートのCIを配置する。ユーザーに確認した上で:

1. 既存の `.github/workflows/` の有無を確認
2. 既存ワークフローがあれば内容を読み、`critical-tests.yml` / `pr-checks.yml` と重複しないか確認
3. PHASE 1の検出結果に応じて適切なテンプレートを選択:
   - Node.js検出 → `templates/github-workflows/critical-tests.yml` + `pr-checks.yml`
   - Python検出 → `templates/github-workflows/critical-tests-python.yml`
4. テンプレート内のコマンド（`pnpm`, `npm`, `yarn`等）をプロジェクトに合わせて置換
5. `.github/workflows/critical-tests.yml` として配置

配置後、ユーザーに Branch Protection Rules の設定を案内:

```
Critical Path Protection CI を配置しました:
  - .github/workflows/critical-tests.yml
  - .github/workflows/pr-checks.yml

本番マージブロックを有効化するには、GitHub リポジトリで以下を設定してください:

  1. Settings → Branches → Branch protection rules → Add rule
  2. Branch name pattern: main
  3. 以下を有効化:
     ✅ Require status checks to pass before merging
        必須チェック: critical-tests / run-critical-tests
     ✅ Require branches to be up to date before merging
     ✅ Do not allow bypassing the above settings
     ⚠ Include administrators（管理者もバイパス不可）

設定しますか？（gh コマンドで自動設定可能）→ Y / N / 後で手動設定
```

ユーザーが「Y」を選択した場合、`gh api` で Branch Protection を設定する:
```bash
gh api -X PUT repos/{owner}/{repo}/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks='{"strict":true,"contexts":["critical-tests / run-critical-tests"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f restrictions=null
```

### 4-6. commit
```bash
git add CLAUDE.md .claude/ docs/ .github/ .gitignore
git commit -m "chore: アリガトサン開発フレームワーク導入"
```

---

## 失敗時のロールバック

いずれかのフェーズでユーザーが「N」を選択した場合:
- そのフェーズで行った変更を全て元に戻す
- 理由をユーザーに確認する
- 修正して再実行するか、中断するかを選択させる

---

## 注意事項

- **既存ファイルの削除は絶対にしない**。追加とマージのみ
- **ユーザー確認なしに書き込みを行わない**。各フェーズ完了時に必ず確認を取る
- 技術スタック検出で不明な点があれば、推測せずユーザーに質問する
- PHASE 0でvisual-explainer未導入を検出したら、必ずユーザーにインストール手順を案内する。案内なしにスキップするな
- ユーザーが明示的にスキップを選択した場合のみ、テキストベースのアーキテクチャ記録にフォールバックする
