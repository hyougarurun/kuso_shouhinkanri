# KUSOMEGANE アパレル商品管理ツール
## 技術仕様書・実装ガイド（自律開発エージェント向け）

**バージョン:** 1.0  
**作成日:** 2026-04-16

---

## 0. このドキュメントの使い方

このドキュメントは自律開発エージェントがゼロから実装するための仕様書です。  
`01_PURPOSE.md` → `02_REQUIREMENTS.md` → **このファイル** の順で読んでください。

---

## 1. 技術スタック（確定）

| 領域 | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 14以上 |
| スタイリング | Tailwind CSS | 3以上 |
| 言語 | TypeScript | 5以上 |
| DB | Supabase (PostgreSQL) | 最新安定版 |
| ストレージ | Supabase Storage | - |
| AI | Anthropic API | claude-sonnet-4-20250514 |
| 外部連携 | Google Sheets API v4 / Google Drive API v3 | - |
| 認証 | Supabase Auth | - |
| デプロイ | Vercel | - |

---

## 2. 開発フェーズ

### Phase 0：ローカルMVP（まずここを完成させる）
- Next.js + Tailwind + TypeScript
- LocalStorageでデータ永続化
- Anthropic APIで画像解析・キャプション生成
- Google Drive / Sheets連携は**モック（手動入力欄のみ）**
- 動作確認できればOK

### Phase 1：外部連携（Phase 0完成後）
- Google OAuth2認証
- Google Sheets API：行追加・番号採番・発注数量更新
- Google Drive API：フォルダ作成・画像アップロード
- Supabase DBへデータ移行

### Phase 2：本番化
- Supabase Auth（k2のみアクセス）
- Vercelデプロイ
- スマートフォン最適化

---

## 3. プロジェクト構成

```
kusomegane-apparel/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # ホーム（商品一覧）
│   ├── products/
│   │   ├── new/page.tsx            # 新規商品登録ウィザード
│   │   └── [id]/page.tsx           # 商品詳細
│   └── api/
│       ├── analyze-image/route.ts  # 画像解析API
│       ├── generate-caption/route.ts # キャプション生成API
│       ├── sheets/route.ts         # Sheets API連携
│       └── drive/route.ts          # Drive API連携
├── components/
│   ├── ProductCard.tsx             # ホームのカードコンポーネント
│   ├── ProgressBar.tsx             # 8分割進捗バー
│   ├── StepTimeline.tsx            # 詳細画面のタイムライン
│   ├── WizardSteps/
│   │   ├── StepA_ImageUpload.tsx
│   │   ├── StepB_BasicInfo.tsx
│   │   ├── StepC_Caption.tsx
│   │   └── StepD_Confirm.tsx
│   └── ui/                         # 汎用UIコンポーネント
│       ├── Chip.tsx
│       ├── StatusBadge.tsx
│       └── SampleCountdown.tsx
├── lib/
│   ├── storage.ts                  # LocalStorage操作
│   ├── anthropic.ts                # AI API呼び出し
│   ├── sheets.ts                   # Google Sheets API
│   ├── drive.ts                    # Google Drive API
│   ├── productNumber.ts            # 商品番号採番ロジック
│   └── caption.ts                  # キャプション組み立て
├── types/
│   └── index.ts                    # 型定義
├── constants/
│   └── index.ts                    # 定数（STEPS・カラー選択肢等）
└── .env.local                      # 環境変数
```

---

## 4. 環境変数

```bash
# .env.local

# Anthropic
ANTHROPIC_API_KEY=

# Google (Phase 1)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# 外部リソースID（確定値）
NEXT_PUBLIC_SPREADSHEET_ID=1a6vkmUC_f7jPYirOwhUpbQcIXYvVjghbBc2fSr6X9wE
NEXT_PUBLIC_DRIVE_ROOT_FOLDER_ID=1jP6r0FSeSva_4z-XXiguKHzZ5uAYL1L1
NEXT_PUBLIC_SHEET_NAME=商品詳細（リスト生成）

# Supabase (Phase 1)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 5. 型定義（types/index.ts）

```typescript
export type StepStatus = "pending" | "in_progress" | "done"
export type AssetStatus = "pending" | "uploaded" | "generated" | "done"
export type ProductType = "Tシャツ" | "パーカー" | "スウェット" | "ロンT" | "トートバッグ" | "キャップ" | "その他"
export type ProcessingType = "刺繍" | "プリント（インク）" | "DTF" | "転写" | "刺繍+インク" | "刺繍+DTF" | "その他"

export interface FlowStep {
  stepNumber: number        // 1-8
  status: StepStatus
  completedAt?: string
  notes: string
}

export interface ProductAssets {
  compositeImage: AssetStatus
  processingImage: AssetStatus
  aiWearingImage: AssetStatus
  sizeDetailDone: boolean
  captionDone: boolean
}

export interface OrderQuantities {
  S?: number
  M?: number
  L?: number
  XL?: number
  XXL?: number
}

export interface Product {
  id: string
  productNumber: string
  baseProductNumber: number
  colorVariantIndex?: number
  name: string
  series: string
  productType: string
  colors: string[]
  sizes: string[]
  processingType: string
  processingInstruction: string
  bodyModelNumber: string
  material: string
  isMadeToOrder: boolean
  freeShipping: boolean
  notes: string
  orderQuantities: OrderQuantities
  driveFolderUrl: string
  sheetRowNumbers: Record<string, number>
  captionText: string
  imagePreview: string | null       // Base64データURL or null
  currentStep: number
  steps: FlowStep[]
  assets: ProductAssets
  sampleArrivalDate?: string
  createdAt: string
  updatedAt: string
}

export interface ImageAnalysis {
  productType: string
  bodyColor: string
  designElements: string
  processingHint: string
  overallVibe: string
}
```

---

## 6. 定数（constants/index.ts）

```typescript
export const FLOW_STEPS = [
  { id: 1, name: "デザイン作成",            icon: "✏️" },
  { id: 2, name: "合成 & 登録",             icon: "🖼️" },
  { id: 3, name: "Drive格納",               icon: "📁" },
  { id: 4, name: "メーカー共有（サンプル依頼）", icon: "📤" },
  { id: 5, name: "サンプル到着確認",          icon: "📦" },
  { id: 6, name: "正式発注 & 物撮り",        icon: "📸" },
  { id: 7, name: "商品登録素材準備",         icon: "📋" },
  { id: 8, name: "販売準備完了",             icon: "🚀" },
] as const

export const COLOR_OPTIONS = [
  "ブラック","ホワイト","ネイビー","グレー","ミックスグレー",
  "ピンク","アッシュ","マリンブルー","キャメル","ロイヤルブルー",
  "アシッドブルー","アイビーグリーン","ヘイジーブラック","バニラホワイト","ナチュラル"
]

export const SIZE_OPTIONS = ["S","M","L","XL","XXL","XXXL","フリー","90〜XXXL"]

export const PROCESSING_OPTIONS = [
  "刺繍","プリント（インク）","DTF","転写","刺繍+インク","刺繍+DTF"
]

export const BRAND_YELLOW = "#FFD600"

// LocalStorageキー
export const STORAGE_KEYS = {
  PRODUCTS: "kusomegane_products",
  SETTINGS: "kusomegane_settings",
  DRAFT:    "kusomegane_draft",
} as const
```

---

## 7. LocalStorage操作（lib/storage.ts）

```typescript
import { Product } from "@/types"
import { STORAGE_KEYS } from "@/constants"

export const storage = {
  getProducts: (): Product[] => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) ?? "[]")
    } catch { return [] }
  },

  saveProducts: (products: Product[]): void => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  },

  upsertProduct: (product: Product): void => {
    const products = storage.getProducts()
    const idx = products.findIndex(p => p.id === product.id)
    const updated = { ...product, updatedAt: new Date().toISOString() }
    if (idx >= 0) products[idx] = updated
    else products.unshift(updated)
    storage.saveProducts(products)
  },

  deleteProduct: (id: string): void => {
    storage.saveProducts(storage.getProducts().filter(p => p.id !== id))
  },

  getDraft: (): Partial<Product> | null => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFT) ?? "null")
    } catch { return null }
  },

  saveDraft: (draft: Partial<Product>): void => {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft))
  },

  clearDraft: (): void => {
    localStorage.removeItem(STORAGE_KEYS.DRAFT)
  },
}

// 商品番号採番（LocalStorageから）
export const getNextBaseNumber = (): number => {
  const products = storage.getProducts()
  let max = 58 // 現在の最大値
  for (const p of products) {
    const n = parseInt(String(p.productNumber).split("-")[0])
    if (!isNaN(n) && n > max) max = n
  }
  return max + 1
}

export const assignProductNumbers = (base: number, colors: string[]): string[] => {
  if (colors.length <= 1) return [`${base}`]
  return colors.map((_, i) => `${base}-${i + 1}`)
}
```

---

## 8. Anthropic API（lib/anthropic.ts）

```typescript
import Anthropic from "@anthropic-ai/sdk"
import { ImageAnalysis } from "@/types"
import { Product } from "@/types"

const client = new Anthropic()

// 画像解析
export async function analyzeProductImage(
  base64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<ImageAnalysis> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 }
        },
        {
          type: "text",
          text: `この商品合成画像（白背景）を分析してJSONのみ返答:
{"productType":"Tシャツ/パーカー/スウェット/ロンT/トートバッグ/キャップ/その他","bodyColor":"色名（日本語）","designElements":"デザイン要素の説明","processingHint":"刺繍/プリント/DTF/転写/その他","overallVibe":"全体の雰囲気（20字以内）"}`
        }
      ]
    }]
  })
  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return JSON.parse(text.replace(/```json|```/g, "").trim())
}

// キャプション生成
export async function generateCaption(
  product: Partial<Product>,
  analysis: ImageAnalysis | null
): Promise<{ description: string; designDesc: string }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: "あなたはKUSOMEGANEブランドのEC担当者です。フレンドリー・ポップ・ファンと近い文体で書いてください。「〜です！」「〜してほしい！」調。JSONのみ返答。",
    messages: [{
      role: "user",
      content: `商品名: ${product.name}
シリーズ: ${product.series}
カラー: ${product.colors?.join("・")}
加工種別: ${product.processingType}
受注生産: ${product.isMadeToOrder ? "あり（約3週間）" : "なし"}
画像解析: ${JSON.stringify(analysis ?? {})}

{"description":"3〜5文のシリーズ説明+商品説明+購買促進文（プレゼント・お揃い需要にも触れる）","designDesc":"【商品情報】デザイン欄に入れる1文"}`
    }]
  })
  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return JSON.parse(text.replace(/```json|```/g, "").trim())
}

// キャプション組み立て（テンプレ適用）
export function buildFullCaption(
  product: Partial<Product>,
  description: string,
  designDesc: string
): string {
  const lines: string[] = []

  if (product.isMadeToOrder)
    lines.push("※※※※※【この商品は受注生産商品です】※※※※※")
  if (product.freeShipping)
    lines.push("※※※※※【この商品に送料はかかりません】※※※※※")
  if (lines.length) lines.push("")

  lines.push(description)
  lines.push("")
  lines.push("【商品情報】")
  lines.push(`カラー：${product.colors?.join("・")}`)
  lines.push(`デザイン：${designDesc}`)
  lines.push(`素材：${product.material}`)

  if (product.processingType?.includes("刺繍"))
    lines.push("※デザインは刺繍加工です。")

  if (product.isMadeToOrder) {
    lines.push("")
    lines.push("【注意事項】")
    lines.push("※受注生産商品になりますので、お届けまで約3週間程度いただいております。ご了承の上お買い求めください。")
    lines.push("※生産状況によって早めにお届けになる場合もあります。")
    lines.push("※ご注文商品の中で一番お時間のかかる商品に合わせて、発送スケジュールを組ませていただいております。")
    lines.push("※欠陥品を除いて返品、交換は受け付けておりませんのでご理解の程お願いいたします。")
  }

  return lines.join("\n")
}
```

---

## 9. Google Sheets API（lib/sheets.ts）

```typescript
import { google } from "googleapis"

const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID!
const SHEET_NAME = process.env.NEXT_PUBLIC_SHEET_NAME!

// 認証（Phase 1でOAuth2に切り替え）
const getAuth = () => new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
})

// 最大商品番号を取得（採番用）
export async function getMaxProductNumber(): Promise<number> {
  const auth = await getAuth().getClient()
  const sheets = google.sheets({ version: "v4", auth: auth as any })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B:B`,
  })
  let max = 58
  for (const row of res.data.values ?? []) {
    const n = parseInt(String(row[0] ?? "").split("-")[0])
    if (!isNaN(n) && n > max) max = n
  }
  return max
}

// 行追加（カラーバリエーション1色分）
export async function appendProductRow(row: {
  productNumber: string
  color: string
  size: string
  processing: string
  bodyModel: string
  driveUrl: string
  notes: string
}): Promise<number> {
  const auth = await getAuth().getClient()
  const sheets = google.sheets({ version: "v4", auth: auth as any })
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:N`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        "",              // A: 画像（手動）
        row.productNumber, // B
        row.color,         // C
        row.size,          // D
        row.processing,    // E
        row.bodyModel,     // F
        row.driveUrl,      // G
        row.notes,         // H
        "", "", "", "", "", // I-M: 発注数量（空）
      ]]
    }
  })
  // 追加された行番号を返す
  const updatedRange = res.data.updates?.updatedRange ?? ""
  const match = updatedRange.match(/(\d+)$/)
  return match ? parseInt(match[1]) : -1
}

// 発注数量を更新
export async function updateOrderQuantities(
  rowNumber: number,
  quantities: { S?: number; M?: number; L?: number; XL?: number; XXL?: number }
): Promise<void> {
  const auth = await getAuth().getClient()
  const sheets = google.sheets({ version: "v4", auth: auth as any })
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!I${rowNumber}:N${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        quantities.S ?? "",
        quantities.M ?? "",
        quantities.L ?? "",
        quantities.XL ?? "",
        quantities.XXL ?? "",
        `=SUM(I${rowNumber}:M${rowNumber})`,
      ]]
    }
  })
}
```

---

## 10. Google Drive API（lib/drive.ts）

```typescript
import { google } from "googleapis"
import { Readable } from "stream"

const ROOT_FOLDER_ID = process.env.NEXT_PUBLIC_DRIVE_ROOT_FOLDER_ID!

const getAuth = () => new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}"),
  scopes: ["https://www.googleapis.com/auth/drive"]
})

// 商品番号フォルダを取得 or 作成
export async function getOrCreateProductFolder(
  baseNumber: number
): Promise<{ folderId: string; folderUrl: string }> {
  const auth = await getAuth().getClient()
  const drive = google.drive({ version: "v3", auth: auth as any })
  const folderName = String(baseNumber)

  // 既存フォルダ検索
  const res = await drive.files.list({
    q: `name='${folderName}' and '${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id,webViewLink)",
  })

  if (res.data.files && res.data.files.length > 0) {
    const f = res.data.files[0]
    return { folderId: f.id!, folderUrl: f.webViewLink! }
  }

  // 新規作成
  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [ROOT_FOLDER_ID],
    },
    fields: "id,webViewLink",
  })
  return { folderId: created.data.id!, folderUrl: created.data.webViewLink! }
}

// 合成画像をアップロード
export async function uploadCompositeImage(
  folderId: string,
  imageBuffer: Buffer,
  fileName: string = "composite.png"
): Promise<string> {
  const auth = await getAuth().getClient()
  const drive = google.drive({ version: "v3", auth: auth as any })
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: "image/png", body: Readable.from(imageBuffer) },
    fields: "webViewLink",
  })
  return res.data.webViewLink!
}
```

---

## 11. UIデザイン仕様

### ブランドカラー

```css
--brand-yellow: #FFD600;
--brand-black:  #111111;
--step-done:    #22C55E;
--step-active:  #FFD600;
--step-pending: #E5E7EB;
--danger:       #EF4444;
--warning:      #D97706;
```

### ホーム画面カードレイアウト

```
┌─────────────────┐
│  [商品画像]      │  ← 背景色: 商品カラーに応じた色
│  ┌No.59-1 対応中┐│  ← 画像上部オーバーレイ
│                  │
│ [■■■■□□□□] 3/8 │  ← 画像下端の進捗バー（黄色が完了分）
├─────────────────┤
│ ポチクソ 2フェーズ│  ← 商品名（13px, bold）
│ ポチクソ · ブラック│  ← シリーズ・カラー（11px, muted）
│ 次: 📤 メーカー共有│  ← 次のアクション
└─────────────────┘
```

### ステップタイムライン

```
○─ ✏️ デザイン作成        ── 完了（取り消し線）
●─ 🖼️ 合成 & 登録         ── 完了
●─ 📁 Drive格納           ── 完了
●─ 📤 メーカー共有         ── 対応中（太字）
○─ 📦 サンプル到着確認     ── [日付入力欄] あと3日
○─ 📸 発注・物撮り         ── 未着手
○─ 📋 素材準備             ── [チェックリスト展開]
○─ 🚀 販売準備完了         ── 未着手

各○はクリックで完了トグル
```

---

## 12. APIルート仕様

### POST /api/analyze-image
```typescript
// リクエスト
{ base64: string; mediaType: string }

// レスポンス
{ analysis: ImageAnalysis }
```

### POST /api/generate-caption
```typescript
// リクエスト
{ product: Partial<Product>; analysis: ImageAnalysis | null }

// レスポンス
{ caption: string }  // buildFullCaption済みの完成形テキスト
```

### POST /api/sheets/append
```typescript
// リクエスト
{ rows: SheetRow[] }  // カラーバリエーション分の配列

// レスポンス
{ rowNumbers: Record<string, number> }  // { "59-1": 5, "59-2": 6 }
```

### POST /api/drive/upload
```typescript
// リクエスト
{ baseProductNumber: number; imageBase64: string }

// レスポンス
{ folderId: string; folderUrl: string; imageUrl: string }
```

---

## 13. 実装時の注意点

1. **画像のBase64保存について**  
   LocalStorageには5MB制限がある。アップロード時にcanvas APIでリサイズ（最大800px）してから保存する。

2. **スプシA列（商品画像）はAPI非対応**  
   Sheets APIではセルへの画像埋め込みができないため、この列は手動対応とする。

3. **商品番号はスプシとLocalStorage両方から取得**  
   Phase 0はLocalStorageのみ（最大値+1）、Phase 1以降はスプシのB列を優先する。

4. **カラーバリエーションの扱い**  
   登録時にカラーを複数選択した場合、Productレコードをカラー数分生成して個別に管理する。ホーム画面では各色が独立したカードになる。

5. **サンプル到着日のカウントダウン**  
   STEP 5が未完了かつ到着予定日が設定されている場合、ホームカードに「あと◯日」を表示。0日以下は赤、3日以下は黄で表示。

6. **Next.js App RouterでのLocalStorage**  
   `"use client"` ディレクティブが必要。サーバーコンポーネントでは `typeof window === "undefined"` でガードする。
