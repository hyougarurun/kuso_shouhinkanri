"use client"

import { FilterValue } from "@/lib/productStatus"

const TABS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "全て" },
  { value: "in_progress", label: "対応中" },
  { value: "done", label: "完了" },
]

export function FilterTabs({
  value,
  onChange,
}: {
  value: FilterValue
  onChange: (v: FilterValue) => void
}) {
  return (
    <div className="inline-flex rounded-lg bg-zinc-200 p-0.5">
      {TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`px-3 py-1 text-xs font-bold rounded-md transition ${
            value === t.value
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
