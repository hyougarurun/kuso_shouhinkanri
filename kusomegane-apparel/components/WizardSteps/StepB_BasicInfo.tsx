"use client"

import {
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  PROCESSING_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
} from "@/constants"
import { Chip } from "@/components/ui/Chip"
import { Field } from "@/components/ui/Field"
import { SuggestiveInput } from "@/components/SuggestiveInput"
import { ProcessingDetailsEditor } from "./ProcessingDetailsEditor"
import { WizardBasic, validateBasic } from "@/lib/wizardState"
import { getColorStyle } from "@/lib/colorPalette"
import { getBodyModels, getMaterialForModel } from "@/lib/bodyModelStore"

export function StepB_BasicInfo({
  basic,
  onChange,
  errors,
}: {
  basic: WizardBasic
  onChange: (updates: Partial<WizardBasic>) => void
  errors: string[]
}) {
  function toggle<T extends string>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-zinc-900">STEP B: 基本情報</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          <span className="text-red-600">*</span> は必須項目
        </p>
      </div>

      <Field label="商品名" required>
        <SuggestiveInput
          historyKey="product.name"
          value={basic.name}
          onChange={(v) => onChange({ name: v })}
          placeholder="例: ポチクソ 2フェーズ"
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </Field>

      <Field label="シリーズ名">
        <SuggestiveInput
          historyKey="product.series"
          value={basic.series}
          onChange={(v) => onChange({ series: v })}
          placeholder="例: ポチクソ"
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </Field>

      <Field label="商品種別">
        <div className="flex flex-wrap gap-1">
          {PRODUCT_TYPE_OPTIONS.map((t) => (
            <Chip
              key={t}
              selected={basic.productType === t}
              onClick={() => onChange({ productType: basic.productType === t ? "" : t })}
            >
              {t}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="カラー" required hint="複数選択で枝番が自動採番されます">
        <div className="flex flex-wrap gap-1">
          {COLOR_OPTIONS.map((c) => (
            <Chip
              key={c}
              selected={basic.colors.includes(c)}
              onClick={() => onChange({ colors: toggle(basic.colors, c) })}
              colorDot={getColorStyle(c).bg}
            >
              {c}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="サイズ展開" required>
        <div className="flex flex-wrap gap-1">
          {SIZE_OPTIONS.map((s) => (
            <Chip
              key={s}
              selected={basic.sizes.includes(s)}
              onClick={() => onChange({ sizes: toggle(basic.sizes, s) })}
            >
              {s}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="加工種別">
        <div className="flex flex-wrap gap-1">
          {PROCESSING_OPTIONS.map((p) => (
            <Chip
              key={p}
              selected={basic.processingType === p}
              onClick={() =>
                onChange({ processingType: basic.processingType === p ? "" : p })
              }
            >
              {p}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="加工詳細" hint="シート E 列に「1.タグ付け / 2.正面インク…」形式で書き込まれます">
        <ProcessingDetailsEditor
          value={basic.processingDetails}
          onChange={(next) => onChange({ processingDetails: next })}
        />
      </Field>

      <Field label="加工指示（自由文・任意）" hint="構造化で足りない補足があれば記入">
        <textarea
          value={basic.processingInstruction}
          onChange={(e) => onChange({ processingInstruction: e.target.value })}
          rows={2}
          placeholder="例: DTFは厚盛り気味で。袖の刺繍は黄色糸 3mm。"
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </Field>

      <Field label="ボディ型番" hint="CAB 品番（リストから選択 or 自由入力）">
        <input
          type="text"
          list="body-model-list"
          value={basic.bodyModelNumber}
          onChange={(e) => {
            const val = e.target.value
            onChange({ bodyModelNumber: val })
            const mat = getMaterialForModel(val)
            if (mat) {
              onChange({ bodyModelNumber: val, material: mat })
            }
          }}
          placeholder="例: 5001-01"
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
        <datalist id="body-model-list">
          {getBodyModels().map((m) => (
            <option key={m.model} value={m.model}>
              {m.material}
            </option>
          ))}
        </datalist>
      </Field>

      <Field label="素材">
        <SuggestiveInput
          historyKey="product.material"
          value={basic.material}
          onChange={(v) => onChange({ material: v })}
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 bg-white border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
          <input
            type="checkbox"
            checked={basic.isMadeToOrder}
            onChange={(e) => onChange({ isMadeToOrder: e.target.checked })}
          />
          受注生産
        </label>
        <label className="flex items-center gap-2 bg-white border border-zinc-300 rounded-md px-2 py-1.5 text-sm">
          <input
            type="checkbox"
            checked={basic.freeShipping}
            onChange={(e) => onChange({ freeShipping: e.target.checked })}
          />
          送料無料
        </label>
      </div>

      <Field label="備考" hint="メーカー向けの指示・注意事項">
        <textarea
          value={basic.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </Field>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
          <ul className="list-disc pl-4 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export { validateBasic }
