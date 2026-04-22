import { randomUUID } from "node:crypto"
import { createServerClient } from "./server"
import type { CreatorBackgroundRow } from "./database.types"

const BUCKET = "creator-backgrounds"
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

export interface CreatorBackground {
  id: string
  storagePath: string
  bucket: string
  mimeType: string
  sizeBytes?: number
  width?: number
  height?: number
  sourceStoragePath?: string
  sourceMimeType?: string
  prompt: string
  model: string
  quality: string
  title: string
  isFavorite: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface CreatorBackgroundWithUrl extends CreatorBackground {
  signedUrl: string
  sourceSignedUrl?: string
}

function rowToModel(row: CreatorBackgroundRow): CreatorBackground {
  return {
    id: row.id,
    storagePath: row.storage_path,
    bucket: row.bucket,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    sourceStoragePath: row.source_storage_path ?? undefined,
    sourceMimeType: row.source_mime_type ?? undefined,
    prompt: row.prompt,
    model: row.model,
    quality: row.quality,
    title: row.title,
    isFavorite: row.is_favorite,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface CreateBackgroundInput {
  imageBuffer: ArrayBuffer
  mimeType: string
  width?: number
  height?: number
  sourceBuffer?: ArrayBuffer
  sourceMimeType?: string
  prompt: string
  model: string
  quality: string
  title?: string
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "png"
}

export async function createBackgroundRecord(
  input: CreateBackgroundInput,
): Promise<CreatorBackground> {
  const sb = createServerClient()
  const id = randomUUID()
  const ymd = new Date().toISOString().slice(0, 10)
  const ext = extFromMime(input.mimeType)
  const storagePath = `${ymd}/${id}.${ext}`

  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, input.imageBuffer, {
      contentType: input.mimeType,
      upsert: false,
    })
  if (upErr) throw new Error(`Storage upload 失敗: ${upErr.message}`)

  let sourcePath: string | null = null
  if (input.sourceBuffer && input.sourceMimeType) {
    const srcExt = extFromMime(input.sourceMimeType)
    sourcePath = `${ymd}/sources/${id}.${srcExt}`
    const { error: srcErr } = await sb.storage
      .from(BUCKET)
      .upload(sourcePath, input.sourceBuffer, {
        contentType: input.sourceMimeType,
        upsert: false,
      })
    if (srcErr) {
      // ソース保存失敗しても生成物は残す
      sourcePath = null
    }
  }

  const { data, error } = await sb
    .from("creator_backgrounds")
    .insert({
      id,
      storage_path: storagePath,
      bucket: BUCKET,
      mime_type: input.mimeType,
      size_bytes: input.imageBuffer.byteLength,
      width: input.width ?? null,
      height: input.height ?? null,
      source_storage_path: sourcePath,
      source_mime_type: input.sourceMimeType ?? null,
      prompt: input.prompt,
      model: input.model,
      quality: input.quality,
      title: input.title ?? "",
      is_favorite: false,
      notes: "",
    })
    .select()
    .single()

  if (error || !data) {
    await sb.storage.from(BUCKET).remove([storagePath])
    if (sourcePath) await sb.storage.from(BUCKET).remove([sourcePath])
    throw new Error(`DB insert 失敗: ${error?.message ?? "unknown"}`)
  }
  return rowToModel(data)
}

export async function listBackgrounds(): Promise<
  CreatorBackgroundWithUrl[]
> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from("creator_backgrounds")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(`DB query 失敗: ${error.message}`)
  const rows = data ?? []
  if (rows.length === 0) return []

  const paths = rows.map((r) => r.storage_path)
  const { data: signed } = await sb.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
  const urlByPath = new Map<string, string>()
  ;(signed ?? []).forEach((s) => {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl)
  })

  return rows.map((row) => ({
    ...rowToModel(row),
    signedUrl: urlByPath.get(row.storage_path) ?? "",
  }))
}

export async function updateBackground(
  id: string,
  patch: { title?: string; isFavorite?: boolean; notes?: string },
): Promise<CreatorBackground> {
  const sb = createServerClient()
  const update: Partial<CreatorBackgroundRow> = {}
  if (patch.title !== undefined) update.title = patch.title
  if (patch.isFavorite !== undefined) update.is_favorite = patch.isFavorite
  if (patch.notes !== undefined) update.notes = patch.notes

  const { data, error } = await sb
    .from("creator_backgrounds")
    .update(update)
    .eq("id", id)
    .select()
    .single()
  if (error || !data) throw new Error(`DB update 失敗: ${error?.message ?? "unknown"}`)
  return rowToModel(data)
}

export async function deleteBackground(id: string): Promise<void> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from("creator_backgrounds")
    .select("storage_path, source_storage_path, bucket")
    .eq("id", id)
    .single()
  if (error || !data) throw new Error(`DB select 失敗: ${error?.message ?? "not found"}`)

  const paths = [data.storage_path]
  if (data.source_storage_path) paths.push(data.source_storage_path)

  await sb.from("creator_backgrounds").delete().eq("id", id)
  await sb.storage.from(data.bucket).remove(paths)
}
