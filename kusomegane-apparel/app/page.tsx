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
    setProducts(storage.getProducts())
    setHydrated(true)
  }, [])

  const summary = summarize(products)
  const visible = filterProducts(products, filter)

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

      <div className="mb-3">
        <FilterTabs value={filter} onChange={setFilter} />
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
