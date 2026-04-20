import JSZip from "jszip"
import { Product } from "@/types"
import { ensureImages } from "@/lib/migrateProduct"

export function buildProductInfoText(product: Product): string {
  return [
    `商品名: ${product.name}`,
    `商品番号: ${product.productNumber}`,
    `シリーズ: ${product.series}`,
    `カラー: ${product.colors.join("・")}`,
    `サイズ: ${product.sizes.join("/")}`,
    `加工種別: ${product.processingType}`,
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

function addProductToZip(product: Product, zip: JSZip): void {
  const migrated = ensureImages(product)
  const folder = zip.folder(productFolderName(migrated))
  if (!folder) return

  const gallery = migrated.gallery ?? []
  gallery.forEach((img, i) => {
    const ext = extensionFromMime(img.mimeType)
    const prefix = String(i + 1).padStart(2, "0")
    const suffix = i === 0 ? "（サムネ）" : ""
    folder.file(`${prefix}${suffix}.${ext}`, dataUrlToUint8Array(img.dataUrl))
  })

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
  addProductToZip(product, zip)
  return zip.generateAsync({ type: "blob" })
}

export async function exportProductsZip(products: Product[]): Promise<Blob> {
  const zip = new JSZip()
  for (const product of products) {
    addProductToZip(product, zip)
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
