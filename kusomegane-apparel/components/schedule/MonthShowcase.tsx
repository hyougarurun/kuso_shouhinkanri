"use client"

import { useMemo, useState } from "react"
import { Product } from "@/types"
import {
  generateMonthLabels,
  productsForMonth,
  unassignedProducts,
} from "@/lib/schedule"
import { ProductCardVertical } from "@/components/ProductCardVertical"

export const SCHEDULE_UNASSIGNED = "__unassigned__"
const UNASSIGNED = SCHEDULE_UNASSIGNED

type Props = {
  products: Product[]
  value?: string
  onChange?: (next: string) => void
}

/**
 * 販売スケジュール下部の月別ショーケース。
 * 月を 1 つ選ぶと、その月に割り当てられた商品を縦型カードで横並び表示する。
 * 横スクロールで全件閲覧可能。
 *
 * 親から value/onChange を渡すと controlled 動作（ScheduleBoard の月タップと連動）。
 * 省略時は内部 state でフォールバック。
 */
export function MonthShowcase({ products, value, onChange }: Props) {
  const months = useMemo(() => generateMonthLabels(), [])
  const [internal, setInternal] = useState<string>(months[0]?.value ?? "")
  const selectedMonth = value ?? internal
  const setSelectedMonth = onChange ?? setInternal

  const displayed = useMemo(() => {
    if (!selectedMonth) return []
    if (selectedMonth === UNASSIGNED) return unassignedProducts(products)
    return productsForMonth(products, selectedMonth)
  }, [products, selectedMonth])

  const selectedLabel = useMemo(() => {
    if (selectedMonth === UNASSIGNED) return "未定"
    return months.find((m) => m.value === selectedMonth)?.label ?? selectedMonth
  }, [selectedMonth, months])

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-bold">選択月の商品</h2>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-xs border border-zinc-300 rounded-md px-2 py-1 bg-white hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          aria-label="表示月"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value={UNASSIGNED}>未定</option>
        </select>
        <span className="text-[11px] text-zinc-500">
          {selectedLabel} · {displayed.length} 件
        </span>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center text-xs text-zinc-500 py-6">
          この月に割り当てられた商品はありません
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {displayed.map((p) => (
            <ProductCardVertical key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
