"use client"

import { useCallback, useEffect, useState } from "react"
import { Product } from "@/types"
import { storage, hydrateStorage } from "@/lib/storage"
import { seedIfEmpty } from "@/lib/seed"
import {
  filterProducts,
  summarize,
  FilterValue,
} from "@/lib/productStatus"
import { ensureImages } from "@/lib/migrateProduct"
import { productsForMonth, unassignedProducts } from "@/lib/schedule"
import { exportProductsZip, downloadBlob } from "@/lib/exportZip"
import { ProductCard } from "@/components/ProductCard"
import { Summary } from "@/components/Summary"
import { FilterTabs } from "@/components/FilterTabs"
import { MonthFilter, MONTH_FILTER_UNASSIGNED } from "@/components/MonthFilter"
import { QuickEstimateCard } from "@/components/QuickEstimateCard"

const LS_LOCK = "kuso:home:filterLocked"
const LS_FILTER = "kuso:home:filter"
const LS_MONTH = "kuso:home:monthFilter"

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<FilterValue>("all")
  const [monthFilter, setMonthFilter] = useState<string | null>(null)
  const [filterLocked, setFilterLocked] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    ;(async () => {
      await hydrateStorage()
      seedIfEmpty()
      setProducts(storage.getProducts().map(ensureImages))
      setHydrated(true)
    })()
    const locked = localStorage.getItem(LS_LOCK) === "1"
    setFilterLocked(locked)
    if (locked) {
      const f = localStorage.getItem(LS_FILTER) as FilterValue | null
      const m = localStorage.getItem(LS_MONTH)
      if (f === "all" || f === "in_progress" || f === "done") setFilter(f)
      if (m) setMonthFilter(m)
    }
  }, [])

  // 固定 ON の間は値変更を永続化
  useEffect(() => {
    if (!hydrated || !filterLocked) return
    localStorage.setItem(LS_FILTER, filter)
  }, [filter, filterLocked, hydrated])

  useEffect(() => {
    if (!hydrated || !filterLocked) return
    if (monthFilter === null) localStorage.removeItem(LS_MONTH)
    else localStorage.setItem(LS_MONTH, monthFilter)
  }, [monthFilter, filterLocked, hydrated])

  function toggleFilterLock(next: boolean) {
    setFilterLocked(next)
    localStorage.setItem(LS_LOCK, next ? "1" : "0")
    if (next) {
      localStorage.setItem(LS_FILTER, filter)
      if (monthFilter) localStorage.setItem(LS_MONTH, monthFilter)
      else localStorage.removeItem(LS_MONTH)
    }
  }

  const summary = summarize(products)
  const byStatus = filterProducts(products, filter)
  const visible = !monthFilter
    ? byStatus
    : monthFilter === MONTH_FILTER_UNASSIGNED
      ? unassignedProducts(byStatus)
      : productsForMonth(byStatus, monthFilter)

  async function handleBulkDownload() {
    if (products.length === 0) return
    try {
      const blob = await exportProductsZip(products)
      const date = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `KUSOMEGANE_素材_${date}.zip`)
    } catch {
      // ZIP 生成失敗は無視
    }
  }

  function handleEstimateRegistered(updated: Product) {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    )
  }

  const handleClearEstimation = useCallback((productId: string) => {
    setProducts((prev) => {
      const target = prev.find((p) => p.id === productId)
      if (!target) return prev
      const next: Product = {
        ...target,
        estimation: undefined,
        updatedAt: new Date().toISOString(),
      }
      storage.upsertProduct(next)
      return prev.map((p) => (p.id === productId ? next : p))
    })
  }, [])

  return (
    <div className="grid grid-cols-3 gap-6 min-h-[calc(100vh-96px)]">
      {/* 左: 商品管理 (span 2) */}
      <section className="col-span-2 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">商品管理</h2>
          {hydrated && products.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDownload}
              className="rounded-md border border-zinc-300 bg-white text-xs text-zinc-700 font-semibold px-3 py-1.5 hover:bg-zinc-50 transition"
            >
              一括ダウンロード
            </button>
          )}
        </div>

        <Summary
          total={summary.total}
          inProgress={summary.inProgress}
          done={summary.done}
        />

        <div className="mt-4 mb-4 flex items-center gap-3 flex-wrap">
          <FilterTabs value={filter} onChange={setFilter} />
          <MonthFilter value={monthFilter} onChange={setMonthFilter} />
          <label
            className={
              "inline-flex items-center gap-1.5 text-xs cursor-pointer select-none px-2 py-1 rounded border transition " +
              (filterLocked
                ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                : "bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50")
            }
            title="オンにすると、画面遷移後もフィルタが保持されます"
          >
            <input
              type="checkbox"
              checked={filterLocked}
              onChange={(e) => toggleFilterLock(e.target.checked)}
              className="accent-amber-500"
            />
            {filterLocked ? "🔒 フィルタ固定中" : "フィルタを固定"}
          </label>
        </div>

        {!hydrated ? (
          <div className="text-center text-sm text-zinc-500 py-10">
            読み込み中...
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 py-10">
            該当する商品がありません
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onClearEstimation={handleClearEstimation}
              />
            ))}
          </div>
        )}
      </section>

      {/* 右: 加工費推定（スクロール追従） */}
      <aside className="col-span-1">
        <div className="sticky top-4">
          <QuickEstimateCard onRegistered={handleEstimateRegistered} />
        </div>
      </aside>
    </div>
  )
}
