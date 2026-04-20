"use client"

import {
  StepB_BasicInfo,
} from "./StepB_BasicInfo"
import { StepC_Caption } from "./StepC_Caption"
import type { WizardBasic, WizardCaption } from "@/lib/wizardState"
import type { ImageAnalysis } from "@/types"

type Props = {
  basic: WizardBasic
  caption: WizardCaption | null
  analysis: ImageAnalysis | null
  errors: string[]
  onBasicChange: (updates: Partial<WizardBasic>) => void
  onCaptionChange: (caption: WizardCaption | null) => void
}

export function Step2_Details({
  basic,
  caption,
  analysis,
  errors,
  onBasicChange,
  onCaptionChange,
}: Props) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-base font-bold">STEP 2: 登録情報</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          商品の基本情報とキャプションを入力します。
        </p>
      </div>

      <section className="pb-6 border-b border-zinc-100">
        <StepB_BasicInfo
          basic={basic}
          onChange={onBasicChange}
          errors={errors}
        />
      </section>

      <section>
        <StepC_Caption
          basic={basic}
          analysis={analysis}
          caption={caption}
          onChange={onCaptionChange}
        />
      </section>
    </div>
  )
}
