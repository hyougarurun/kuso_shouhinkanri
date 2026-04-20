"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { v4 as uuid } from "uuid"
import { Step1_Image } from "@/components/WizardSteps/Step1_Image"
import { Step2_Details } from "@/components/WizardSteps/Step2_Details"
import { Step3_Complete } from "@/components/WizardSteps/Step3_Complete"
import {
  WizardState,
  initialWizardState,
  validateBasic,
  wizardToProducts,
} from "@/lib/wizardState"
import { storage } from "@/lib/storage"
import { getNextBaseNumber, assignProductNumbers } from "@/lib/productNumber"

const STEP_LABELS = ["画像アップロード", "登録情報", "登録完了"]

export default function NewProductPage() {
  const router = useRouter()
  const [state, setState] = useState<WizardState>(initialWizardState)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function goTo(step: 1 | 2 | 3) {
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
    if (state.step < 3) goTo((state.step + 1) as 1 | 2 | 3)
  }

  function prev() {
    if (state.step > 1) goTo((state.step - 1) as 1 | 2 | 3)
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

  const productNumbers = assignProductNumbers(
    getNextBaseNumber(),
    state.basic.colors.length > 0 ? state.basic.colors : ["-"],
  )

  return (
    <div className="mx-auto max-w-[1200px]">
      <header className="flex items-center justify-between mb-4">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900">
          ← ホームへ戻る
        </Link>
        <div className="text-sm font-bold text-zinc-900">新規商品登録</div>
        <div className="w-12" />
      </header>

      {/* 進行バー */}
      <div className="flex items-center gap-2 mb-5">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1
          const active = state.step === num
          const done = state.step > num
          return (
            <div
              key={label}
              className="flex-1 flex items-center gap-2"
            >
              <div
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-bold transition ${
                  active
                    ? "bg-brand-yellow text-black"
                    : done
                    ? "bg-green-100 text-green-700"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                <span>{num}</span>
                <span>{label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 本体 */}
      <div>
        {state.step === 1 && (
          <Step1_Image
            image={state.image}
            onImageChange={(image) => setState((s) => ({ ...s, image }))}
          />
        )}

        {state.step === 2 && (
          <Step2_Details
            basic={state.basic}
            caption={state.caption}
            analysis={state.analysis}
            errors={errors}
            onBasicChange={(updates) =>
              setState((s) => ({ ...s, basic: { ...s.basic, ...updates } }))
            }
            onCaptionChange={(caption) => setState((s) => ({ ...s, caption }))}
          />
        )}

        {state.step === 3 && (
          <Step3_Complete
            state={state}
            productNumbers={productNumbers}
            saving={saving}
            onSave={save}
          />
        )}
      </div>

      {/* フッタ */}
      <div className="sticky bottom-0 bg-zinc-50/90 backdrop-blur flex items-center justify-between mt-6 pt-4 pb-2 border-t border-zinc-200">
        <button
          type="button"
          onClick={prev}
          disabled={state.step === 1}
          className="text-xs text-zinc-600 disabled:opacity-30"
        >
          ← 前へ
        </button>
        <div className="text-[11px] text-zinc-500">
          {state.step === 2 &&
            state.basic.colors.length > 1 &&
            `カラー ${state.basic.colors.length} 色 → 枝番自動採番`}
        </div>
        {state.step < 3 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-black text-white text-xs font-bold px-5 py-2 hover:bg-zinc-800 transition"
          >
            次へ →
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>
    </div>
  )
}
