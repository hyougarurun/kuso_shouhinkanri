"use client"

import { useState } from "react"
import Link from "next/link"
import type {
  EstimationResult,
  ImageAnalysisResult,
  NormalizedLocation,
  NormalizedMethod,
} from "@/lib/print-cost/types"
import { mapMethodFromProcessingType } from "@/lib/print-cost/mapping"
import { storage } from "@/lib/storage"
import { Product } from "@/types"
import { PRODUCT_DRAG_TYPE } from "./ProductCard"
import { SuggestiveInput } from "@/components/SuggestiveInput"

type Meta = {
  invoices: number
  lineItems: number
  products: number
  bodyCodes: number
}

type SelectedLocation = {
  location: NormalizedLocation
  method: NormalizedMethod | ""
}

const LOCATION_OPTIONS: { value: NormalizedLocation; label: string }[] = [
  { value: "front", label: "front（正面）" },
  { value: "back", label: "back（背面）" },
  { value: "sleeve", label: "袖" },
  { value: "both_sleeves", label: "両袖" },
  { value: "three_locations", label: "三か所" },
  { value: "sleeve_patch", label: "袖ワッペン" },
]

const METHOD_OPTIONS: { value: NormalizedMethod | ""; label: string }[] = [
  { value: "", label: "(自動)" },
  { value: "ink_print", label: "インク" },
  { value: "embroidery", label: "刺繍" },
  { value: "patch", label: "ワッペン" },
  { value: "sagara_attach", label: "相良取付" },
]

type Props = {
  onRegistered?: (updated: Product) => void
  /** true の場合、横幅の大きい /estimate ページ用にレイアウトを調整 */
  wide?: boolean
}

export function QuickEstimateCard({ onRegistered, wide = false }: Props) {
  const [bodyCode, setBodyCode] = useState("5001-01")
  const [color, setColor] = useState("ホワイト")
  const [selected, setSelected] = useState<SelectedLocation[]>([
    { location: "front", method: "ink_print" },
  ])

  // 画像アップロード + Vision
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // 商品 D&D
  const [droppedProduct, setDroppedProduct] = useState<Product | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // 推定結果
  const [result, setResult] = useState<EstimationResult | null>(null)
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 登録
  const [registering, setRegistering] = useState(false)
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(
    null,
  )

  // ===== ハンドラ =====
  function onProductDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setDragOver(true)
  }
  function onProductDragLeave() {
    setDragOver(false)
  }
  function onProductDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData(PRODUCT_DRAG_TYPE)
    if (!id) return
    const product = storage.getProducts().find((p) => p.id === id)
    if (!product) return
    setDroppedProduct(product)
    setBodyCode(product.bodyModelNumber || "")
    setColor(product.colors?.[0] || "")
    setSelected([
      {
        location: "front",
        method: mapMethodFromProcessingType(product.processingType),
      },
    ])
    if (product.imagePreview) {
      setImagePreview(product.imagePreview)
    }
    setResult(null)
    setRegisteredMessage(null)
  }
  function clearDropped() {
    setDroppedProduct(null)
    setResult(null)
    setRegisteredMessage(null)
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setAnalysis(null)
    setAnalysisError(null)
    if (imagePreview && imageFile) URL.revokeObjectURL(imagePreview)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function onAnalyzeImage() {
    if (!imageFile) return
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const fd = new FormData()
      fd.append("image", imageFile)
      const res = await fetch("/api/print-cost/analyze-image", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      const a = data.analysis as ImageAnalysisResult
      setAnalysis(a)
      if (a.locations.length > 0) {
        setSelected(
          a.locations.map((loc) => ({
            location: loc.location,
            method: loc.method,
          })),
        )
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : String(err))
    } finally {
      setAnalyzing(false)
    }
  }

  function updateLocation(
    i: number,
    field: keyof SelectedLocation,
    value: string,
  ) {
    setSelected((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? { ...s, [field]: value as SelectedLocation[typeof field] }
          : s,
      ),
    )
  }
  function addLocation() {
    setSelected((prev) => [...prev, { location: "front", method: "" }])
  }
  function removeLocation(i: number) {
    setSelected((prev) => prev.filter((_, idx) => idx !== i))
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
          locations: selected.map((s) => ({
            location: s.location,
            method: s.method || undefined,
          })),
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
      const first = selected[0] ?? { location: "front", method: "ink_print" }
      const updated: Product = {
        ...droppedProduct,
        estimation: {
          bodyCode,
          color: color || undefined,
          location: first.location,
          method: first.method || "ink_print",
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
        `No.${droppedProduct.productNumber} ${droppedProduct.name} に登録しました`,
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
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="p-6 space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold">加工費推定</h2>
          <span className="text-[10px] text-zinc-500 border border-zinc-200 rounded px-2 py-0.5">
            PoC
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 -mt-3">
          {meta
            ? `学習データ: ${meta.invoices} 請求書 / ${meta.lineItems.toLocaleString()} 明細`
            : "商品カードをドラッグ&ドロップ、画像アップロード、または手動入力で"}
        </p>

        {/* 1. 商品ドロップエリア */}
        <section>
          <div className="text-[11px] font-bold text-zinc-700 mb-1.5">
            ① 商品を選択（任意）
          </div>
          <div
            onDragOver={onProductDragOver}
            onDragLeave={onProductDragLeave}
            onDrop={onProductDrop}
            className={`rounded-md border-2 ${dropBorder} p-3 transition text-center`}
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
              </div>
            )}
          </div>
        </section>

        {/* 2. 画像アップロード + Vision */}
        <section>
          <div className="text-[11px] font-bold text-zinc-700 mb-1.5">
            ② 画像から加工箇所を自動判定（任意）
          </div>
          <div
            className={`rounded-md border border-zinc-200 bg-zinc-50 p-3 space-y-2 ${
              wide ? "grid grid-cols-2 gap-3 space-y-0" : ""
            }`}
          >
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="text-[11px] w-full file:mr-2 file:rounded file:border-0 file:bg-zinc-200 file:px-2 file:py-1 file:text-[11px] file:font-bold"
              />
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="プレビュー"
                  className="w-full max-h-40 object-contain rounded border border-zinc-200 bg-white"
                />
              )}
              {imageFile && (
                <button
                  type="button"
                  onClick={onAnalyzeImage}
                  disabled={analyzing}
                  className="w-full rounded-md bg-blue-600 text-white text-xs font-bold py-1.5 hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {analyzing ? "解析中…" : "画像を解析（Claude Vision）"}
                </button>
              )}
              {analysisError && (
                <p className="text-[10px] text-red-600">{analysisError}</p>
              )}
            </div>

            {analysis && (
              <div className="text-[11px] space-y-1">
                {analysis.bodyObservation && (
                  <div>
                    <span className="text-zinc-500">観察:</span>{" "}
                    {analysis.bodyObservation}
                  </div>
                )}
                <div>
                  <span className="text-zinc-500">信頼度:</span>{" "}
                  {analysis.confidence}
                </div>
                {analysis.locations.length === 0 ? (
                  <p className="text-red-600">
                    加工箇所を検出できませんでした
                  </p>
                ) : (
                  <ul className="pl-4 list-disc text-zinc-700 space-y-0.5">
                    {analysis.locations.map((loc, i) => (
                      <li key={i}>
                        <strong>
                          {loc.location} / {loc.method}
                        </strong>
                        <span className="text-[10px] text-zinc-500">
                          {" "}
                          ({loc.sizeHint})
                        </span>
                        {loc.description && (
                          <div className="text-[10px] text-zinc-500">
                            {loc.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="text-[10px] text-zinc-500 mt-1">
                  ※ 下のフォームに自動反映済
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. 入力フォーム + 推定 */}
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="text-[11px] font-bold text-zinc-700">
            ③ 推定条件を確認
          </div>

          <div className={wide ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            <label className="block">
              <span className="text-[11px] text-zinc-500">ボディ型番</span>
              <SuggestiveInput
                historyKey="estimate.bodyCode"
                className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                value={bodyCode}
                onChange={setBodyCode}
                required
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-zinc-500">色</span>
              <SuggestiveInput
                historyKey="estimate.color"
                className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                value={color}
                onChange={setColor}
              />
            </label>
          </div>

          <div>
            <span className="text-[11px] text-zinc-500">
              加工箇所（複数可 / 画像解析で自動反映）
            </span>
            <div className="mt-1 space-y-1.5">
              {selected.map((s, i) => (
                <div key={i} className="flex gap-1.5">
                  <select
                    value={s.location}
                    onChange={(e) =>
                      updateLocation(i, "location", e.target.value)
                    }
                    className="flex-1 border border-zinc-300 rounded-md p-1.5 text-[12px] bg-white"
                  >
                    {LOCATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={s.method}
                    onChange={(e) =>
                      updateLocation(i, "method", e.target.value)
                    }
                    className="flex-1 border border-zinc-300 rounded-md p-1.5 text-[12px] bg-white"
                  >
                    {METHOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLocation(i)}
                    disabled={selected.length === 1}
                    className="w-8 border border-zinc-300 rounded-md text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLocation}
                className="text-[11px] text-zinc-700 border border-dashed border-zinc-300 rounded-md px-2 py-1 hover:bg-zinc-50"
              >
                + 加工箇所を追加
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-yellow text-black text-sm font-bold py-2 hover:brightness-95 disabled:opacity-50 transition"
          >
            {loading ? "推定中…" : "加工費を推定する"}
          </button>
        </form>

        {error && <p className="text-xs text-red-600">エラー: {error}</p>}

        {/* 4. 推定結果 */}
        {result && (
          <section className="border-t border-zinc-200 pt-5 space-y-3 text-sm">
            <div className="text-[11px] font-bold text-zinc-700">
              ④ 推定結果
            </div>
            <div>
              <span className="text-[11px] text-zinc-500">
                ボディ単価レンジ
              </span>
              <div className="font-bold">¥{result.bodyPrice.range}</div>
            </div>

            <div>
              <span className="text-[11px] text-zinc-500">加工費内訳</span>
              <div className="mt-1 space-y-1">
                {result.processing.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-zinc-700 text-xs">
                      {p.location} / {p.method}
                    </span>
                    <span className="font-semibold text-xs">
                      ¥{p.estimatedPrice.toLocaleString()}
                      <span className="text-[10px] text-zinc-400 ml-1">
                        ({p.basedOn}件)
                      </span>
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-zinc-100 pt-1 font-semibold text-xs">
                  <span>加工費小計</span>
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
          </section>
        )}
      </div>

      <div className="px-6 py-3 border-t border-zinc-100 text-[11px] text-zinc-500 bg-zinc-50 rounded-b-lg">
        <Link href="/products/new" className="hover:underline">
          → 詳細入力で新規登録する
        </Link>
      </div>
    </div>
  )
}
