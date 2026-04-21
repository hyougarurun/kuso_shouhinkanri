"use client"

import { useRouter } from "next/navigation"
import { Product } from "@/types"
import { StatusBadge } from "./StatusBadge"
import { ProgressBar } from "./ProgressBar"
import { SampleCountdownLabel } from "./SampleCountdown"
import { getProductStatus, getProgress } from "@/lib/productStatus"
import { getNextActionLabel } from "@/lib/nextAction"
import { computeSampleCountdown } from "@/lib/sampleCountdown"

export const PRODUCT_DRAG_TYPE = "application/x-kusomegane-product-id"

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const status = getProductStatus(product)
  const { done, total } = getProgress(product)
  const nextLabel = getNextActionLabel(product)
  const countdown = computeSampleCountdown(product.sampleArrivalDate)
  const step5Done = product.steps.find((s) => s.stepNumber === 5)?.status === "done"
  const hasDrive = (product.driveFiles?.length ?? 0) > 0
  const hasSheet = !!product.sheetRegisteredAt
  const thumb = product.gallery?.[0]?.dataUrl ?? product.imagePreview

  function onDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData(PRODUCT_DRAG_TYPE, product.id)
    e.dataTransfer.setData("text/plain", `${product.productNumber} ${product.name}`)
    e.dataTransfer.effectAllowed = "copy"
  }

  function onClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return
    router.push(`/products/${product.id}`)
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={
        "flex items-center gap-3 bg-white rounded-lg border p-2.5 shadow-sm hover:shadow-md hover:border-zinc-300 transition cursor-pointer active:cursor-grabbing select-none " +
        (hasDrive ? "border-lime-300 ring-1 ring-lime-300" : "border-zinc-200")
      }
    >
      {/* サムネイル + 商品番号 */}
      <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-zinc-100">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={product.name}
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400">
            No Img
          </div>
        )}
        <span className="absolute bottom-0 left-0 right-0 text-[9px] font-bold text-white bg-black/60 px-1 py-0.5 text-center leading-none">
          No.{product.productNumber}
        </span>
      </div>

      {/* 中央: 商品名 / シリーズ・色 / 次アクション */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[13px] font-bold text-zinc-900 truncate">
            {product.name || "（無題）"}
          </span>
          {hasSheet && (
            <span
              title="シート登録済み"
              className="shrink-0 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1 py-0.5"
            >
              シート済
            </span>
          )}
          {hasDrive && (
            <span
              title={`Drive ${product.driveFiles?.length ?? 0} ファイル`}
              className="shrink-0 text-[9px] font-bold text-lime-800 bg-lime-50 border border-lime-300 rounded px-1 py-0.5"
            >
              Drive {product.driveFiles?.length}
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500 truncate">
          {[product.series, product.colors.join("・")].filter(Boolean).join(" · ")}
        </div>
        <div className="text-[11px] text-zinc-700 truncate">
          次: {nextLabel}
        </div>
      </div>

      {/* 推定加工費（ある時のみ） */}
      {product.estimation && (
        <div className="hidden md:block shrink-0 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-center min-w-[96px]">
          <div className="text-[9px] text-amber-700 leading-none">
            推定加工費
          </div>
          <div className="text-[11px] font-bold text-amber-900 leading-tight">
            {product.estimation.totalMin !== undefined &&
            product.estimation.totalMax !== undefined
              ? `¥${product.estimation.totalMin.toLocaleString()}〜${product.estimation.totalMax.toLocaleString()}`
              : `¥${product.estimation.subtotalProcessing.toLocaleString()}`}
          </div>
        </div>
      )}

      {/* ステータス + 進捗 + カウントダウン */}
      <div className="shrink-0 flex flex-col items-end gap-1 min-w-[110px]">
        <StatusBadge status={status} />
        <div className="flex items-center gap-1.5 w-full">
          <div className="flex-1 min-w-[60px]">
            <ProgressBar done={done} total={total} />
          </div>
          <span className="text-[10px] font-bold text-zinc-700 shrink-0">
            {done}/{total}
          </span>
        </div>
        {!step5Done && countdown && (
          <div className="scale-90 origin-right">
            <SampleCountdownLabel data={countdown} />
          </div>
        )}
      </div>
    </div>
  )
}
