import JSZip from "jszip"
import { Product } from "@/types"
import { ensureImages } from "@/lib/migrateProduct"
import { listGalleryRemote } from "@/lib/galleryClient"

export function buildProductInfoText(product: Product): string {
  return [
    `商品名: ${product.name}`,
    `商品番号: ${product.productNumber}`,
    `シリーズ: ${product.series}`,
    `カラー: ${product.colors.join("・")}`,
    `サイズ: ${product.sizes.join("/")}`,
    `加工指示: ${product.processingInstruction}`,
    `ボディ型番: ${product.bodyModelNumber}`,
    `素材: ${product.material}`,
    `受注生産: ${product.isMadeToOrder ? "あり" : "なし"}`,
    `送料無料: ${product.freeShipping ? "あり" : "なし"}`,
    `備考: ${product.notes}`,
  ].join("\n")
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? ""
  if (!base64) return new Uint8Array(0)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function productFolderName(product: Product): string {
  // ファイルシステム NG 記号を除去
  const safe = product.name.replace(/[\\/:*?"<>|]/g, "_")
  return `${product.productNumber}_${safe}`
}

function extensionFromMime(mime: string): string {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg"
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  if (mime.includes("gif")) return "gif"
  return "bin"
}

async function fetchBinary(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function addProductToZip(product: Product, zip: JSZip): Promise<void> {
  const migrated = ensureImages(product)
  const folder = zip.folder(productFolderName(migrated))
  if (!folder) return

  const gallery = migrated.gallery ?? []

  // Supabase Storage 上のアイテムは signed URL を取得してバイナリ DL
  const hasStorage = gallery.some((g) => g.storagePath)
  const signedUrlById: Record<string, string> = {}
  if (hasStorage) {
    try {
      const items = await listGalleryRemote(migrated.id)
      for (const it of items) signedUrlById[it.id] = it.signedUrl
    } catch {
      // フォールバックで thumbDataUrl を使う（低解像度だが ZIP 破綻は避ける）
    }
  }

  for (let i = 0; i < gallery.length; i++) {
    const img = gallery[i]
    const ext = extensionFromMime(img.mimeType)
    const prefix = String(i + 1).padStart(2, "0")
    const suffix = i === 0 ? "（サムネ）" : ""
    const filename = `${prefix}${suffix}.${ext}`

    // 1) signed URL（フル解像度）
    const signed = signedUrlById[img.id]
    if (signed) {
      const bin = await fetchBinary(signed)
      if (bin) {
        folder.file(filename, bin)
        continue
      }
    }
    // 2) レガシー dataUrl
    if (img.dataUrl) {
      folder.file(filename, dataUrlToUint8Array(img.dataUrl))
      continue
    }
    // 3) サムネのみ（最悪の場合）
    if (img.thumbDataUrl) {
      folder.file(filename, dataUrlToUint8Array(img.thumbDataUrl))
    }
  }

  // gallery が空だが imagePreview のみある場合のフォールバック
  if (gallery.length === 0 && migrated.imagePreview) {
    folder.file(
      "01（サムネ）.jpg",
      dataUrlToUint8Array(migrated.imagePreview),
    )
  }

  if (migrated.captionText) {
    folder.file("キャプション.txt", migrated.captionText)
  }

  folder.file("商品情報.txt", buildProductInfoText(migrated))
}

export async function exportProductZip(product: Product): Promise<Blob> {
  const zip = new JSZip()
  await addProductToZip(product, zip)
  return zip.generateAsync({ type: "blob" })
}

export async function exportProductsZip(products: Product[]): Promise<Blob> {
  const zip = new JSZip()
  // 商品ごとに直列処理（並列だと fetch スパイクで失敗しやすい）
  for (const product of products) {
    await addProductToZip(product, zip)
  }
  return zip.generateAsync({ type: "blob" })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
