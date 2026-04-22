"use client"

import { useEffect, useState } from "react"
import { Product } from "@/types"
import { storage, hydrateStorage } from "@/lib/storage"
import { ensureImages } from "@/lib/migrateProduct"
import { QuickEstimateCard } from "@/components/QuickEstimateCard"

export default function EstimatePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    ;(async () => {
      await hydrateStorage()
      setProducts(storage.getProducts().map(ensureImages))
      setHydrated(true)
    })()
  }, [])

  function handleRegistered(updated: Product) {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    )
  }

  const estimated = hydrated ? products.filter((p) => p.estimation) : []

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* 左: フル機能 推定ツール */}
      <section className="col-span-2">
        <QuickEstimateCard onRegistered={handleRegistered} wide />
      </section>

      {/* 右: 推定履歴 */}
      <aside className="col-span-1">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold mb-3">推定済み商品</h2>

          {!hydrated ? (
            <p className="text-xs text-zinc-500">読み込み中...</p>
          ) : estimated.length === 0 ? (
            <p className="text-xs text-zinc-500">
              まだ推定済みの商品はありません。
              <br />
              左のツールで推定 → 登録するとここに履歴が出ます。
            </p>
          ) : (
            <ul className="space-y-2.5">
              {estimated
                .slice()
                .sort(
                  (a, b) =>
                    (b.estimation?.estimatedAt ?? "").localeCompare(
                      a.estimation?.estimatedAt ?? "",
                    ),
                )
                .map((p) => (
                  <li
                    key={p.id}
                    className="border border-zinc-200 rounded-md p-2.5"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {p.imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagePreview}
                          alt={p.name}
                          className="w-10 h-10 rounded object-cover border border-zinc-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-zinc-100 border border-zinc-200" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold truncate">
                          No.{p.productNumber} {p.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {p.estimation?.bodyCode} / {p.estimation?.color}
                        </div>
                      </div>
                    </div>
                    <div className="rounded bg-amber-50 border border-amber-200 p-1.5 text-center">
                      <div className="text-[10px] text-amber-700">
                        商品単価合計
                      </div>
                      <div className="text-sm font-bold text-amber-900">
                        {p.estimation?.totalMin !== undefined &&
                        p.estimation?.totalMax !== undefined
                          ? `¥${p.estimation.totalMin.toLocaleString()} 〜 ¥${p.estimation.totalMax.toLocaleString()}`
                          : `¥${p.estimation?.subtotalProcessing.toLocaleString()}`}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
