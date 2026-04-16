"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { v4 as uuid } from "uuid"
import { StepA_ImageUpload } from "@/components/WizardSteps/StepA_ImageUpload"
import {
  StepB_BasicInfo,
  validateBasic,
} from "@/components/WizardSteps/StepB_BasicInfo"
import { StepC_Caption } from "@/components/WizardSteps/StepC_Caption"
import { StepD_Confirm } from "@/components/WizardSteps/StepD_Confirm"
import {
  WizardState,
  initialWizardState,
  wizardToProducts,
} from "@/lib/wizardState"
import { storage } from "@/lib/storage"
import { getNextBaseNumber, assignProductNumbers } from "@/lib/productNumber"

const STEP_LABELS = ["画像", "基本情報", "キャプション", "確認"]

export default function NewProductPage() {
  const router = useRouter()
  const [state, setState] = useState<WizardState>(initialWizardState)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function goTo(step: 1 | 2 | 3 | 4) {
    setState((s) => ({ ...s, step }))
    setErrors([])
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 })
    }
  }

  function next() {
    if (state.step === 2) {
      const e = validateBasic(state.basic)
      if (e.length > 0) {
        setErrors(e)
        return
      }
    }
    if (state.step < 4) goTo((state.step + 1) as 1 | 2 | 3 | 4)
  }

  function prev() {
    if (state.step > 1) goTo((state.step - 1) as 1 | 2 | 3 | 4)
  }

  function save() {
    setSaving(true)
    try {
      const base = getNextBaseNumber()
      const numbers = assignProductNumbers(base, state.basic.colors)
      const now = new Date().toISOString()
      const products = wizardToProducts(state, numbers, base, uuid, now)
      for (const p of products) storage.upsertProduct(p)
      router.push(`/products/${products[0].id}`)
    } finally {
      setSaving(false)
    }
  }

  const colorCount = state.basic.colors.length
  const nextButtonLabel =
    state.step === 1 && !state.image ? "画像なしで続行" : "次へ"

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <header className="flex items-center justify-between mb-3">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900">
          ← 戻る
        </Link>
        <div className="text-xs text-zinc-500">新規商品登録</div>
        <div className="w-6" />
      </header>

      {/* ステッパー */}
      <div className="flex items-center gap-1 mb-4">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1
          const active = state.step === num
          const done = state.step > num
          return (
            <div key={label} className="flex-1 flex items-center gap-1">
              <div
                className={`flex-1 flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-bold transition ${
                  active
                    ? "bg-brand-yellow text-black"
                    : done
                    ? "bg-green-100 text-green-700"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                <span>{num}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ステップ本体 */}
      <div className="bg-zinc-50">
        {state.step === 1 && (
          <StepA_ImageUpload
            image={state.image}
            analysis={state.analysis}
            onImageChange={(image) => setState((s) => ({ ...s, image }))}
            onAnalysisChange={(analysis) =>
              setState((s) => ({ ...s, analysis }))
            }
          />
        )}

        {state.step === 2 && (
          <StepB_BasicInfo
            basic={state.basic}
            onChange={(updates) =>
              setState((s) => ({ ...s, basic: { ...s.basic, ...updates } }))
            }
            errors={errors}
          />
        )}

        {state.step === 3 && (
          <StepC_Caption
            basic={state.basic}
            analysis={state.analysis}
            caption={state.caption}
            onChange={(caption) => setState((s) => ({ ...s, caption }))}
          />
        )}

        {state.step === 4 && (
          <StepD_Confirm
            state={state}
            productNumbers={assignProductNumbers(
              getNextBaseNumber(),
              state.basic.colors.length > 0 ? state.basic.colors : ["-"]
            )}
            saving={saving}
            onSave={save}
          />
        )}
      </div>

      {/* フッターナビ */}
      {state.step < 4 && (
        <div className="sticky bottom-0 bg-zinc-50/90 backdrop-blur flex items-center justify-between mt-5 pt-3 pb-2">
          <button
            type="button"
            onClick={prev}
            disabled={state.step === 1}
            className="text-xs text-zinc-600 disabled:opacity-30"
          >
            ← 前へ
          </button>
          <div className="text-[11px] text-zinc-500">
            {state.step === 2 && colorCount > 1 && `カラー${colorCount}色 → 枝番自動採番`}
          </div>
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-black text-white text-xs font-bold px-4 py-1.5"
          >
            {nextButtonLabel}
          </button>
        </div>
      )}

      {state.step === 4 && (
        <div className="sticky bottom-0 bg-zinc-50/90 backdrop-blur flex items-center justify-between mt-5 pt-3 pb-2">
          <button
            type="button"
            onClick={prev}
            className="text-xs text-zinc-600"
          >
            ← 戻って編集
          </button>
          <div className="w-12" />
        </div>
      )}
    </div>
  )
}
