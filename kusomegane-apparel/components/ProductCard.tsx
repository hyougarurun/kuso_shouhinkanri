"use client"

import { memo } from "react"
import { useRouter } from "next/navigation"
import { Product } from "@/types"
import { StatusBadge } from "./StatusBadge"
import { SampleCountdownLabel } from "./SampleCountdown"
import { getProductStatus, getProgress } from "@/lib/productStatus"
import { getNextActionLabel } from "@/lib/nextAction"
import { computeSampleCountdown } from "@/lib/sampleCountdown"

export const PRODUCT_DRAG_TYPE = "application/x-kusomegane-product-id"

interface ProductCardProps {
  product: Product
  onClearEstimation?: (productId: string) => void
}

function ProductCardImpl({ product, onClearEstimation }: ProductCardProps) {
  const router = useRouter()
  const status = getProductStatus(product)
  const { done, total } = getProgress(product)
  const nextLabel = getNextActionLabel(product)
  const countdown = computeSampleCountdown(product.sampleArrivalDate)
  const step5Done = product.steps.find((s) => s.stepNumber === 5)?.status === "done"
  const hasDrive = (product.driveFiles?.length ?? 0) > 0
  const hasSheet = !!product.sheetRegisteredAt

  const gallery = product.gallery ?? []
  // 300px サムネ（Supabase 移行後）を優先、旧 dataUrl はレガシーフォールバック
  const mainImage =
    gallery[0]?.thumbDataUrl ?? gallery[0]?.dataUrl ?? product.imagePreview
  const subThumbs = gallery.slice(1, 6) // 2〜6 枚目を横並び表示

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
        "relative flex gap-4 bg-white rounded-lg border p-4 shadow-sm hover:shadow-md hover:border-zinc-300 transition cursor-pointer active:cursor-grabbing select-none overflow-hidden " +
        (status === "done"
          ? "border-green-400 ring-1 ring-green-400"
          : "border-zinc-200")
      }
    >
      {hasDrive && (
        <div
          aria-label="Drive 格納済み"
          title="Drive 格納済み"
          className="absolute left-0 top-0 bottom-0 w-1 bg-brand-yellow"
        />
      )}

      {/* 上辺: 進捗バー（カード幅全体） */}
      <div
        className="absolute left-0 top-0 right-0 h-1 bg-zinc-100"
        aria-label={`進捗 ${done}/${total}`}
      >
        <div
          className={`h-full transition-all ${
            status === "done" ? "bg-green-500" : "bg-brand-yellow"
          }`}
          style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
        />
      </div>

      {/* 左: メインサムネ 176px */}
      <div className="relative w-44 h-44 shrink-0 rounded-md overflow-hidden bg-zinc-100">
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage}
            alt={product.name}
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
            No Img
          </div>
        )}
        <span className="absolute top-0 left-0 text-xs font-bold bg-white/90 text-black px-1.5 py-0.5 rounded-br-md">
          No.{product.productNumber}
        </span>
      </div>

      {/* 中央: 情報 + 下に追加サムネ */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-lg font-bold text-zinc-900 truncate">
              {product.name || "（無題）"}
            </span>
            {hasSheet && (
              <span
                title="シート登録済み"
                className="shrink-0 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5"
              >
                シート済
              </span>
            )}
            {hasDrive && (
              <span
                title={`Drive ${product.driveFiles?.length ?? 0} ファイル`}
                className="shrink-0 text-[10px] font-bold text-lime-800 bg-lime-50 border border-lime-300 rounded px-1.5 py-0.5"
              >
                Drive {product.driveFiles?.length}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 truncate mt-1">
            {[product.series, product.colors.join("・")].filter(Boolean).join(" · ")}
          </div>
          <div className="text-xs text-zinc-700 truncate mt-0.5">
            次: {nextLabel}
          </div>
        </div>

        {/* 追加画像サムネ 2〜6 枚目（1.5倍化: 40 → 60px） */}
        {subThumbs.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {subThumbs.map((img) => {
              const src = img.thumbDataUrl ?? img.dataUrl ?? ""
              if (!src) return null
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={src}
                  alt="thumb"
                  draggable={false}
                  className="w-[60px] h-[60px] rounded object-cover border border-zinc-200 pointer-events-none"
                />
              )
            })}
            {gallery.length > 6 && (
              <div className="w-[60px] h-[60px] rounded border border-zinc-200 bg-zinc-100 flex items-center justify-center text-xs text-zinc-500 font-bold">
                +{gallery.length - 6}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 中右: 推定加工費 */}
      {product.estimation && (
        <div className="hidden md:flex relative shrink-0 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 flex-col justify-center items-center min-w-[140px]">
          {onClearEstimation && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (
                  confirm(
                    `「${product.name}」の推定加工費を取り消します。よろしいですか？`
                  )
                ) {
                  onClearEstimation(product.id)
                }
              }}
              title="推定加工費を取り消す"
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[10px] leading-none text-amber-700/70 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
            >
              ×
            </button>
          )}
          <div className="text-[11px] text-amber-700 leading-none">
            推定加工費
          </div>
          <div className="text-sm font-bold text-amber-900 leading-tight mt-1 text-center">
            {product.estimation.totalMin !== undefined &&
            product.estimation.totalMax !== undefined
              ? `¥${product.estimation.totalMin.toLocaleString()}〜${product.estimation.totalMax.toLocaleString()}`
              : `¥${product.estimation.subtotalProcessing.toLocaleString()}`}
          </div>
        </div>
      )}

      {/* 右: ステータス + 進捗カウント + カウントダウン */}
      <div className="shrink-0 flex flex-col justify-between items-end py-0.5 min-w-[150px]">
        <StatusBadge status={status} />
        <div className="text-xs font-bold text-zinc-700">
          {done}/{total}
        </div>
        {!step5Done && countdown ? (
          <div className="origin-right">
            <SampleCountdownLabel data={countdown} />
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}

// updatedAt が変わらなければ再描画しない（リスト全体の再レンダ抑制）
export const ProductCard = memo(ProductCardImpl, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.product.updatedAt === next.product.updatedAt &&
    prev.onClearEstimation === next.onClearEstimation
  )
})
