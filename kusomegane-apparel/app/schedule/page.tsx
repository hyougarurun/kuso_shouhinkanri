"use client"

import { useEffect, useRef, useState } from "react"
import { Product } from "@/types"
import { storage, hydrateStorage } from "@/lib/storage"
import { ensureImages } from "@/lib/migrateProduct"
import { generateMonthLabels } from "@/lib/schedule"
import { ScheduleBoard } from "@/components/schedule/ScheduleBoard"
import { MonthShowcase } from "@/components/schedule/MonthShowcase"

export default function SchedulePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [showcaseMonth, setShowcaseMonth] = useState<string>("")
  const showcaseRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ;(async () => {
      await hydrateStorage()
      setProducts(storage.getProducts().map(ensureImages))
      const firstMonth = generateMonthLabels()[0]?.value ?? ""
      setShowcaseMonth(firstMonth)
      setHydrated(true)
    })()
  }, [])

  function handleSelectShowcase(next: string) {
    setShowcaseMonth(next)
    // モバイル/狭い画面でも下部が見えるよう自動スクロール
    requestAnimationFrame(() => {
      showcaseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const scheduledCount = products.filter(
    (p) => p.plannedMonths && p.plannedMonths.length > 0,
  ).length
  const unassignedCount = products.length - scheduledCount

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-lg font-bold">販売スケジュール</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          商品カードを月列にドラッグ&ドロップして販売月の目安を割り当てます。
          列間でドラッグすると月を入れ替え（1 商品 1 月）。
        </p>
      </header>

      {hydrated && (
        <div className="text-[11px] text-zinc-500">
          登録商品: {products.length} 件 · 割当済み: {scheduledCount} 件 ·
          未定: {unassignedCount} 件
        </div>
      )}

      {!hydrated ? (
        <div className="text-center text-sm text-zinc-500 py-10">
          読み込み中...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-sm text-zinc-500 py-10">
          商品がまだありません。ホームから新規登録してください。
        </div>
      ) : (
        <>
          <ScheduleBoard
            products={products}
            onUpdateProducts={setProducts}
            selectedShowcaseMonth={showcaseMonth}
            onSelectShowcaseMonth={handleSelectShowcase}
          />
          <div ref={showcaseRef}>
            <MonthShowcase
              products={products}
              value={showcaseMonth}
              onChange={setShowcaseMonth}
            />
          </div>
        </>
      )}
    </div>
  )
}
