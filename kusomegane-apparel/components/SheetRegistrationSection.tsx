"use client"

import { useState } from "react"
import { Product } from "@/types"

type Props = {
  product: Product
  onUpdate: (next: Product) => void
}

type RegisterResponse = {
  rowNumber: number
  mode: "append" | "update"
  sheetName: string
}

export function SheetRegistrationSection({ product, onUpdate }: Props) {
  const registered = !!product.sheetRegisteredAt
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<RegisterResponse | null>(null)

  async function register() {
    setLoading(true)
    setError(null)
    setLastResult(null)
    try {
      const res = await fetch("/api/sheets/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      })
      const data = (await res.json()) as RegisterResponse | { error: string }
      if (!res.ok || !("rowNumber" in data)) {
        throw new Error(
          "error" in data
            ? data.error
            : `シート登録失敗（HTTP ${res.status}）`,
        )
      }
      const now = new Date().toISOString()
      onUpdate({
        ...product,
        sheetRegisteredAt: now,
        sheetRowNumber: data.rowNumber,
        updatedAt: now,
      })
      setLastResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  function unregister() {
    // ローカル記録のみリセット（シート上の行は残す。手動で消す想定）
    onUpdate({
      ...product,
      sheetRegisteredAt: undefined,
      sheetRowNumber: undefined,
      updatedAt: new Date().toISOString(),
    })
    setLastResult(null)
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">ASTORE シート登録</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            「商品管理」シート（自動作成）に 8 列（商品 / 商品番号 / 色 / サイズ /
            加工 / ボディ型番 / デザインファイル / 備考）を追記 or 上書き
          </p>
        </div>
        {registered && (
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
            登録済み
          </span>
        )}
      </div>

      {registered ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-zinc-600">
              {new Date(product.sheetRegisteredAt!).toLocaleString("ja-JP")} に登録
              {product.sheetRowNumber !== undefined &&
                ` (行 ${product.sheetRowNumber})`}
            </p>
            <button
              type="button"
              onClick={unregister}
              className="text-[11px] text-zinc-500 hover:text-red-600 underline"
            >
              登録を取り消す
            </button>
          </div>
          <button
            type="button"
            onClick={register}
            disabled={loading}
            className="w-full rounded-md border border-zinc-300 bg-white text-zinc-900 text-sm font-bold py-2 hover:bg-zinc-50 disabled:opacity-50 transition"
          >
            {loading ? "更新中…" : "シートを最新に更新する"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={register}
          disabled={loading}
          className="w-full rounded-md bg-brand-yellow text-black text-sm font-bold py-2.5 hover:brightness-95 disabled:opacity-50 transition"
        >
          {loading ? "登録中…" : "商品管理 シートに登録する"}
        </button>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">
          エラー: {error}
        </div>
      )}

      {lastResult && (
        <div className="text-[10px] text-green-700">
          ✓ シート「{lastResult.sheetName}」に
          {lastResult.mode === "append" ? "新規追加しました" : "既存行を上書きしました"}
        </div>
      )}
    </section>
  )
}
