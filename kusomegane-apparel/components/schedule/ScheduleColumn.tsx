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
  /** 下部ショーケースで現在選択されている月（同期表示用） */
  selected?: boolean
  /** ヘッダクリック時のコールバック（下部ショーケースを連動させる） */
  onSelect?: () => void
}

export function ScheduleColumn({
  month,
  label,
  sublabel,
  products,
  onMove,
  isCurrent,
  selected,
  onSelect,
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

  const headerBg = selected
    ? "bg-indigo-500 text-white"
    : month
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
          : selected
            ? "border-indigo-400 bg-indigo-50"
            : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left rounded-t-lg px-2 py-1.5 text-[11px] font-bold flex items-center justify-between transition cursor-pointer ${headerBg} ${onSelect ? "hover:brightness-95" : ""}`}
        title={onSelect ? "クリックで下部に表示" : undefined}
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
      </button>
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
