"use client"

import { useState } from "react"
import { ImageAnalysis } from "@/types"
import { buildFullCaption } from "@/lib/caption"
import { WizardBasic, WizardCaption } from "@/lib/wizardState"

export function StepC_Caption({
  basic,
  analysis,
  caption,
  onChange,
}: {
  basic: WizardBasic
  analysis: ImageAnalysis | null
  caption: WizardCaption | null
  onChange: (c: WizardCaption | null) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product: basic, analysis }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "生成に失敗しました")
        return
      }
      onChange({
        description: data.description,
        designDesc: data.designDesc,
        fullText: data.caption,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  function editFullText(v: string) {
    if (!caption) {
      onChange({ description: "", designDesc: "", fullText: v })
      return
    }
    onChange({ ...caption, fullText: v })
  }

  function rebuildFromParts(nextDescription: string, nextDesignDesc: string) {
    const full = buildFullCaption(basic, nextDescription, nextDesignDesc)
    onChange({
      description: nextDescription,
      designDesc: nextDesignDesc,
      fullText: full,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-zinc-900">STEP C: キャプション</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          AI が自動生成します。編集や再生成も可能。スキップしてもOK。
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="flex-1 rounded-lg bg-black text-white text-sm font-bold py-2 disabled:opacity-50"
        >
          {loading ? "生成中..." : caption ? "再生成" : "AI で生成する"}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {caption && (
        <>
          <div className="space-y-2">
            <div>
              <div className="text-[11px] font-bold text-zinc-700 mb-1">
                AI 生成 説明文（description）
              </div>
              <textarea
                value={caption.description}
                onChange={(e) => rebuildFromParts(e.target.value, caption.designDesc)}
                rows={3}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-700 mb-1">
                デザイン1文（designDesc）
              </div>
              <input
                type="text"
                value={caption.designDesc}
                onChange={(e) => rebuildFromParts(caption.description, e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-zinc-700 mb-1">
              完成キャプション（直接編集も可）
            </div>
            <textarea
              value={caption.fullText}
              onChange={(e) => editFullText(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-[12px] font-mono"
            />
          </div>
        </>
      )}
    </div>
  )
}
