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
  const activeIdx = product.steps.findIndex((s) => s.status !== "done")

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 space-y-3">
      <ol className="flex items-stretch gap-1">
        {FLOW_STEPS.map((def, i) => {
          const step: FlowStep | undefined = product.steps.find(
            (s) => s.stepNumber === def.id
          )
          const done = step?.status === "done"
          const isActive = !done && i === activeIdx
          return (
            <li key={def.id} className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onToggle(def.id)}
                aria-label={`STEP ${def.id} ${def.name} 完了トグル`}
                className={`w-full flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 transition ${
                  done
                    ? "bg-green-50 border-green-300 hover:bg-green-100"
                    : isActive
                      ? "bg-amber-50 border-brand-yellow hover:bg-amber-100"
                      : "bg-zinc-50 border-transparent hover:bg-zinc-100"
                }`}
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    done
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-brand-yellow text-black"
                        : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  {done ? "✓" : def.id}
                </span>
                <span className="text-[14px] leading-none">{def.icon}</span>
                <span
                  className={`text-[9px] leading-tight text-center break-keep ${
                    done
                      ? "text-zinc-400 line-through"
                      : isActive
                        ? "text-zinc-900 font-bold"
                        : "text-zinc-600"
                  }`}
                >
                  {def.name}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* step5: サンプル到着日 */}
      <details className="rounded-md border border-zinc-200 bg-zinc-50/50 px-2 py-1.5">
        <summary className="text-[11px] font-bold text-zinc-700 cursor-pointer select-none">
          📦 STEP 5: サンプル到着確認
        </summary>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={product.sampleArrivalDate ?? ""}
            onChange={(e) => onSampleDateChange(e.target.value)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
          />
          {step5Content}
        </div>
      </details>

      {/* step7: アセットチェックリスト */}
      {step7Content && (
        <details className="rounded-md border border-zinc-200 bg-zinc-50/50 px-2 py-1.5" open>
          <summary className="text-[11px] font-bold text-zinc-700 cursor-pointer select-none">
            📋 STEP 7: 商品登録素材準備
          </summary>
          <div className="mt-2">{step7Content}</div>
        </details>
      )}
    </div>
  )
}
