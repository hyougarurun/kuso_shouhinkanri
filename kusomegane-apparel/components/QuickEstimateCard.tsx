"use client"

import { useState } from "react"
import Link from "next/link"
import type { EstimationResult, NormalizedMethod } from "@/lib/print-cost/types"
import { mapMethodFromProcessingType } from "@/lib/print-cost/mapping"
import { storage } from "@/lib/storage"
import { Product } from "@/types"
import { PRODUCT_DRAG_TYPE } from "./ProductCard"

type Meta = {
  invoices: number
  lineItems: number
  products: number
  bodyCodes: number
}

type Props = {
  onRegistered?: (updated: Product) => void
}

export function QuickEstimateCard({ onRegistered }: Props) {
  const [bodyCode, setBodyCode] = useState("5001-01")
  const [color, setColor] = useState("ホワイト")
  const [location, setLocation] = useState("front")
  const [method, setMethod] = useState<NormalizedMethod>("ink_print")

  const [droppedProduct, setDroppedProduct] = useState<Product | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [result, setResult] = useState<EstimationResult | null>(null)
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [registering, setRegistering] = useState(false)
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(null)

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setDragOver(true)
  }

  function onDragLeave() {
    setDragOver(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData(PRODUCT_DRAG_TYPE)
    if (!id) return
    const product = storage.getProducts().find((p) => p.id === id)
    if (!product) return
    setDroppedProduct(product)
    setBodyCode(product.bodyModelNumber || "")
    setColor(product.colors?.[0] || "")
    setMethod(mapMethodFromProcessingType(product.processingType))
    setResult(null)
    setRegisteredMessage(null)
  }

  function clearDropped() {
    setDroppedProduct(null)
    setResult(null)
    setRegisteredMessage(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRegisteredMessage(null)
    try {
      const res = await fetch("/api/estimate-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyCode,
          color: color || undefined,
          locations: [{ location, method }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data.result)
      setMeta(data.meta)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  async function onRegister() {
    if (!droppedProduct || !result) return
    setRegistering(true)
    setRegisteredMessage(null)
    try {
      const updated: Product = {
        ...droppedProduct,
        estimation: {
          bodyCode,
          color: color || undefined,
          location,
          method,
          bodyPriceRange: result.bodyPrice.range,
          bodyPriceMin: result.bodyPrice.minPrice,
          bodyPriceMax: result.bodyPrice.maxPrice,
          subtotalProcessing: result.subtotalProcessing,
          totalMin: result.totalMin,
          totalMax: result.totalMax,
          estimatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      }
      storage.upsertProduct(updated)
      onRegistered?.(updated)
      setRegisteredMessage(
        `${droppedProduct.productNumber} ${droppedProduct.name} に登録しました`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRegistering(false)
    }
  }

  const dropBorder = dragOver
    ? "border-brand-yellow bg-amber-50"
    : droppedProduct
    ? "border-amber-300 bg-amber-50"
    : "border-dashed border-zinc-300 bg-zinc-50"

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-base font-bold">加工費推定</h2>
        <span className="text-[10px] text-zinc-500 border border-zinc-200 rounded px-2 py-0.5">
          PoC
        </span>
      </div>
      {meta ? (
        <p className="text-[11px] text-zinc-500 mb-4">
          学習データ: {meta.invoices} 請求書 /{" "}
          {meta.lineItems.toLocaleString()} 明細
        </p>
      ) : (
        <p className="text-[11px] text-zinc-500 mb-4">
          商品カードをここにドラッグ&ドロップ、または手動入力で
        </p>
      )}

      {/* ドロップエリア */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-md border-2 ${dropBorder} p-3 mb-3 transition text-center`}
      >
        {droppedProduct ? (
          <div className="flex items-center gap-2 text-left">
            {droppedProduct.imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={droppedProduct.imagePreview}
                alt={droppedProduct.name}
                className="w-12 h-12 rounded object-cover border border-zinc-200 bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-white border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-400">
                No Img
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-zinc-900 truncate">
                No.{droppedProduct.productNumber} {droppedProduct.name}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {droppedProduct.bodyModelNumber || "型番未設定"} ·{" "}
                {droppedProduct.colors.join("・") || "色未設定"}
              </div>
            </div>
            <button
              type="button"
              onClick={clearDropped}
              className="text-[11px] text-zinc-500 hover:text-zinc-800 px-1"
              aria-label="ドロップを解除"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-zinc-500 py-1">
            ここに商品カードをドラッグ&ドロップ
            <br />
            （または下に直接入力）
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        <label className="block">
          <span className="text-[11px] text-zinc-500">ボディ型番</span>
          <input
            className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            value={bodyCode}
            onChange={(e) => setBodyCode(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-zinc-500">色</span>
          <input
            className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] text-zinc-500">箇所</span>
            <select
              className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm bg-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="front">front</option>
              <option value="back">back</option>
              <option value="sleeve">袖</option>
              <option value="both_sleeves">両袖</option>
              <option value="three_locations">三か所</option>
              <option value="sleeve_patch">袖ワッペン</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] text-zinc-500">方法</span>
            <select
              className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm bg-white"
              value={method}
              onChange={(e) => setMethod(e.target.value as NormalizedMethod)}
            >
              <option value="ink_print">インク</option>
              <option value="embroidery">刺繍</option>
              <option value="patch">ワッペン</option>
              <option value="sagara_attach">相良取付</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-yellow text-black text-sm font-bold py-2 hover:brightness-95 disabled:opacity-50 transition"
        >
          {loading ? "推定中…" : "推定する"}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 mt-3">エラー: {error}</p>}

      {result && (
        <div className="mt-4 border-t border-zinc-200 pt-4 space-y-3 text-sm">
          <div>
            <span className="text-[11px] text-zinc-500">ボディ単価レンジ</span>
            <div className="font-bold">¥{result.bodyPrice.range}</div>
          </div>

          <div>
            <span className="text-[11px] text-zinc-500">加工費</span>
            <div className="mt-1 space-y-1">
              {result.processing.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-zinc-700">
                    {p.location} / {p.method}
                  </span>
                  <span className="font-semibold">
                    ¥{p.estimatedPrice.toLocaleString()}
                    <span className="text-[10px] text-zinc-400 ml-1">
                      ({p.basedOn}件)
                    </span>
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-zinc-100 pt-1 font-semibold">
                <span>小計</span>
                <span>¥{result.subtotalProcessing.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {result.totalMin !== undefined && result.totalMax !== undefined && (
            <div className="rounded-md bg-amber-50 border border-amber-300 p-3 text-center">
              <div className="text-[10px] text-amber-700">
                商品単価合計（ボディ + 加工費）
              </div>
              <div className="text-lg font-bold text-amber-900">
                ¥{result.totalMin.toLocaleString()} 〜 ¥
                {result.totalMax.toLocaleString()}
              </div>
            </div>
          )}

          {droppedProduct && (
            <button
              type="button"
              onClick={onRegister}
              disabled={registering}
              className="w-full rounded-md bg-zinc-900 text-white text-sm font-bold py-2 hover:bg-zinc-800 disabled:opacity-50 transition"
            >
              {registering
                ? "登録中…"
                : `No.${droppedProduct.productNumber} に登録`}
            </button>
          )}

          {registeredMessage && (
            <div className="rounded-md bg-green-50 border border-green-200 text-green-800 text-xs p-2 text-center">
              ✓ {registeredMessage}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-100 text-[11px] text-zinc-500">
        <Link href="/products/new" className="hover:underline">
          → 詳細入力で新規登録する
        </Link>
      </div>
    </div>
  )
}
