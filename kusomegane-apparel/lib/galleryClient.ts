import type { GalleryImage } from "@/types"
import { resizeImage } from "@/lib/imageResize"

/**
 * 画像 File から Supabase にアップロードし、LocalStorage 用の GalleryImage を返す。
 *
 * 設計:
 *  - Storage には「フル解像度（長辺 1920px / JPEG q=0.90）」を保存
 *  - LocalStorage には「300px サムネ (dataUrl)」だけ保存 → 高速表示
 *  - 拡大時は Signed URL から Storage のフル画像を取得
 */
export async function uploadGalleryFile(
  productId: string,
  file: File,
): Promise<GalleryImage> {
  // フル解像度版
  const full = await resizeImage(file, {
    maxSize: 1920,
    quality: 0.9,
    forceJpeg: true,
  })
  // サムネ版（LocalStorage 格納用）
  const thumb = await resizeImage(file, {
    maxSize: 300,
    quality: 0.75,
    forceJpeg: true,
  })

  // base64 → Blob → File 相当として multipart 送信
  const fullBlob = base64ToBlob(full.base64, full.mediaType)
  const form = new FormData()
  form.append(
    "file",
    new File([fullBlob], `gallery.${extFromMime(full.mediaType)}`, {
      type: full.mediaType,
    }),
  )
  form.append("width", String(full.width))
  form.append("height", String(full.height))

  const res = await fetch(`/api/products/${productId}/gallery/upload`, {
    method: "POST",
    body: form,
  })
  const json = (await res.json()) as
    | { item: { id: string; storagePath: string; bucket: string } }
    | { error: string }
  if (!res.ok || "error" in json) {
    throw new Error(
      "error" in json ? json.error : `upload 失敗 (HTTP ${res.status})`,
    )
  }

  return {
    id: json.item.id,
    thumbDataUrl: thumb.dataUrl,
    storagePath: json.item.storagePath,
    bucket: json.item.bucket,
    mimeType: full.mediaType,
    sizeBytes: Math.floor(full.base64.length * 0.75),
    width: full.width,
    height: full.height,
    addedAt: new Date().toISOString(),
  }
}

export async function deleteGalleryItemRemote(
  productId: string,
  itemId: string,
): Promise<void> {
  const res = await fetch(
    `/api/products/${productId}/gallery/${itemId}`,
    { method: "DELETE" },
  )
  if (!res.ok) {
    const j = await res.json().catch(() => ({ error: "unknown" }))
    throw new Error(j.error ?? `delete 失敗 (HTTP ${res.status})`)
  }
}

export async function reorderGalleryRemote(
  productId: string,
  orderedIds: string[],
): Promise<void> {
  const res = await fetch(
    `/api/products/${productId}/gallery/reorder`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    },
  )
  if (!res.ok) {
    const j = await res.json().catch(() => ({ error: "unknown" }))
    throw new Error(j.error ?? `reorder 失敗 (HTTP ${res.status})`)
  }
}

export interface ListedGalleryItem {
  id: string
  signedUrl: string
  storagePath: string
  bucket: string
  mimeType: string
  width?: number
  height?: number
}

export async function listGalleryRemote(
  productId: string,
): Promise<ListedGalleryItem[]> {
  const res = await fetch(`/api/products/${productId}/gallery/list`)
  if (!res.ok) {
    const j = await res.json().catch(() => ({ error: "unknown" }))
    throw new Error(j.error ?? `list 失敗 (HTTP ${res.status})`)
  }
  const json = (await res.json()) as {
    items: Array<{
      id: string
      signedUrl: string
      storagePath: string
      bucket: string
      mimeType: string
      width?: number
      height?: number
    }>
  }
  return json.items ?? []
}

function base64ToBlob(base64: string, mime: string): Blob {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

/**
 * dataUrl（レガシー画像）を Blob に変換して Supabase にアップロードし、
 * 新しい GalleryImage ref（storagePath 付き）を返す。
 * ensureImages 内で使用。
 */
export async function migrateDataUrlToStorage(
  productId: string,
  legacy: GalleryImage,
): Promise<GalleryImage | null> {
  if (!legacy.dataUrl) return null
  const match = legacy.dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  const mime = match[1]
  const base64 = match[2]
  const blob = base64ToBlob(base64, mime)
  const file = new File([blob], `legacy.${extFromMime(mime)}`, { type: mime })
  // そのままアップロード（レガシーは 600px 等で既に縮小済なので再 resize はしない）
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`/api/products/${productId}/gallery/upload`, {
    method: "POST",
    body: form,
  })
  const json = (await res.json()) as
    | { item: { id: string; storagePath: string; bucket: string } }
    | { error: string }
  if (!res.ok || "error" in json) return null

  // サムネは既存 dataUrl を流用（既に低解像度なので 300px 換算ぐらいに近い）
  return {
    id: json.item.id,
    thumbDataUrl: legacy.dataUrl,
    storagePath: json.item.storagePath,
    bucket: json.item.bucket,
    mimeType: legacy.mimeType,
    sizeBytes: legacy.sizeBytes,
    addedAt: legacy.addedAt,
  }
}
