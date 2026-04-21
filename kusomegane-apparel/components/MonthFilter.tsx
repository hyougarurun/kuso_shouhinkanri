"use client"

import { generateMonthLabels } from "@/lib/schedule"

export const MONTH_FILTER_UNASSIGNED = "__unassigned__"

type Props = {
  value: string | null
  onChange: (next: string | null) => void
}

export function MonthFilter({ value, onChange }: Props) {
  const months = generateMonthLabels()
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="text-xs border border-zinc-300 rounded-md px-2 py-1 bg-white hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
      aria-label="販売月フィルター"
    >
      <option value="">全月</option>
      <option value={MONTH_FILTER_UNASSIGNED}>未定のみ</option>
      {months.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  )
}
