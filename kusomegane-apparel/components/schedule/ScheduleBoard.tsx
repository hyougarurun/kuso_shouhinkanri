"use client"

import { Product } from "@/types"
import { storage } from "@/lib/storage"
import {
  generateMonthLabels,
  moveMonth,
  productsForMonth,
  unassignedProducts,
} from "@/lib/schedule"
import { ScheduleColumn } from "./ScheduleColumn"

type Props = {
  products: Product[]
  onUpdateProducts: (next: Product[]) => void
}

export function ScheduleBoard({ products, onUpdateProducts }: Props) {
  const monthLabels = generateMonthLabels()
  const currentMonth = monthLabels[0]?.value

  function handleMove(productId: string, from: string | null, to: string | null) {
    if (from === to) return
    const target = products.find((p) => p.id === productId)
    if (!target) return
    const next = moveMonth(target, from, to)
    // 保存 + 親の state 反映
    storage.upsertProduct(next)
    onUpdateProducts(
      products.map((p) => (p.id === productId ? next : p)),
    )
  }

  const unassigned = unassignedProducts(products)

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 pt-1">
      <ScheduleColumn
        month={null}
        label="未定"
        sublabel="目安なし"
        products={unassigned}
        onMove={handleMove}
      />
      {monthLabels.map((m) => {
        const [year, mm] = m.value.split("-")
        const isCurrent = m.value === currentMonth
        return (
          <ScheduleColumn
            key={m.value}
            month={m.value}
            label={`${parseInt(mm, 10)}月`}
            sublabel={year}
            products={productsForMonth(products, m.value)}
            onMove={handleMove}
            isCurrent={isCurrent}
          />
        )
      })}
    </div>
  )
}
