"use client"

import { useRouter } from "next/navigation"
import { Product } from "@/types"

export const SCHEDULE_DRAG_TYPE = "application/x-kusomegane-product-id"
export const SCHEDULE_SOURCE_MONTH = "application/x-kusomegane-source-month"
export const UNASSIGNED_VALUE = "__UNASSIGNED__"

type Props = {
  product: Product
  sourceMonth: string | null
}

export function ScheduleCard({ product, sourceMonth }: Props) {
  const router = useRouter()

  function onDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData(SCHEDULE_DRAG_TYPE, product.id)
    e.dataTransfer.setData(SCHEDULE_SOURCE_MONTH, sourceMonth ?? UNASSIGNED_VALUE)
    e.dataTransfer.effectAllowed = "move"
  }

  function onClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return
    router.push(`/products/${product.id}`)
  }

  const thumb = product.gallery?.[0]?.dataUrl ?? product.imagePreview
  const colorText = product.colors.join("・")

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group bg-white rounded-md border border-zinc-200 p-2 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-zinc-300 transition select-none"
    >
      <div className="flex gap-2 items-start">
        <div className="w-12 h-12 rounded bg-zinc-100 overflow-hidden shrink-0">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={product.name}
              draggable={false}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-400">
              No Img
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-zinc-500 leading-tight">
            No.{product.productNumber}
          </div>
          <div className="text-[11px] font-bold text-zinc-900 leading-tight line-clamp-2">
            {product.name}
          </div>
          {colorText && (
            <div className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">
              {colorText}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
