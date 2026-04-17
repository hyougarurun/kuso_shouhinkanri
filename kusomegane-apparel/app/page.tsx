"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Product } from "@/types"
import { storage } from "@/lib/storage"
import { seedIfEmpty } from "@/lib/seed"
import {
  filterProducts,
  summarize,
  FilterValue,
} from "@/lib/productStatus"
import { ensureImages } from "@/lib/migrateProduct"
import { exportProductsZip, downloadBlob } from "@/lib/exportZip"
import { ProductCard } from "@/components/ProductCard"
import { Summary } from "@/components/Summary"
import { FilterTabs } from "@/components/FilterTabs"

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<FilterValue>("all")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    seedIfEmpty()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(storage.getProducts().map(ensureImages))
    setHydrated(true)
  }, [])

  const summary = summarize(products)
  const visible = filterProducts(products, filter)

  async function handleBulkDownload() {
    if (products.length === 0) return
    try {
      const blob = await exportProductsZip(products)
      const date = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `KUSOMEGANE_素材_${date}.zip`)
    } catch {
      // ZIP生成失敗は無視
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-zinc-900">KUSOMEGANE 商品管理</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-1 rounded-full bg-brand-yellow text-black text-xs font-bold px-3 py-1.5 shadow-sm hover:brightness-95 active:brightness-90 transition"
        >
          + 新規追加
        </Link>
      </header>

      <div className="mb-3">
        <Summary
          total={summary.total}
          inProgress={summary.inProgress}
          done={summary.done}
        />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1">
          <FilterTabs value={filter} onChange={setFilter} />
        </div>
        {hydrated && products.length > 0 && (
          <button
            type="button"
            onClick={handleBulkDownload}
            className="shrink-0 rounded-full bg-zinc-900 text-white text-[11px] font-bold px-3 py-1.5 hover:bg-zinc-800 transition"
          >
            一括DL
          </button>
        )}
      </div>

      {!hydrated ? (
        <div className="text-center text-xs text-zinc-500 py-10">
          読み込み中...
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center text-xs text-zinc-500 py-10">
          該当する商品がありません
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
