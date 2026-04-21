"use client"

import { useState } from "react"
import { Product } from "@/types"
import {
  SCHEDULE_DRAG_TYPE,
  SCHEDULE_SOURCE_MONTH,
  ScheduleCard,
  UNASSIGNED_VALUE,
} from "./ScheduleCard"

type Props = {
  /** null = 未定列 */
  month: string | null
  label: string
  sublabel?: string
  products: Product[]
  onMove: (productId: string, from: string | null, to: string | null) => void
  isCurrent?: boolean
}

export function ScheduleColumn({
  month,
  label,
  sublabel,
  products,
  onMove,
  isCurrent,
}: Props) {
  const [dragOver, setDragOver] = useState(false)

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes(SCHEDULE_DRAG_TYPE)) return
    e.preventDefault()
    setDragOver(true)
  }
  function onDragLeave() {
    setDragOver(false)
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData(SCHEDULE_DRAG_TYPE)
    const rawSource = e.dataTransfer.getData(SCHEDULE_SOURCE_MONTH)
    if (!id) return
    const from = rawSource && rawSource !== UNASSIGNED_VALUE ? rawSource : null
    onMove(id, from, month)
  }

  const headerBg = month
    ? isCurrent
      ? "bg-brand-yellow text-black"
      : "bg-zinc-100 text-zinc-700"
    : "bg-zinc-200 text-zinc-600"

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`shrink-0 w-[160px] rounded-lg border transition ${
        dragOver
          ? "border-brand-yellow bg-amber-50"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div
        className={`rounded-t-lg px-2 py-1.5 text-[11px] font-bold flex items-center justify-between ${headerBg}`}
      >
        <div>
          <div>{label}</div>
          {sublabel && (
            <div className="text-[9px] font-normal opacity-70">{sublabel}</div>
          )}
        </div>
        <span className="text-[10px] font-bold bg-white/70 rounded px-1.5 py-0.5 text-zinc-800">
          {products.length}
        </span>
      </div>
      <div className="p-1.5 space-y-1.5 min-h-[200px] max-h-[calc(100vh-250px)] overflow-y-auto">
        {products.map((p) => (
          <ScheduleCard
            key={`${p.id}-${month ?? "u"}`}
            product={p}
            sourceMonth={month}
          />
        ))}
      </div>
    </div>
  )
}
