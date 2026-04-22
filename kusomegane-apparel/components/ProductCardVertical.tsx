"use client"

import { memo } from "react"
import { useRouter } from "next/navigation"
import { Product } from "@/types"
import { StatusBadge } from "./StatusBadge"
import { ProgressBar } from "./ProgressBar"
import { SampleCountdownLabel } from "./SampleCountdown"
import { getProductStatus, getProgress } from "@/lib/productStatus"
import { getNextActionLabel } from "@/lib/nextAction"
import { computeSampleCountdown } from "@/lib/sampleCountdown"
import { getColorStyle } from "@/lib/colorPalette"

/**
 * 縦型商品カード（旧 UI の縦長方形タイプ）。
 * - aspect-square の画像 + 下に情報
 * - 横並び・横スクロール前提のスケジュールショーケース等で使用
 * - ホーム画面の横長カードとは使い分ける
 */
function ProductCardVerticalImpl({
  product,
  widthClass = "w-48",
}: {
  product: Product
  widthClass?: string
}) {
  const router = useRouter()
  const status = getProductStatus(product)
  const { done, total } = getProgress(product)
  const nextLabel = getNextActionLabel(product)
  const countdown = computeSampleCountdown(product.sampleArrivalDate)
  const colorStyle = getColorStyle(product.colors[0])
  const step5Done =
    product.steps.find((s) => s.stepNumber === 5)?.status === "done"

  const gallery = product.gallery ?? []
  const mainImage =
    gallery[0]?.thumbDataUrl ?? gallery[0]?.dataUrl ?? product.imagePreview

  function onClick() {
    router.push(`/products/${product.id}`)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 text-left bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md border border-zinc-200 hover:border-zinc-300 transition " +
        widthClass
      }
    >
      <div
        className="relative aspect-square"
        style={{ backgroundColor: colorStyle.bg, color: colorStyle.fg }}
      >
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm opacity-70">
            No Image
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#111" }}
          >
            No.{product.productNumber}
          </span>
          <StatusBadge status={status} />
        </div>

        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          <ProgressBar done={done} total={total} />
          <div
            className="mt-1 text-[10px] font-bold"
            style={{
              color: colorStyle.fg,
              textShadow: "0 0 2px rgba(0,0,0,0.3)",
            }}
          >
            {done}/{total}
          </div>
        </div>
      </div>

      <div className="p-2.5 space-y-0.5">
        <div className="text-[13px] font-bold text-zinc-900 leading-tight line-clamp-1">
          {product.name || "（無題）"}
        </div>
        <div className="text-[11px] text-zinc-500 line-clamp-1">
          {[product.series, product.colors.join("・")].filter(Boolean).join(" · ")}
        </div>
        <div className="text-[11px] text-zinc-700 pt-0.5 line-clamp-1">
          次: {nextLabel}
        </div>
        {!step5Done && countdown && (
          <div className="pt-1">
            <SampleCountdownLabel data={countdown} />
          </div>
        )}
      </div>
    </button>
  )
}

export const ProductCardVertical = memo(
  ProductCardVerticalImpl,
  (prev, next) =>
    prev.product.id === next.product.id &&
    prev.product.updatedAt === next.product.updatedAt &&
    prev.widthClass === next.widthClass,
)
