import { Product, ProductImages } from "@/types"

function countFilledSlots(images: ProductImages | undefined, imagePreview: string | null): number {
  if (images) {
    return [images.composite, images.processing, images.wearing, images.sizeDetail]
      .filter((v) => v !== null)
      .length
  }
  return imagePreview ? 1 : 0
}

export function CreativeBadge({ product }: { product: Product }) {
  const count = countFilledSlots(product.images, product.imagePreview)
  const total = 4
  const isComplete = count === total

  if (isComplete) {
    return (
      <div className="text-[10px] text-green-600 font-bold">
        ✅ 素材完了
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < count ? "text-green-500" : "text-zinc-300"}>
            📷
          </span>
        ))}
      </span>
      <span className="text-zinc-500">
        素材 {count}/{total}
      </span>
    </div>
  )
}
