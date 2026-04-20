"use client"

import { useRouter } from "next/navigation"
import { Product } from "@/types"
import { StatusBadge } from "./StatusBadge"
import { ProgressBar } from "./ProgressBar"
import { SampleCountdownLabel } from "./SampleCountdown"
import { getProductStatus, getProgress } from "@/lib/productStatus"
import { getNextActionLabel } from "@/lib/nextAction"
import { computeSampleCountdown } from "@/lib/sampleCountdown"
import { getColorStyle } from "@/lib/colorPalette"

export const PRODUCT_DRAG_TYPE = "application/x-kusomegane-product-id"

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const status = getProductStatus(product)
  const { done, total } = getProgress(product)
  const nextLabel = getNextActionLabel(product)
  const countdown = computeSampleCountdown(product.sampleArrivalDate)
  const colorStyle = getColorStyle(product.colors[0])
  const step5Done = product.steps.find((s) => s.stepNumber === 5)?.status === "done"
  const hasDrive = (product.driveFiles?.length ?? 0) > 0
  const hasSheet = !!product.sheetRegisteredAt

  function onDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData(PRODUCT_DRAG_TYPE, product.id)
    e.dataTransfer.setData("text/plain", `${product.productNumber} ${product.name}`)
    e.dataTransfer.effectAllowed = "copy"
  }

  function onClick(e: React.MouseEvent) {
    // ドラッグ中のクリック発火を避ける（簡易的に button 以外はリンク扱い）
    if ((e.target as HTMLElement).closest("button")) return
    router.push(`/products/${product.id}`)
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={
        "block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer active:cursor-grabbing select-none " +
        (hasDrive
          ? "ring-2 ring-lime-400 ring-offset-1"
          : "")
      }
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
            draggable={false}
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
      <div className="p-2.5 space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 text-[13px] font-bold text-zinc-900 leading-tight line-clamp-1">
            {product.name}
          </div>
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
              title={`Drive ${product.driveFiles?.length ?? 0} ファイル格納済み`}
              className="shrink-0 text-[9px] font-bold text-lime-800 bg-lime-50 border border-lime-300 rounded px-1 py-0.5"
            >
              Drive {product.driveFiles?.length}
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500 line-clamp-1">
          {product.series} · {product.colors.join("・")}
        </div>
        <div className="text-[11px] text-zinc-700 line-clamp-1">
          次: {nextLabel}
        </div>

        {product.images && (() => {
          const slots = [
            { key: "processing" as const, label: "加工" },
            { key: "wearing" as const, label: "着画" },
            { key: "sizeDetail" as const, label: "サイズ" },
          ]
          const thumbs = slots.filter(({ key }) => product.images?.[key])
          if (thumbs.length === 0) return null
          return (
            <div className="flex gap-1.5 pt-1">
              {thumbs.map(({ key, label }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={key}
                  src={product.images![key]!}
                  alt={label}
                  draggable={false}
                  className="w-14 h-14 rounded object-cover border border-zinc-200"
                />
              ))}
            </div>
          )
        })()}

        {product.estimation && (
          <div className="mt-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5">
            <div className="text-[10px] text-amber-700 leading-none mb-0.5">
              推定加工費
            </div>
            {product.estimation.totalMin !== undefined &&
            product.estimation.totalMax !== undefined ? (
              <div className="text-[12px] font-bold text-amber-900">
                ¥{product.estimation.totalMin.toLocaleString()} 〜 ¥
                {product.estimation.totalMax.toLocaleString()}
              </div>
            ) : (
              <div className="text-[12px] font-bold text-amber-900">
                加工費 ¥{product.estimation.subtotalProcessing.toLocaleString()}
              </div>
            )}
            <div className="text-[9px] text-zinc-500 leading-none mt-0.5">
              {product.estimation.location} / {product.estimation.method}
            </div>
          </div>
        )}

        {!step5Done && countdown && (
          <div>
            <SampleCountdownLabel data={countdown} />
          </div>
        )}
      </div>
    </div>
  )
}
