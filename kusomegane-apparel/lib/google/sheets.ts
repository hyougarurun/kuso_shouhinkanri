import { google } from "googleapis"
import type { OAuth2Client } from "google-auth-library"
import type { Product } from "@/types"
import { createOAuth2Client } from "./auth"

const SPREADSHEET_ID_ENV = "GOOGLE_SHEETS_SPREADSHEET_ID"
const SHEET_NAME_ENV = "GOOGLE_SHEETS_TARGET_SHEET_NAME"
const DEFAULT_SHEET_NAME = "商品管理"

const HEADER_ROW = [
  "商品",
  "商品番号",
  "色",
  "サイズ",
  "加工",
  "ボディ型番",
  "デザインファイル",
  "備考",
]

export type RegisterResult = {
  rowNumber: number
  mode: "append" | "update"
  sheetName: string
}

/**
 * Product → シート 1 行（A〜H）へマッピング。
 * A 列（商品画像）は空欄。Phase 2 で =IMAGE() や埋め込み対応予定。
 */
export function buildRowValues(product: Product): string[] {
  return [
    "", // A: 商品（画像、将来 =IMAGE() で埋める）
    product.productNumber, // B: 商品番号
    product.colors.join("・"), // C: 色
    product.sizes.join("・"), // D: サイズ
    product.processingInstruction, // E: 加工
    product.bodyModelNumber, // F: ボディ型番
    product.driveFolderUrl, // G: デザインファイル（Drive URL）
    product.notes, // H: 備考
  ]
}

function sheetsClient(auth: OAuth2Client) {
  return google.sheets({ version: "v4", auth })
}

function requireSpreadsheetId(): string {
  const id = process.env[SPREADSHEET_ID_ENV]
  if (!id) throw new Error(`${SPREADSHEET_ID_ENV} が未設定です`)
  return id
}

/** ターゲットシート名（環境変数で上書き可、デフォルト「商品管理」） */
export function getTargetSheetName(): string {
  const name = process.env[SHEET_NAME_ENV]
  return name && name.trim().length > 0 ? name.trim() : DEFAULT_SHEET_NAME
}

/** シート名を range 内で安全に使うための quote（シングルクォートは倍加） */
function quoteSheetName(name: string): string {
  return `'${name.replace(/'/g, "''")}'`
}

/**
 * ターゲットシートが無ければ作成してヘッダー行を書き込む。
 * 既にあれば何もしない。
 */
async function ensureSheetWithHeader(
  client: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  sheetName: string,
): Promise<void> {
  const meta = await client.spreadsheets.get({ spreadsheetId })
  const exists = meta.data.sheets?.some(
    (s) => s.properties?.title === sheetName,
  )
  if (exists) return

  // 新規シート作成
  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        { addSheet: { properties: { title: sheetName } } },
      ],
    },
  })

  // ヘッダー行（A1:H1）
  await client.spreadsheets.values.update({
    spreadsheetId,
    range: `${quoteSheetName(sheetName)}!A1:H1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [HEADER_ROW] },
  })
}

/**
 * B 列（商品番号）を走査して一致行を返す。1 行目はヘッダーなのでスキップ。
 */
async function findExistingRow(
  client: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  sheetName: string,
  productNumber: string,
): Promise<number | null> {
  const res = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetName(sheetName)}!B:B`,
  })
  const values = res.data.values ?? []
  // i=0 はヘッダー（"商品番号"）
  for (let i = 1; i < values.length; i++) {
    const cell = values[i]?.[0]
    if (cell === productNumber) return i + 1 // Sheets は 1-indexed
  }
  return null
}

/**
 * 商品をターゲットシート（デフォルト「商品管理」）に登録する。
 * - シートが無ければ作成してヘッダー付与
 * - 同じ B 列（商品番号）の行が既にあれば UPDATE
 * - 無ければ末尾に APPEND
 */
export async function registerProductToSheet(
  product: Product,
  auth?: OAuth2Client,
): Promise<RegisterResult> {
  const spreadsheetId = requireSpreadsheetId()
  const sheetName = getTargetSheetName()
  const client = sheetsClient(auth ?? createOAuth2Client())

  await ensureSheetWithHeader(client, spreadsheetId, sheetName)

  const row = buildRowValues(product)
  const existing = await findExistingRow(
    client,
    spreadsheetId,
    sheetName,
    product.productNumber,
  )

  if (existing) {
    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${quoteSheetName(sheetName)}!A${existing}:H${existing}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    })
    return { rowNumber: existing, mode: "update", sheetName }
  }

  const appendRes = await client.spreadsheets.values.append({
    spreadsheetId,
    range: `${quoteSheetName(sheetName)}!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  })
  const updatedRange = appendRes.data.updates?.updatedRange ?? ""
  const match = updatedRange.match(/!A(\d+)/)
  const rowNumber = match ? parseInt(match[1], 10) : 0
  return { rowNumber, mode: "append", sheetName }
}

// 後方互換: 旧名からの alias
export const registerProductToList1 = registerProductToSheet
