import Link from "next/link"
import { Product } from "@/types"
import { StatusBadge } from "./StatusBadge"
import { ProgressBar } from "./ProgressBar"
import { SampleCountdownLabel } from "./SampleCountdown"
import { getProductStatus, getProgress } from "@/lib/productStatus"
import { getNextActionLabel } from "@/lib/nextAction"
import { computeSampleCountdown } from "@/lib/sampleCountdown"
import { getColorStyle } from "@/lib/colorPalette"
import { CreativeBadge } from "./CreativeBadge"

export function ProductCard({ product }: { product: Product }) {
  const status = getProductStatus(product)
  const { done, total } = getProgress(product)
  const nextLabel = getNextActionLabel(product)
  const countdown = computeSampleCountdown(product.sampleArrivalDate)
  const colorStyle = getColorStyle(product.colors[0])
  const step5Done = product.steps.find((s) => s.stepNumber === 5)?.status === "done"

  return (
    <Link
      href={`/products/${product.id}`}
      className="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* 画像エリア */}
      <div
        className="relative aspect-square"
        style={{ backgroundColor: colorStyle.bg, color: colorStyle.fg }}
      >
        {product.imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imagePreview}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm opacity-70">
            No Image
          </div>
        )}

        {/* 上部オーバーレイ */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#111111" }}
          >
            No.{product.productNumber}
          </span>
          <StatusBadge status={status} />
        </div>

        {/* 下部進捗バー */}
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

      {/* 下部情報 */}
      <div className="p-2.5 space-y-0.5">
        <div className="text-[13px] font-bold text-zinc-900 leading-tight line-clamp-1">
          {product.name}
        </div>
        <div className="text-[11px] text-zinc-500 line-clamp-1">
          {product.series} · {product.colors.join("・")}
        </div>
        <div className="text-[11px] text-zinc-700 pt-0.5 line-clamp-1">
          次: {nextLabel}
        </div>
        <CreativeBadge product={product} />
        {!step5Done && countdown && (
          <div>
            <SampleCountdownLabel data={countdown} />
          </div>
        )}
      </div>
    </Link>
  )
}
