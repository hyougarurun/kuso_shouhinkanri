# Google Sheets / Drive 連携 事前準備調査

調査日: 2026-04-17
対象機能: Phase 1 Sheets/Drive 統合

---

## A. 認証方式の比較と推奨

### A-1. サービスアカウント方式
- **概要**: GCP上でbot用アカウントを作り、JSONキーを発行してサーバから認証する。
- **長所**: 無人実行向け。リフレッシュトークン管理不要。本番運用の標準。
- **対象シート/フォルダへの共有**: シート/フォルダの「共有」UIで、サービスアカウントのメール（例: `xxx@yyy.iam.gserviceaccount.com`）を「編集者」で追加するだけで読み書き可能になる。
- **致命的な制約（今回最大の論点）**: サービスアカウントは独自のストレージクォータを持たない。**個人アカウント所有のDriveフォルダにサービスアカウントが「ファイルを新規作成・アップロード」すると、403 storageQuotaExceeded エラーが発生する**（2026年時点でも未解決）。Sheets書き込み（既存シートへの行追加）は影響を受けないが、Driveのアップロードは詰む。
- **回避策**:
  - (a) Google Workspaceの**共有ドライブ（Shared Drive）**配下にフォルダを置く → サービスアカウントが編集者として書き込める。Workspace契約必須。
  - (b) アップロード後に `files.update` でownershipを実ユーザーに移譲 → ドメイン外への移譲は不可で個人アカウント間では制約あり。
  - (c) **Domain-wide Delegation** で実ユーザーを impersonate → Workspace admin必須。

### A-2. OAuth 2.0 ユーザー認証方式
- **概要**: k2自身のGoogleアカウントでOAuth同意し、リフレッシュトークンを取得してサーバに保管。APIはk2として実行される。
- **長所**: k2のDrive容量で書き込めるため、上記の storageQuota 問題が発生しない。既存の個人Driveフォルダにそのまま使える。
- **短所**: リフレッシュトークンの管理（漏洩・失効対応）。Google側のセキュリティ更新でトークン無効化される場合あり（要再認証）。
- **1人運用での評価**: テスト環境では publishing しない「Testing」モードのままだとリフレッシュトークンが7日で切れる問題があるため、**OAuth同意画面を「Production」公開**にする必要がある（個人アカウントでも可、審査不要のスコープ範囲内なら）。

### A-3. 結論（k2の運用前提への推奨）
要件: 「**個人Googleアカウント所有**の既存ASTOREシート + 個人Drive配下のフォルダ」「k2 1人運用」「Workspace契約なし」。

→ **OAuth 2.0 リフレッシュトークン方式を推奨**。
- 理由1: サービスアカウントだとDriveアップロードが storageQuotaExceeded で失敗する（最重要）。
- 理由2: 1人運用なので、自分のアカウントでOAuth同意 → リフレッシュトークンを `.env.local` に保管するだけで足りる。
- 理由3: 既存リソースのownershipを変えずに済む（製造会社共有を破壊しない）。

ただしSheets単体の操作だけならサービスアカウントが楽。**Sheets=サービスアカウント、Drive=OAuth** のハイブリッドも選択肢。実装コストを抑えるなら**OAuth1本に統一を推奨**。

---

## B. k2が事前に準備すべきもの（チェックリスト）

OAuth 2.0方式を前提とする。

```
□ B-1. Google Cloud Console プロジェクト作成
   → なぜ: APIキー・OAuthクライアントIDの発行元になる
   → 操作: https://console.cloud.google.com/ → 上部「プロジェクトを選択」→「新しいプロジェクト」→ 名前「kusomegane-apparel」

□ B-2. Sheets API / Drive API を有効化
   → なぜ: 有効化していないAPIは呼ぶと403になる
   → 操作: 左メニュー「APIとサービス」→「ライブラリ」→ "Google Sheets API" 検索 → 有効化。同様に "Google Drive API"。

□ B-3. OAuth同意画面の設定
   → なぜ: OAuthフローを動かすために必須
   → 操作: 「APIとサービス」→「OAuth同意画面」→ User Type「外部」→ アプリ名「KUSOMEGANE Apparel Tool」→ サポートメール=k2メアド → 開発者連絡先=k2メアド
   → スコープ追加: `https://www.googleapis.com/auth/spreadsheets` と `https://www.googleapis.com/auth/drive.file`
   → テストユーザーにk2自身のGmailを追加
   → ※ 7日問題回避のため、後で「アプリを公開」ボタンで Production 化（審査不要スコープのみなので即時公開可）

□ B-4. OAuthクライアントID（Webアプリケーション）作成
   → なぜ: リフレッシュトークン取得に必要
   → 操作: 「認証情報」→「認証情報を作成」→「OAuthクライアントID」→ アプリ種別「ウェブアプリケーション」
   → 承認済みリダイレクトURI: `http://localhost:3000/api/auth/google/callback`（本番は別途追加）
   → Client ID と Client Secret をDL

□ B-5. リフレッシュトークン取得（初回1回だけ）
   → なぜ: サーバ側で永続的にAPIを叩くため
   → 操作: OAuth Playground (https://developers.google.com/oauthplayground/) で
     ⚙ 設定 → "Use your own OAuth credentials" にClient ID/Secret入力
     → スコープ `spreadsheets` と `drive.file` を選択 → Authorize → 承認
     → Exchange authorization code for tokens → refresh_token をコピー
   → 環境変数 GOOGLE_REFRESH_TOKEN に保存

□ B-6. .env.local に以下を設定
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REFRESH_TOKEN=...
   GOOGLE_SHEETS_SPREADSHEET_ID=1ZygaSDtEF5w3a8URi6dA4Don4YWZ0vmNFjx93zr1jU4
   GOOGLE_DRIVE_PARENT_FOLDER_ID=1jP6r0FSeSva_4z-XXiguKHzZ5uAYL1L1

□ B-7. 共有設定の確認（OAuth方式では原則不要）
   → 既存ASTOREシート/Driveフォルダはk2自身が所有者なら追加共有不要
   → ※ サービスアカウント方式を選んだ場合のみ、サービスアカウントメアドを編集者で追加が必要
```

---

## C. Node.js 実装での推奨ライブラリ

- **公式 `googleapis` を採用**（`google-auth-library` 単体ではAPI呼び出しのラッパが無い）。
- バージョン: `googleapis@^144` 以降（2026年4月時点の最新メジャー）。
- Next.js App Router の API Route で使う際の注意:
  - **必ず Node.js Runtime で動かす**。`googleapis` は Node 標準API（`stream`, `crypto`, `fs` 等）を使うため Edge Runtime 非対応。
  - ファイル先頭で明示: `export const runtime = 'nodejs';`
  - 画像アップロードはストリーム送信が前提。`fs.createReadStream` または `Readable.from(buffer)` で `media.body` に渡す。
  - `dynamic = 'force-dynamic'` を併用して、ビルド時実行を防ぐ。

---

## D. シート転記の具体的ロジック想定

### D-1. 既存シートへの行追加（推奨）
1. `spreadsheets.values.get` で1行目（ヘッダー）を取得 → 列名→列インデックスのマッピングを構築。
2. 商品データオブジェクトをヘッダー順に並べ替えて2次元配列化。
3. `spreadsheets.values.append` (`valueInputOption: 'USER_ENTERED'`, `insertDataOption: 'INSERT_ROWS'`) で末尾追加。

```ts
await sheets.spreadsheets.values.append({
  spreadsheetId,
  range: 'Sheet1!A1',
  valueInputOption: 'USER_ENTERED',
  insertDataOption: 'INSERT_ROWS',
  requestBody: { values: [orderedRow] },
});
```

### D-2. 新規シート作成（雛形コピー）
1. `spreadsheets.batchUpdate` の `addSheet` リクエストで新規シート作成。
2. 続けて `updateCells` または `values.update` でヘッダー行を流し込む。
3. 必要なら `repeatCell` でヘッダーの書式（太字、背景色）を一括適用。

`batchUpdate` は1リクエストに複数Request配列を入れて1往復で完結させるのが基本。

---

## E. Driveフォルダ命名規則 3案

### 案1: `[商品コード]_短縮商品名`
例: `KM-2604-001_オーバーサイズT`
- 長所: ソート可能、商品コードで一意性担保、製造会社が型番で照合しやすい
- 短所: 商品コード採番ルールが先に必要

### 案2: `YYYYMM_短縮商品名_カラー`
例: `202604_オーバーサイズT_ブラック`
- 長所: 時系列ソート可能、人間に分かりやすい
- 短所: 同一月に同名商品が出ると衝突、カラー違いで別フォルダになり煩雑

### 案3: `短縮商品名_ID下4桁`
例: `オーバーサイズT_a3f9`
- 長所: 短くて視覚的、Supabase UUID由来で衝突しない
- 短所: 時系列ソート不可、製造会社からは「順番が分からない」

**推奨: 案1**。理由: 製造会社との共有を考えると型番ベースが業務慣習に合う。商品コードは Phase 0 で `B型番-カラー-サイズ` 等のルールが既に設計済みのはずなので、それを流用する。

---

## Sources
- [Choose Google Sheets API scopes | Google for Developers](https://developers.google.com/workspace/sheets/api/scopes)
- [Node.js quickstart | Google Sheets](https://developers.google.com/workspace/sheets/api/quickstart/nodejs)
- [Method: spreadsheets.batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate)
- [Update spreadsheets | Google Sheets](https://developers.google.com/workspace/sheets/api/guides/batchupdate)
- [Service accounts overview | Google Cloud IAM](https://cloud.google.com/iam/docs/service-account-overview)
- [Usage limits | Google Drive API](https://developers.google.com/workspace/drive/api/guides/limits)
- [Google Drive Node: Service Accounts do not have storage quota (n8n issue #26050)](https://github.com/n8n-io/n8n/issues/26050)
- [Handle google drive's service account limit of 15GB](https://harshalrj25.medium.com/handle-google-drives-service-account-limit-of-15gb-6d67d468c7f9)
- [API Reference: Edge Runtime | Next.js](https://nextjs.org/docs/app/api-reference/edge)
- [Using Node.js Modules in Edge Runtime | Next.js](https://nextjs.org/docs/messages/node-module-in-edge-runtime)
- [Google Sheets API authentication on Vercel (next.js discussion #38430)](https://github.com/vercel/next.js/discussions/38430)
