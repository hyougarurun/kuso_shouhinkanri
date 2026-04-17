# Phase 1 準備チェックリスト（k2 手動作業）

上から順番にやれば全部揃う。詰まったら「要 k2 判断」を読んで Claude に相談。
完了したら最後の「準備完了」を Claude に伝える。

---

## A. Supabase（プロジェクト作成済み）

### A-1. Supabase CLI インストール
- [ ] ターミナルで `brew install supabase/tap/supabase`
- なぜ: ローカルからスキーマ管理・型生成するため
- 確認: `supabase --version` でバージョンが表示される

### A-2. Supabase ログイン
- [ ] `supabase login` 実行 → 開いたブラウザで Authorize
- 確認: ターミナルに `You are now logged in.` が出る

### A-3. プロジェクト初期化＆リンク
- [ ] `cd /Users/mega/Desktop/arigatosan-dev/kusomegane-apparel`
- [ ] `supabase init`（既に `supabase/` がある場合はスキップ）
- [ ] `supabase link --project-ref gdzkpakkalnyrgbchmtq`
- 確認: `supabase/config.toml` が生成される / `Finished supabase link` が出る

### A-4. Personal Access Token 発行（Supabase MCP 用）
- [ ] https://supabase.com/dashboard/account/tokens → Generate new token → 名前「kusomegane-mcp」
- 確認: `sbp_...` で始まる文字列が表示される
- → Claude に渡す: **`SUPABASE_ACCESS_TOKEN`**

### A-5. API キー取得（dashboard）
- [ ] https://supabase.com/dashboard/project/gdzkpakkalnyrgbchmtq/settings/api-keys
- 確認: Project URL / Publishable key / Secret key の3つをコピー
- → `.env.local` に書く:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`

---

## B. fal.ai（着画生成 Kling Kolors VTON v1.5）

### B-1. アカウント作成
- [ ] https://fal.ai/ → Sign up（GitHub or Google）

### B-2. API Key 発行
- [ ] https://fal.ai/dashboard/keys → Add new key → 名前「kusomegane」
- 確認: `Bearer ...` 形式のキーが1回だけ表示される（必ずコピー）
- → `.env.local`: **`FAL_KEY`**

### B-3. 課金設定
- [ ] https://fal.ai/dashboard/billing → クレカ登録 → Spend Limit を $30/月 に設定
- なぜ: 上限なしだと事故課金リスク
- 確認: Billing 画面に Limit $30 が表示される

---

## C. Google Cloud Console（Sheets + Drive、OAuth 方式）

詳細手順は `docs/design-notes/google-integration-prep.md` の B-1〜B-6 を参照。
ここでは「公開状態」「リダイレクト URI」の **絶対に外せない設定**だけ強調する。

### C-1. GCP プロジェクト〜OAuth クライアント作成
- [ ] design-notes の B-1, B-2, B-3, B-4 を完了
- リダイレクト URI（開発）: `http://localhost:3000/api/auth/google/callback`
- 本番（Vercel）URI は H 章で確定後に追加

### C-2. OAuth 同意画面を **Production** 公開（必須）
- [ ] 「APIとサービス」→「OAuth同意画面」→「アプリを公開」ボタン
- なぜ: Testing のままだと refresh_token が **7日で失効**して全部止まる
- 確認: ステータスが「本番環境」と表示される（審査不要スコープなので即時）

### C-3. OAuth Playground でリフレッシュトークン取得
- [ ] https://developers.google.com/oauthplayground/
- [ ] 右上の歯車 → **"Use your own OAuth credentials"** にチェック → C-1 の Client ID / Secret を入力
- [ ] 左の Step 1: スコープに以下2つを手入力 → **Authorize APIs**
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`
- [ ] k2 の Google アカウントで承認
- [ ] Step 2: **Exchange authorization code for tokens** → `refresh_token` をコピー
- 確認: `1//0g...` 形式の長い文字列

### C-4. 環境変数
- [ ] `.env.local` に5つ設定（中身は k2 が手で書く）:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REFRESH_TOKEN`
  - `GOOGLE_SHEETS_SPREADSHEET_ID=1ZygaSDtEF5w3a8URi6dA4Don4YWZ0vmNFjx93zr1jU4`
  - `GOOGLE_DRIVE_PARENT_FOLDER_ID=1jP6r0FSeSva_4z-XXiguKHzZ5uAYL1L1`

---

## D. Google AI Studio（Gemini 2.5 Flash でキャプション生成）

### D-1. API キー発行
- [ ] https://aistudio.google.com/app/apikey → Create API key → 既存 GCP プロジェクト（C 章のもの）を選択
- 確認: `AIza...` 形式のキー
- → `.env.local`: **`GEMINI_API_KEY`**

---

## E. 既存 ASTORE シート「リスト1」のフォーマット共有（雛形抽出用）

### E-1. リスト1（雛形シート）のヘッダー行を共有
- [ ] https://docs.google.com/spreadsheets/d/1ZygaSDtEF5w3a8URi6dA4Don4YWZ0vmNFjx93zr1jU4/edit?gid=1641291870#gid=1641291870
- [ ] 「リスト1」タブを開いて1〜2行目（ヘッダー + サンプル行1件）が見える状態でスクショ → Claude に貼る
- [ ] さらに**シート名タブ全部**もスクショ（雛形候補の特定用）
- なぜ: Q2 確定により「新規シート作成 + リスト1 を雛形に転記」方式となったため、リスト1のヘッダー構造をテンプレート化する必要がある
- 確認: Claude が「ヘッダー雛形JSON」と「列マッピング案」を返す
- 不明確点（k2 に追加質問予定）: 新規シートの命名ルールは「商品コード単位」or「月次バッチ単位」or 別ルールか

---

## F. 日本人モデル画像マスター（Q3 確定: Claude が AI 生成）

### F-1. k2 が事前準備するもの → **なし**
- Q3 にて「Phase 1.4 着手時に Claude が Nano Banana Pro で 18 枚生成 → k2 が採用判定」が確定
- k2 は採用判定の時間を Phase 1.4 着手時に確保しておくだけでOK
- 参考になる「こういう日本人モデル像が良い」希望があれば Phase 1.4 開始前に Claude に伝達（年齢層・髪型・服装テイスト等）

---

## G. Anthropic API キー（既設定確認のみ）

### G-1. 既存 .env.local を確認
- [ ] `.env.local` に **`ANTHROPIC_API_KEY=sk-ant-...`** が入っているか目視確認
- 入ってなければ https://console.anthropic.com/settings/keys から再発行
- なぜ: Phase 0 で使っているので入っているはず。Phase 1 でも継続使用

---

## H. Vercel デプロイ準備（Phase 1 完了後の判断）

### H-1. アカウントだけ準備
- [ ] https://vercel.com/signup → GitHub アカウントで Sign up（既にあればスキップ）
- [ ] arigatosan-dev リポジトリへの連携可否を確認（インストール画面を1回開くだけでOK）
- なぜ: Phase 1 完了時点で「いつでもデプロイできる状態」にしておく
- ※ 実際の Import / 環境変数登録は Phase 1 完了後に Claude が手順案内する

---

## 全部終わったら

Claude に「**準備完了**」と伝える。Claude は以下を自動実行する:
1. `.env.local` の必要キーが全部入っているか検証スクリプト実行
2. Supabase / fal.ai / Google API への疎通テスト
3. Phase 1.0（DB スキーマ設計）の設計フェーズ開始

---

## 困ったら

- 各章で詰まった項目は **「C-3 で refresh_token が取れない」** のように章番号を添えて Claude に相談
- `.env.local` の中身は Claude には見せなくてOK（Claude は読まない/書かない）
- 1項目あたり想定所要時間: A 10分 / B 5分 / C **30分**（最重） / D 3分 / E 5分 / F (d)選択なら0分 / G 1分 / H 5分
