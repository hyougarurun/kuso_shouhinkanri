"use client"

import { useState } from "react"
import { WizardBasic, WizardState } from "@/lib/wizardState"
import type { EstimationResult } from "@/lib/print-cost/types"

const PRINT_COST_ESTIMATOR_URL =
  process.env.NEXT_PUBLIC_PRINT_COST_ESTIMATOR_URL ?? "http://localhost:3101"

function mapMethodFromProcessingType(pt: string): string {
  if (!pt) return "ink_print"
  if (pt.includes("刺繍")) return "embroidery"
  if (pt.includes("ワッペン")) return "patch"
  if (pt.includes("相良")) return "sagara_attach"
  return "ink_print"
}

function buildEstimateUrl(basic: WizardBasic): string {
  const params = new URLSearchParams()
  if (basic.bodyModelNumber) params.set("bodyCode", basic.bodyModelNumber)
  const firstColor = basic.colors[0] ?? ""
  if (firstColor) params.set("color", firstColor)
  params.set("locations", "front")
  params.set("methods", mapMethodFromProcessingType(basic.processingType))
  params.set("source", "kusomegane-apparel")
  return `${PRINT_COST_ESTIMATOR_URL}/?${params.toString()}`
}

export function StepD_Confirm({
  state,
  productNumbers,
  saving,
  onSave,
}: {
  state: WizardState
  productNumbers: string[]
  saving: boolean
  onSave: () => void
}) {
  const { basic, image, caption } = state
  const [estimate, setEstimate] = useState<EstimationResult | null>(null)
  const [estimateMeta, setEstimateMeta] = useState<{
    invoices: number
    lineItems: number
  } | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [estimateError, setEstimateError] = useState<string | null>(null)

  async function fetchEstimate() {
    setEstimating(true)
    setEstimateError(null)
    try {
      const res = await fetch("/api/estimate-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyCode: basic.bodyModelNumber,
          color: basic.colors[0] || undefined,
          locations: [
            {
              location: "front",
              method: mapMethodFromProcessingType(basic.processingType),
            },
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setEstimate(data.result as EstimationResult)
      setEstimateMeta(data.meta)
    } catch (e) {
      setEstimateError(e instanceof Error ? e.message : String(e))
    } finally {
      setEstimating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-zinc-900">STEP D: 確認・保存</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          以下の内容で登録します。カラーの数だけレコードが作成されます。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 space-y-3">
        <div className="flex gap-3">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.dataUrl}
              alt="preview"
              className="w-24 h-24 object-contain rounded border border-zinc-200"
            />
          )}
          <div className="flex-1 space-y-1 text-[12px]">
            <div className="font-bold text-zinc-900 text-sm">{basic.name}</div>
            <div className="text-zinc-500">{basic.series || "シリーズ未設定"}</div>
            <div>
              <span className="text-zinc-500">商品番号: </span>
              {productNumbers.join(" / ")}
            </div>
            <div>
              <span className="text-zinc-500">カラー: </span>
              {basic.colors.join("・")}
            </div>
            <div>
              <span className="text-zinc-500">サイズ: </span>
              {basic.sizes.join("/")}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-2 grid grid-cols-2 gap-y-1 text-[12px]">
          <div className="text-zinc-500">ボディ型番</div>
          <div>{basic.bodyModelNumber || "-"}</div>
          <div className="text-zinc-500">素材</div>
          <div>{basic.material}</div>
          <div className="text-zinc-500">受注生産</div>
          <div>{basic.isMadeToOrder ? "あり" : "なし"}</div>
          <div className="text-zinc-500">送料無料</div>
          <div>{basic.freeShipping ? "あり" : "なし"}</div>
        </div>

        {basic.notes && (
          <div className="border-t border-zinc-100 pt-2 text-[12px]">
            <div className="text-zinc-500 mb-1">備考</div>
            <div className="whitespace-pre-wrap">{basic.notes}</div>
          </div>
        )}

        {caption?.fullText && (
          <div className="border-t border-zinc-100 pt-2 text-[12px]">
            <div className="text-zinc-500 mb-1">キャプション</div>
            <div className="whitespace-pre-wrap font-mono text-[11px] bg-zinc-50 p-2 rounded max-h-40 overflow-y-auto">
              {caption.fullText}
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-[11px] text-zinc-700">
        <div className="font-bold mb-1">Phase 1 で自動化されること</div>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Google Drive に商品番号フォルダを自動作成</li>
          <li>合成画像を Drive にアップロード</li>
          <li>スプレッドシートに B〜H 列 + 発注数量列を自動追記</li>
        </ul>
      </div>

      {basic.bodyModelNumber && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-[11px] text-zinc-700">
          <div className="font-bold mb-1">加工費推定（PoC）</div>
          <p className="text-zinc-600 mb-2">
            過去請求書（14 件・明細 約 1,900 件）を学習した推定エンジンで、
            この商品の加工費レンジを取得します。
          </p>

          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={fetchEstimate}
              disabled={estimating}
              className="rounded bg-sky-600 text-white text-[11px] font-bold px-3 py-1.5 disabled:opacity-50"
            >
              {estimating ? "推定中…" : "加工費を推定する"}
            </button>
            <a
              href={buildEstimateUrl(basic)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-sky-600 text-sky-700 text-[11px] font-bold px-3 py-1.5"
            >
              詳細ツールを開く →
            </a>
          </div>

          {estimateError && (
            <p className="text-red-600 mt-2">エラー: {estimateError}</p>
          )}

          {estimate && (
            <div className="bg-white rounded border border-sky-200 p-2 mt-2 space-y-1">
              <div className="font-bold text-zinc-900">推定結果</div>
              <div>
                <span className="text-zinc-500">ボディ単価レンジ: </span>
                ¥{estimate.bodyPrice.range}
              </div>
              <div className="border-t border-zinc-100 pt-1">
                <div className="text-zinc-500 mb-1">加工費内訳</div>
                {estimate.processing.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {p.location} / {p.method}
                    </span>
                    <span>
                      ¥{p.estimatedPrice.toLocaleString()}{" "}
                      <span className="text-zinc-400 text-[10px]">
                        ({p.confidence} / {p.basedOn}件)
                      </span>
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t border-zinc-100 mt-1 pt-1">
                  <span>加工費小計</span>
                  <span>¥{estimate.subtotalProcessing.toLocaleString()}</span>
                </div>
              </div>

              {estimate.totalMin !== undefined &&
                estimate.totalMax !== undefined && (
                  <div className="bg-sky-100 border border-sky-300 rounded p-2 text-center mt-2">
                    <div className="text-[10px] text-sky-700">
                      商品単価合計（ボディ + 加工費 / 1枚あたり）
                    </div>
                    <div className="text-[16px] font-bold text-sky-900">
                      ¥{estimate.totalMin.toLocaleString()} 〜 ¥
                      {estimate.totalMax.toLocaleString()}
                    </div>
                  </div>
                )}

              {estimate.notes.length > 0 && (
                <ul className="text-zinc-500 text-[10px] mt-1 list-disc pl-4">
                  {estimate.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}

              {estimateMeta && (
                <div className="text-zinc-400 text-[10px] mt-1 border-t border-zinc-100 pt-1">
                  学習データ: {estimateMeta.invoices} 請求書 /{" "}
                  {estimateMeta.lineItems.toLocaleString()} 明細
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-lg bg-brand-yellow text-black text-sm font-bold py-2.5 disabled:opacity-50"
      >
        {saving ? "保存中..." : "商品を登録する"}
      </button>
    </div>
  )
}
