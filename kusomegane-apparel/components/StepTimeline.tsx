"use client"

import { FlowStep, Product } from "@/types"
import { FLOW_STEPS } from "@/constants"

export function StepTimeline({
  product,
  onToggle,
  onSampleDateChange,
  step5Content,
  step7Content,
}: {
  product: Product
  onToggle: (stepNumber: number) => void
  onSampleDateChange: (value: string) => void
  step5Content?: React.ReactNode
  step7Content?: React.ReactNode
}) {
  return (
    <ol className="space-y-2">
      {FLOW_STEPS.map((def) => {
        const step: FlowStep | undefined = product.steps.find(
          (s) => s.stepNumber === def.id
        )
        const done = step?.status === "done"
        const isActive =
          !done &&
          product.steps.findIndex((s) => s.status !== "done") ===
            product.steps.findIndex((s) => s.stepNumber === def.id)
        return (
          <li
            key={def.id}
            className={`bg-white rounded-lg shadow-sm p-3 border ${
              isActive ? "border-brand-yellow" : "border-transparent"
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onToggle(def.id)}
                aria-label={`STEP ${def.id} 完了トグル`}
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold transition ${
                  done
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-brand-yellow text-black"
                    : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {done ? "✓" : def.id}
              </button>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm ${
                    done
                      ? "text-zinc-400 line-through"
                      : isActive
                      ? "font-bold text-zinc-900"
                      : "text-zinc-700"
                  }`}
                >
                  {def.icon} {def.name}
                </div>

                {def.id === 5 && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="date"
                      value={product.sampleArrivalDate ?? ""}
                      onChange={(e) => onSampleDateChange(e.target.value)}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                    />
                    {step5Content}
                  </div>
                )}

                {def.id === 7 && step7Content && (
                  <div className="mt-2">{step7Content}</div>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
