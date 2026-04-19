"use client"

import { useState } from "react"
import type {
  EstimationResult,
  ImageAnalysisResult,
  NormalizedLocation,
  NormalizedMethod,
} from "@/lib/print-cost/types"
import type {
  WizardEstimation,
  WizardEstimationLocation,
  WizardImage,
} from "@/lib/wizardState"

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

async function fileToWizardImage(file: File): Promise<WizardImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(",")[1] ?? ""
      resolve({
        dataUrl,
        base64,
        mediaType: file.type as WizardImage["mediaType"],
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

type Meta = {
  invoices: number
  lineItems: number
  products: number
  bodyCodes: number
}

type Props = {
  image: WizardImage | null
  estimation: WizardEstimation | null
  onImageChange: (image: WizardImage | null) => void
  onEstimationChange: (est: WizardEstimation | null) => void
}

export function Step1_Estimate({
  image,
  estimation,
  onImageChange,
  onEstimationChange,
}: Props) {
  const [bodyCode, setBodyCode] = useState(estimation?.bodyCode ?? "")
  const [color, setColor] = useState(estimation?.color ?? "")
  const [selected, setSelected] = useState<WizardEstimationLocation[]>(
    estimation?.locations ?? [{ location: "front", method: "ink_print" }],
  )
  const [result, setResult] = useState<EstimationResult | null>(
    estimation?.result ?? null,
  )
  const [meta, setMeta] = useState<Meta | null>(null)

  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function persistEstimation(next: {
    bodyCode?: string
    color?: string
    locations?: WizardEstimationLocation[]
    result?: EstimationResult | null
  }) {
    onEstimationChange({
      bodyCode: next.bodyCode ?? bodyCode,
      color: next.color ?? color,
      locations: next.locations ?? selected,
      result: next.result ?? result,
    })
  }

  async function onImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      onImageChange(null)
      return
    }
    try {
      const img = await fileToWizardImage(file)
      onImageChange(img)
      setAnalysis(null)
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : String(err))
    }
  }

  async function onAnalyzeImage() {
    if (!image) return
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      // base64 → Blob → File → FormData
      const byteChars = atob(image.base64)
      const bytes = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
      const blob = new Blob([bytes], { type: image.mediaType })
      const fd = new FormData()
      fd.append("image", blob, `upload.${image.mediaType.split("/")[1]}`)

      const res = await fetch("/api/print-cost/analyze-image", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      const a = data.analysis as ImageAnalysisResult
      setAnalysis(a)
      if (a.locations.length > 0) {
        const nextLocs: WizardEstimationLocation[] = a.locations.map((l) => ({
          location: l.location,
          method: l.method,
        }))
        setSelected(nextLocs)
        persistEstimation({ locations: nextLocs })
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : String(err))
    } finally {
      setAnalyzing(false)
    }
  }

  function updateLocation(
    i: number,
    field: keyof WizardEstimationLocation,
    value: string,
  ) {
    setSelected((prev) => {
      const next = prev.map((s, idx) =>
        idx === i
          ? { ...s, [field]: value as WizardEstimationLocation[typeof field] }
          : s,
      )
      persistEstimation({ locations: next })
      return next
    })
  }

  function addLocation() {
    const next: WizardEstimationLocation[] = [
      ...selected,
      { location: "front", method: "" },
    ]
    setSelected(next)
    persistEstimation({ locations: next })
  }

  function removeLocation(i: number) {
    const next = selected.filter((_, idx) => idx !== i)
    setSelected(next)
    persistEstimation({ locations: next })
  }

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
      persistEstimation({ result: data.result })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-base font-bold">STEP 1: 加工費推測</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          合成画像があれば Claude Vision で加工箇所を自動判定できます。手動入力のみでも可。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 左: 画像 */}
        <section>
          <div className="text-[11px] font-bold text-zinc-700 mb-1.5">
            ① 合成商品画像（任意）
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={onImageFileChange}
              className="text-[11px] w-full file:mr-2 file:rounded file:border-0 file:bg-zinc-200 file:px-2 file:py-1 file:text-[11px] file:font-bold"
            />
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.dataUrl}
                alt="プレビュー"
                className="w-full max-h-60 object-contain rounded border border-zinc-200 bg-white"
              />
            )}
            {image && (
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
                  <p className="text-red-600">加工箇所を検出できませんでした</p>
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
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 右: 入力 + 推定 */}
        <section>
          <div className="text-[11px] font-bold text-zinc-700 mb-1.5">
            ② 推定条件
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="text-[11px] text-zinc-500">ボディ型番</span>
              <input
                className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                value={bodyCode}
                onChange={(e) => {
                  setBodyCode(e.target.value)
                  persistEstimation({ bodyCode: e.target.value })
                }}
                placeholder="5001-01"
                required
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-zinc-500">色</span>
              <input
                className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value)
                  persistEstimation({ color: e.target.value })
                }}
                placeholder="ホワイト / カラー 等"
              />
            </label>

            <div>
              <span className="text-[11px] text-zinc-500">加工箇所</span>
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
              disabled={loading || !bodyCode}
              className="w-full rounded-md bg-brand-yellow text-black text-sm font-bold py-2 hover:brightness-95 disabled:opacity-50 transition"
            >
              {loading ? "推定中…" : "加工費を推定する"}
            </button>
          </form>

          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        </section>
      </div>

      {/* 下部: 推定結果 */}
      {result && (
        <section className="border-t border-zinc-200 pt-5 space-y-3 text-sm">
          <div className="text-[11px] font-bold text-zinc-700">③ 推定結果</div>

          <div className="grid grid-cols-2 gap-6">
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
                  <div key={i} className="flex justify-between text-xs">
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
                <div className="flex justify-between border-t border-zinc-100 pt-1 font-semibold text-xs">
                  <span>加工費小計</span>
                  <span>¥{result.subtotalProcessing.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {result.totalMin !== undefined && result.totalMax !== undefined && (
            <div className="rounded-md bg-amber-50 border border-amber-300 p-3 text-center">
              <div className="text-[10px] text-amber-700">
                商品単価合計（ボディ + 加工費 / 1 枚あたり）
              </div>
              <div className="text-lg font-bold text-amber-900">
                ¥{result.totalMin.toLocaleString()} 〜 ¥
                {result.totalMax.toLocaleString()}
              </div>
            </div>
          )}

          {meta && (
            <div className="text-[10px] text-zinc-400 text-center">
              学習データ: {meta.invoices} 請求書 /{" "}
              {meta.lineItems.toLocaleString()} 明細
            </div>
          )}
        </section>
      )}
    </div>
  )
}
