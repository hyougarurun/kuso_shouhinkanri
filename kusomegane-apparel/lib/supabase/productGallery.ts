import { randomUUID } from "node:crypto"
import { createServerClient } from "./server"
import type { ProductGalleryItemRow } from "./database.types"

const BUCKET = "product-gallery"
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2 // 2h

export interface GalleryItemRef {
  id: string
  productId: string
  storagePath: string
  bucket: string
  mimeType: string
  sizeBytes?: number
  width?: number
  height?: number
  sortOrder: number
  createdAt: string
}

export interface GalleryItemWithUrl extends GalleryItemRef {
  signedUrl: string
}

function rowToRef(row: ProductGalleryItemRow): GalleryItemRef {
  return {
    id: row.id,
    productId: row.product_id,
    storagePath: row.storage_path,
    bucket: row.bucket,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export interface UploadGalleryInput {
  productId: string
  fileBuffer: ArrayBuffer
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  sortOrder?: number
}

export async function uploadGalleryItem(
  input: UploadGalleryInput,
): Promise<GalleryItemRef> {
  const sb = createServerClient()
  const id = randomUUID()
  const ext = extFromMime(input.mimeType)
  const storagePath = `${input.productId}/${id}.${ext}`

  const { error: uploadError } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, input.fileBuffer, {
      contentType: input.mimeType,
      upsert: false,
    })
  if (uploadError) {
    throw new Error(`Storage upload 失敗: ${uploadError.message}`)
  }

  // sort_order が未指定なら末尾（現行 count）
  let sortOrder = input.sortOrder
  if (sortOrder === undefined) {
    const { count } = await sb
      .from("product_gallery_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", input.productId)
    sortOrder = count ?? 0
  }

  const { data, error } = await sb
    .from("product_gallery_items")
    .insert({
      id,
      product_id: input.productId,
      storage_path: storagePath,
      bucket: BUCKET,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error || !data) {
    await sb.storage.from(BUCKET).remove([storagePath])
    throw new Error(`DB insert 失敗: ${error?.message ?? "unknown"}`)
  }

  return rowToRef(data)
}

export async function listGalleryItems(
  productId: string,
): Promise<GalleryItemWithUrl[]> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from("product_gallery_items")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (error) throw new Error(`DB query 失敗: ${error.message}`)

  const rows = data ?? []
  if (rows.length === 0) return []

  // バルクで Signed URL 取得（同一バケット前提）
  const paths = rows.map((r) => r.storage_path)
  const { data: signed } = await sb.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)

  const urlByPath = new Map<string, string>()
  ;(signed ?? []).forEach((s) => {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl)
  })

  return rows.map((row) => ({
    ...rowToRef(row),
    signedUrl: urlByPath.get(row.storage_path) ?? "",
  }))
}

export async function deleteGalleryItem(itemId: string): Promise<void> {
  const sb = createServerClient()
  const { data, error: selectErr } = await sb
    .from("product_gallery_items")
    .select("storage_path, bucket")
    .eq("id", itemId)
    .single()
  if (selectErr) throw new Error(`DB select 失敗: ${selectErr.message}`)

  const { error: delErr } = await sb
    .from("product_gallery_items")
    .delete()
    .eq("id", itemId)
  if (delErr) throw new Error(`DB delete 失敗: ${delErr.message}`)

  await sb.storage.from(data.bucket).remove([data.storage_path])
}

export async function deleteGalleryByProduct(productId: string): Promise<void> {
  const sb = createServerClient()
  const { data } = await sb
    .from("product_gallery_items")
    .select("storage_path, bucket")
    .eq("product_id", productId)
  await sb.from("product_gallery_items").delete().eq("product_id", productId)
  const paths = (data ?? []).map((r) => r.storage_path)
  if (paths.length > 0) {
    await sb.storage.from(BUCKET).remove(paths)
  }
}

export async function reorderGalleryItems(
  productId: string,
  orderedIds: string[],
): Promise<void> {
  const sb = createServerClient()
  // 1 件ずつ UPDATE（バルク UPSERT は conflict 解決が面倒なので）
  await Promise.all(
    orderedIds.map((id, idx) =>
      sb
        .from("product_gallery_items")
        .update({ sort_order: idx })
        .eq("id", id)
        .eq("product_id", productId),
    ),
  )
}

export async function getSignedUrlsForItems(
  items: Array<{ id: string; bucket: string; storagePath: string }>,
): Promise<Record<string, string>> {
  const sb = createServerClient()
  // 同一バケットにまとめて発行
  const byBucket = new Map<string, { ids: string[]; paths: string[] }>()
  for (const it of items) {
    const entry = byBucket.get(it.bucket) ?? { ids: [], paths: [] }
    entry.ids.push(it.id)
    entry.paths.push(it.storagePath)
    byBucket.set(it.bucket, entry)
  }
  const result: Record<string, string> = {}
  await Promise.all(
    Array.from(byBucket.entries()).map(async ([bucket, entry]) => {
      const { data } = await sb.storage
        .from(bucket)
        .createSignedUrls(entry.paths, SIGNED_URL_TTL_SECONDS)
      ;(data ?? []).forEach((s, i) => {
        if (s.signedUrl) result[entry.ids[i]] = s.signedUrl
      })
    }),
  )
  return result
}
