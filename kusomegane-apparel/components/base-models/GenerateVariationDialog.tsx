"use client"

import { useState } from "react"
import type { BaseModelGarmentType } from "@/types"
import { SuggestiveInput } from "@/components/SuggestiveInput"

const TARGETS: { value: BaseModelGarmentType; label: string }[] = [
  { value: "tshirt", label: "Tシャツ" },
  { value: "longsleeve", label: "ロンT" },
  { value: "crewneck", label: "スウェット" },
  { value: "hoodie", label: "パーカー" },
]

type VariationMode = "conservative" | "balanced" | "creative"
const MODES: { value: VariationMode; label: string; hint: string }[] = [
  { value: "conservative", label: "保守的", hint: "人物・ポーズ・背景を維持" },
  { value: "balanced", label: "標準", hint: "顔/ポーズは自然に変化 OK" },
  { value: "creative", label: "柔軟", hint: "構図・ポーズ大胆にリアレンジ" },
]

const MODEL_OPTIONS = [
  {
    value: "gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image（~$0.039 / 約 6 円）",
    warn: null as string | null,
  },
  {
    value: "gpt-image-2/low",
    label: "GPT-image-2 Low（~$0.006 / 約 1 円・最安）",
    warn: null,
  },
  {
    value: "gpt-image-2/medium",
    label: "GPT-image-2 Medium（~$0.041 / 約 6 円・推奨）",
    warn: null,
  },
  {
    value: "gpt-image-2/high",
    label: "GPT-image-2 High（~$0.165 / 約 25 円・高画質）",
    warn: "⚠ 1 枚約 25 円（Medium の 4 倍）。厳選用途で使用",
  },
]

type Props = {
  open: boolean
  baseModelId: string | null
  thumbUrl?: string
  parentLabel?: string
  parentGarment?: BaseModelGarmentType
  onClose: () => void
  onGenerated: () => void
}

export function GenerateVariationDialog({
  open,
  baseModelId,
  thumbUrl,
  parentLabel,
  parentGarment,
  onClose,
  onGenerated,
}: Props) {
  const [targetGarment, setTargetGarment] = useState<BaseModelGarmentType>("tshirt")
  const [variationMode, setVariationMode] = useState<VariationMode>("balanced")
  const [additionalPrompt, setAdditionalPrompt] = useState("")
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open || !baseModelId) return null

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/base-models/${baseModelId}/generate-variation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetGarment,
          variationMode,
          additionalPrompt: additionalPrompt || undefined,
          model,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "unknown" }))
        throw new Error(j.error || "生成失敗")
      }
      onGenerated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">派生バリエーション生成</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              元: {parentLabel || baseModelId.slice(0, 8)}
              {parentGarment ? ` (${parentGarment})` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-zinc-500 hover:text-zinc-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {thumbUrl && (
          <div className="mb-3 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl}
              alt="親画像"
              className="max-h-32 object-contain rounded border border-zinc-200"
            />
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              派生先の服種
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TARGETS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTargetGarment(t.value)}
                  disabled={busy}
                  className={
                    "px-3 py-2 rounded text-sm font-semibold border transition " +
                    (targetGarment === t.value
                      ? "bg-brand-yellow text-black border-amber-400"
                      : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              バリエーション強度
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setVariationMode(m.value)}
                  disabled={busy}
                  title={m.hint}
                  className={
                    "px-2 py-2 rounded text-xs font-semibold border transition " +
                    (variationMode === m.value
                      ? "bg-brand-yellow text-black border-amber-400"
                      : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50")
                  }
                >
                  <div>{m.label}</div>
                  <div className="text-[9px] font-normal opacity-75 leading-tight mt-0.5">
                    {m.hint}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              デザイン・プリントは全モード共通で保持します
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              追加指示（任意）
            </label>
            <SuggestiveInput
              historyKey="baseModel.variationAdditional"
              value={additionalPrompt}
              onChange={setAdditionalPrompt}
              placeholder="例: 袖を少し短めに / 色はそのまま"
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              モデル
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={busy}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {(() => {
              const warn = MODEL_OPTIONS.find((m) => m.value === model)?.warn
              return warn ? (
                <p className="text-[10px] text-red-700 mt-1">{warn}</p>
              ) : null
            })()}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-800">
            プリント/ロゴ/グラフィックを保持。人物・ポーズは選択した強度に応じて変化します。生成は 10〜30 秒かかります。
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 rounded disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="px-4 py-1.5 text-sm bg-brand-yellow text-black font-bold rounded hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "生成中..." : "🎨 生成"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
