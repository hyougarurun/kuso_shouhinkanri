import { google } from "googleapis"
import { Readable } from "node:stream"
import type { OAuth2Client } from "google-auth-library"
import { createOAuth2Client } from "./auth"

const PARENT_FOLDER_ENV = "GOOGLE_DRIVE_PARENT_FOLDER_ID"
const FOLDER_MIME = "application/vnd.google-apps.folder"

function requireParentFolderId(): string {
  const id = process.env[PARENT_FOLDER_ENV]
  if (!id) throw new Error(`${PARENT_FOLDER_ENV} が未設定です`)
  return id
}

function driveClient(auth: OAuth2Client) {
  return google.drive({ version: "v3", auth })
}

export type DriveFolderInfo = {
  id: string
  name: string
  webViewLink: string
  isNew: boolean
}

/**
 * 商品番号フォルダが親フォルダ内に既にあれば返し、無ければ作成する。
 * 命名規則: 商品番号のみ（例 "59", "60-1"）。
 */
export async function ensureProductFolder(
  productNumber: string,
  auth?: OAuth2Client,
): Promise<DriveFolderInfo> {
  const client = driveClient(auth ?? createOAuth2Client())
  const parentId = requireParentFolderId()

  const escapedName = productNumber.replace(/'/g, "\\'")
  const query = [
    `'${parentId}' in parents`,
    `name = '${escapedName}'`,
    `mimeType = '${FOLDER_MIME}'`,
    "trashed = false",
  ].join(" and ")

  const searchRes = await client.files.list({
    q: query,
    fields: "files(id, name, webViewLink)",
    pageSize: 1,
  })
  const existing = searchRes.data.files?.[0]
  if (existing?.id) {
    return {
      id: existing.id,
      name: existing.name ?? productNumber,
      webViewLink: existing.webViewLink ?? "",
      isNew: false,
    }
  }

  const createRes = await client.files.create({
    requestBody: {
      name: productNumber,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    },
    fields: "id, name, webViewLink",
  })
  const folder = createRes.data
  if (!folder.id) {
    throw new Error("Drive フォルダ作成に失敗しました（id 未返却）")
  }
  return {
    id: folder.id,
    name: folder.name ?? productNumber,
    webViewLink: folder.webViewLink ?? "",
    isNew: true,
  }
}

export type DriveUploadInput = {
  folderId: string
  filename: string
  mimeType: string
  data: Buffer | Uint8Array
}

export type DriveUploadResult = {
  id: string
  name: string
  mimeType: string
  sizeBytes?: number
  webViewLink: string
}

/**
 * ファイルを「リンクを知っている全員が閲覧可」にする。
 * =IMAGE() でシートに画像埋め込みする用途で必要。
 */
export async function makeFilePubliclyViewable(
  fileId: string,
  auth?: OAuth2Client,
): Promise<void> {
  const client = driveClient(auth ?? createOAuth2Client())
  await client.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  })
}

/** Drive ファイルを =IMAGE() で表示するための URL（公開設定済み前提） */
export function getDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

/**
 * 指定フォルダにバイナリをアップロードして file id / web view link を返す。
 * MIME 無制限（.ai / .psd / .zip 等も可）。
 */
export async function uploadFileToDrive(
  input: DriveUploadInput,
  auth?: OAuth2Client,
): Promise<DriveUploadResult> {
  const client = driveClient(auth ?? createOAuth2Client())

  const buffer = Buffer.isBuffer(input.data)
    ? input.data
    : Buffer.from(input.data)
  const stream = Readable.from(buffer)

  const res = await client.files.create({
    requestBody: {
      name: input.filename,
      parents: [input.folderId],
      mimeType: input.mimeType,
    },
    media: {
      mimeType: input.mimeType,
      body: stream,
    },
    fields: "id, name, mimeType, size, webViewLink",
  })
  const f = res.data
  if (!f.id) {
    throw new Error("Drive アップロードに失敗しました（id 未返却）")
  }
  return {
    id: f.id,
    name: f.name ?? input.filename,
    mimeType: f.mimeType ?? input.mimeType,
    sizeBytes: f.size ? Number(f.size) : undefined,
    webViewLink: f.webViewLink ?? "",
  }
}
