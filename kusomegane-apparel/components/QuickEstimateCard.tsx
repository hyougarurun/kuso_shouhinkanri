"use client"

import { useState } from "react"
import Link from "next/link"
import type { EstimationResult } from "@/lib/print-cost/types"

type Meta = { invoices: number; lineItems: number; products: number; bodyCodes: number }

export function QuickEstimateCard() {
  const [bodyCode, setBodyCode] = useState("5001-01")
  const [color, setColor] = useState("ホワイト")
  const [location, setLocation] = useState("front")
  const [method, setMethod] = useState("ink_print")
  const [result, setResult] = useState<EstimationResult | null>(null)
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
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
          学習データ: {meta.invoices} 請求書 / {meta.lineItems.toLocaleString()} 明細
        </p>
      ) : (
        <p className="text-[11px] text-zinc-500 mb-4">
          クイック推定（詳細は新規登録から）
        </p>
      )}

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
              onChange={(e) => setMethod(e.target.value)}
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
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-100 text-[11px] text-zinc-500">
        <Link href="/products/new" className="hover:underline">
          → 詳細入力で登録する
        </Link>
      </div>
    </div>
  )
}
