import JSZip from "jszip"
import { Product } from "@/types"
import { ensureImages } from "@/lib/migrateProduct"

const SLOT_LABELS: { key: "composite" | "processing" | "wearing" | "sizeDetail"; filename: string }[] = [
  { key: "composite", filename: "01_合成画像.png" },
  { key: "processing", filename: "02_加工箇所.png" },
  { key: "wearing", filename: "03_着画.png" },
  { key: "sizeDetail", filename: "04_サイズ詳細.png" },
]

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
  return `${product.productNumber}_${product.name}`
}

export async function exportProductZip(product: Product): Promise<Blob> {
  const zip = new JSZip()
  const migrated = ensureImages(product)
  const folder = zip.folder(productFolderName(migrated))!

  const images = migrated.images!
  for (const slot of SLOT_LABELS) {
    const dataUrl = images[slot.key]
    if (dataUrl) {
      folder.file(slot.filename, dataUrlToUint8Array(dataUrl))
    }
  }

  if (migrated.captionText) {
    folder.file("キャプション.txt", migrated.captionText)
  }

  folder.file("商品情報.txt", buildProductInfoText(migrated))

  return zip.generateAsync({ type: "blob" })
}

export async function exportProductsZip(products: Product[]): Promise<Blob> {
  const zip = new JSZip()

  for (const product of products) {
    const migrated = ensureImages(product)
    const folder = zip.folder(productFolderName(migrated))!

    const images = migrated.images!
    for (const slot of SLOT_LABELS) {
      const dataUrl = images[slot.key]
      if (dataUrl) {
        folder.file(slot.filename, dataUrlToUint8Array(dataUrl))
      }
    }

    if (migrated.captionText) {
      folder.file("キャプション.txt", migrated.captionText)
    }

    folder.file("商品情報.txt", buildProductInfoText(migrated))
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
