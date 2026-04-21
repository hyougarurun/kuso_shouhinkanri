"use client"

import type { ProcessingDetails, ProcessingMethod } from "@/types"
import { buildProcessingSummary } from "@/lib/processingSummary"

const METHODS: { value: ProcessingMethod; label: string }[] = [
  { value: "ink", label: "インク" },
  { value: "embroidery", label: "刺繍" },
  { value: "dtf", label: "DTF" },
]

const LOCATIONS: { key: "front" | "back" | "sleeve"; label: string }[] = [
  { key: "front", label: "正面" },
  { key: "back", label: "背面" },
  { key: "sleeve", label: "袖" },
]

type Props = {
  value: ProcessingDetails
  onChange: (next: ProcessingDetails) => void
}

export function ProcessingDetailsEditor({ value, onChange }: Props) {
  function setMethod(
    key: "front" | "back" | "sleeve",
    method: ProcessingMethod | null,
  ) {
    onChange({ ...value, [key]: method })
  }

  const summary = buildProcessingSummary(value)

  return (
    <div className="space-y-2">
      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={value.tagAttachment}
          onChange={(e) => onChange({ ...value, tagAttachment: e.target.checked })}
          className="accent-amber-500"
        />
        <span className="font-semibold">タグ付け</span>
        <span className="text-[11px] text-zinc-500">（ワッペン・袖タグ 等）</span>
      </label>

      <div className="space-y-1.5">
        {LOCATIONS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-700 w-10 shrink-0">
              {label}
            </span>
            <button
              type="button"
              onClick={() => setMethod(key, null)}
              className={
                "px-2 py-1 text-xs rounded border transition " +
                (value[key] === null
                  ? "bg-zinc-100 border-zinc-300 text-zinc-600 font-semibold"
                  : "bg-white border-zinc-200 text-zinc-400 hover:bg-zinc-50")
              }
            >
              なし
            </button>
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(key, m.value)}
                className={
                  "px-2 py-1 text-xs rounded border transition " +
                  (value[key] === m.value
                    ? "bg-brand-yellow border-amber-400 text-black font-bold"
                    : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50")
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {summary && (
        <div className="rounded bg-zinc-50 border border-zinc-200 px-2 py-1.5 text-[11px] text-zinc-700 whitespace-pre-line">
          <span className="text-[10px] text-zinc-500">シート E 列に書き込まれる内容:</span>
          {"\n"}
          {summary}
        </div>
      )}
    </div>
  )
}
