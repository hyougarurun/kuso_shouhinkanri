"use client"

import { useEffect, useState } from "react"
import { Product } from "@/types"
import { storage } from "@/lib/storage"
import { ensureImages } from "@/lib/migrateProduct"
import { ScheduleBoard } from "@/components/schedule/ScheduleBoard"

export default function SchedulePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(storage.getProducts().map(ensureImages))
    setHydrated(true)
  }, [])

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
        <ScheduleBoard products={products} onUpdateProducts={setProducts} />
      )}
    </div>
  )
}
