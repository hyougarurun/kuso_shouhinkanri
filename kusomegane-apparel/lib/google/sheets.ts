import { google } from "googleapis"
import type { OAuth2Client } from "google-auth-library"
import type { Product } from "@/types"
import { createOAuth2Client } from "./auth"

const SPREADSHEET_ID_ENV = "GOOGLE_SHEETS_SPREADSHEET_ID"
const SHEET_TAB_NAME = "リスト1"

export type RegisterResult = {
  rowNumber: number
  mode: "append" | "update"
}

/**
 * Product → リスト1 の 1 行（A〜H 列）へマッピング。
 * A 列（商品画像）は空欄。将来 Drive にアップ済みの合成画像を
 * =IMAGE("drive link") で埋める想定。
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

/**
 * B 列（商品番号）を頭から走査して一致行を返す。
 * 見つからなければ null（未登録扱い）。
 */
async function findExistingRow(
  client: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  productNumber: string,
): Promise<number | null> {
  const res = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB_NAME}!B:B`,
  })
  const values = res.data.values ?? []
  for (let i = 0; i < values.length; i++) {
    const cell = values[i]?.[0]
    if (cell === productNumber) return i + 1 // Sheets は 1-indexed
  }
  return null
}

/**
 * 商品を ASTORE シートの「リスト1」タブに登録する。
 * 同じ B 列（商品番号）の行が既にあれば UPDATE、無ければ末尾に APPEND。
 */
export async function registerProductToList1(
  product: Product,
  auth?: OAuth2Client,
): Promise<RegisterResult> {
  const spreadsheetId = requireSpreadsheetId()
  const client = sheetsClient(auth ?? createOAuth2Client())
  const row = buildRowValues(product)

  const existing = await findExistingRow(
    client,
    spreadsheetId,
    product.productNumber,
  )

  if (existing) {
    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TAB_NAME}!A${existing}:H${existing}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    })
    return { rowNumber: existing, mode: "update" }
  }

  const appendRes = await client.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_TAB_NAME}!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  })
  const updatedRange = appendRes.data.updates?.updatedRange ?? ""
  const match = updatedRange.match(/!A(\d+)/)
  const rowNumber = match ? parseInt(match[1], 10) : 0
  return { rowNumber, mode: "append" }
}
