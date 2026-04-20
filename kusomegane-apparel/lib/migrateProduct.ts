import { GalleryImage, Product, ProductImages } from "@/types"

/**
 * 旧 images (4 スロット) を gallery 1 本にマイグレートする。
 * - gallery が空 & images があれば → images の非 null スロットを gallery にコピー
 * - いずれも images フィールドは undefined に（LocalStorage 容量対策）
 * - imagePreview は gallery[0] を優先表示するため、可能なら先頭画像で上書き
 */
export function ensureImages(product: Product): Product {
  const hasGallery = (product.gallery?.length ?? 0) > 0
  let gallery = product.gallery ?? []

  if (!hasGallery && product.images) {
    gallery = migrateImagesToGallery(product.images, product.id)
  }

  const firstDataUrl = gallery[0]?.dataUrl ?? product.imagePreview ?? null

  return {
    ...product,
    images: undefined, // 旧スロットは廃止（容量解放）
    gallery,
    imagePreview: firstDataUrl,
  }
}

function migrateImagesToGallery(
  images: ProductImages,
  productId: string,
): GalleryImage[] {
  const result: GalleryImage[] = []
  const keys: (keyof ProductImages)[] = [
    "composite",
    "processing",
    "wearing",
    "sizeDetail",
  ]
  const now = new Date().toISOString()
  for (const key of keys) {
    const src = images[key]
    if (src) {
      result.push({
        id: `migrated-${key}-${productId}`,
        dataUrl: src,
        mimeType: "image/jpeg",
        addedAt: now,
      })
    }
  }
  return result
}
