"use client"

import { useEffect, useState } from "react"
import { Product } from "@/types"
import { SuggestiveInput } from "@/components/SuggestiveInput"
import { ProcessingDetailsEditor } from "@/components/WizardSteps/ProcessingDetailsEditor"
import { emptyProcessingDetails } from "@/lib/processingSummary"

type Props = {
  product: Product
  onUpdate?: (next: Product) => void
}

type Draft = {
  name: string
  series: string
  productType: string
  colorsText: string
  sizesText: string
  bodyModelNumber: string
  material: string
  processingInstruction: string
  processingDetails: Product["processingDetails"]
  isMadeToOrder: boolean
  freeShipping: boolean
  notes: string
}

function toDraft(p: Product): Draft {
  return {
    name: p.name,
    series: p.series,
    productType: p.productType,
    colorsText: p.colors.join("・"),
    sizesText: p.sizes.join("/"),
    bodyModelNumber: p.bodyModelNumber,
    material: p.material,
    processingInstruction: p.processingInstruction,
    processingDetails: p.processingDetails,
    isMadeToOrder: p.isMadeToOrder,
    freeShipping: p.freeShipping,
    notes: p.notes,
  }
}

function splitColors(text: string): string[] {
  return text
    .split(/[・,、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
function splitSizes(text: string): string[] {
  return text
    .split(/[/／,、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ProductInfoTable({ product, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => toDraft(product))

  useEffect(() => {
    if (!editing) setDraft(toDraft(product))
  }, [product, editing])

  function save() {
    if (!onUpdate) return
    onUpdate({
      ...product,
      name: draft.name.trim(),
      series: draft.series.trim(),
      productType: draft.productType,
      colors: splitColors(draft.colorsText),
      sizes: splitSizes(draft.sizesText),
      bodyModelNumber: draft.bodyModelNumber.trim(),
      material: draft.material.trim(),
      processingInstruction: draft.processingInstruction,
      processingDetails: draft.processingDetails,
      isMadeToOrder: draft.isMadeToOrder,
      freeShipping: draft.freeShipping,
      notes: draft.notes,
      updatedAt: new Date().toISOString(),
    })
    setEditing(false)
  }

  const canEdit = !!onUpdate

  if (!editing) {
    const rows: [string, React.ReactNode][] = [
      ["商品番号", product.productNumber],
      ["商品名", product.name || "-"],
      ["シリーズ", product.series || "-"],
      ["カラー", product.colors.join("・") || "-"],
      ["サイズ", product.sizes.join("/") || "-"],
      ["商品種別", product.productType || "-"],
      ["加工指示", product.processingInstruction || "-"],
      ["ボディ型番", product.bodyModelNumber || "-"],
      ["素材", product.material || "-"],
      ["受注生産", product.isMadeToOrder ? "あり" : "なし"],
      ["送料無料", product.freeShipping ? "あり" : "なし"],
      ["備考", product.notes || "-"],
    ]
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {canEdit && (
          <div className="flex justify-end px-3 py-2 border-b border-zinc-100 bg-zinc-50">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[11px] font-bold text-zinc-700 hover:text-black"
            >
              ✏ 編集
            </button>
          </div>
        )}
        <table className="w-full text-[12px]">
          <tbody>
            {rows.map(([k, v]) => (
              <tr
                key={k}
                className="border-b border-zinc-100 last:border-b-0 align-top"
              >
                <th className="bg-zinc-50 text-zinc-500 font-medium text-left px-3 py-2 w-28">
                  {k}
                </th>
                <td className="px-3 py-2 text-zinc-900 whitespace-pre-wrap break-words">
                  {v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // 編集モード
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-zinc-700">商品情報を編集</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-[11px] font-bold text-zinc-700 px-2 py-1 border border-zinc-300 rounded hover:bg-zinc-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={save}
            className="text-[11px] font-bold bg-brand-yellow text-black px-2 py-1 rounded hover:brightness-95"
          >
            保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="col-span-2">
          <span className="text-zinc-500">商品名</span>
          <SuggestiveInput
            historyKey="product.name"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="text-zinc-500">シリーズ</span>
          <SuggestiveInput
            historyKey="product.series"
            value={draft.series}
            onChange={(v) => setDraft({ ...draft, series: v })}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="text-zinc-500">商品種別</span>
          <SuggestiveInput
            historyKey="product.productType"
            value={draft.productType}
            onChange={(v) => setDraft({ ...draft, productType: v })}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="text-zinc-500">カラー（・区切り）</span>
          <input
            type="text"
            value={draft.colorsText}
            onChange={(e) => setDraft({ ...draft, colorsText: e.target.value })}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="text-zinc-500">サイズ（/ 区切り）</span>
          <input
            type="text"
            value={draft.sizesText}
            onChange={(e) => setDraft({ ...draft, sizesText: e.target.value })}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="text-zinc-500">ボディ型番</span>
          <SuggestiveInput
            historyKey="product.bodyModelNumber"
            value={draft.bodyModelNumber}
            onChange={(v) => setDraft({ ...draft, bodyModelNumber: v })}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="text-zinc-500">素材</span>
          <SuggestiveInput
            historyKey="product.material"
            value={draft.material}
            onChange={(v) => setDraft({ ...draft, material: v })}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
        <label className="col-span-2 flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={draft.isMadeToOrder}
              onChange={(e) =>
                setDraft({ ...draft, isMadeToOrder: e.target.checked })
              }
            />
            受注生産
          </span>
          <span className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={draft.freeShipping}
              onChange={(e) =>
                setDraft({ ...draft, freeShipping: e.target.checked })
              }
            />
            送料無料
          </span>
        </label>
        <div className="col-span-2">
          <span className="text-zinc-500">加工詳細</span>
          <div className="mt-0.5">
            <ProcessingDetailsEditor
              value={draft.processingDetails ?? emptyProcessingDetails()}
              onChange={(next) =>
                setDraft({ ...draft, processingDetails: next })
              }
            />
          </div>
        </div>
        <label className="col-span-2">
          <span className="text-zinc-500">加工指示（自由文）</span>
          <textarea
            value={draft.processingInstruction}
            onChange={(e) =>
              setDraft({ ...draft, processingInstruction: e.target.value })
            }
            rows={2}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
        <label className="col-span-2">
          <span className="text-zinc-500">備考</span>
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            rows={2}
            className="mt-0.5 w-full text-sm border border-zinc-300 rounded px-2 py-1"
          />
        </label>
      </div>
    </div>
  )
}
