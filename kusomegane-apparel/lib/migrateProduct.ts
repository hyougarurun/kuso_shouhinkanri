import { Product } from "@/types"

export function ensureImages(product: Product): Product {
  if (product.images) return product
  return {
    ...product,
    images: {
      composite: product.imagePreview,
      processing: null,
      wearing: null,
      sizeDetail: null,
    },
  }
}
