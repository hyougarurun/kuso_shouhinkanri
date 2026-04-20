"use client"

import { useState } from "react"
import { ProductImages } from "@/types"

type SlotKey = keyof ProductImages

const SLOTS: { key: SlotKey; label: string }[] = [
  { key: "composite", label: "合成画像" },
  { key: "processing", label: "加工箇所" },
  { key: "wearing", label: "着画" },
  { key: "sizeDetail", label: "サイズ詳細" },
]

export function ImageSlots({
  images,
  onUpload,
  onDelete,
}: {
  images: ProductImages
  onUpload: (key: SlotKey, file: File) => void
  onDelete: (key: SlotKey) => void
}) {
  const [focused, setFocused] = useState(false)

  // 空きスロットの先頭キーを返す
  function firstEmptySlot(): SlotKey | null {
    for (const s of SLOTS) {
      if (!images[s.key]) return s.key
    }
    return null
  }

  function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (!file) continue
        const slot = firstEmptySlot()
        if (!slot) return // 全スロット埋まってる
        onUpload(slot, file)
        e.preventDefault()
        break
      }
    }
  }

  return (
    <div
      tabIndex={0}
      onPaste={onPaste}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`outline-none rounded-md transition ${
        focused ? "ring-2 ring-brand-yellow" : ""
      }`}
    >
      <div className="grid grid-cols-4 gap-2">
        {SLOTS.map((slot) => {
          const src = images[slot.key]
          return (
            <div key={slot.key} className="relative">
              {src ? (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={slot.label}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onDelete(slot.key)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition">
                  <span className="text-zinc-400 text-lg">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onUpload(slot.key, file)
                      e.target.value = ""
                    }}
                  />
                </label>
              )}
              <div className="mt-0.5 text-[10px] text-zinc-500 text-center truncate">
                {slot.label}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] text-zinc-400 text-center">
        枠をクリック or ここをクリック → Cmd+V で空きスロット先頭に貼り付け
      </p>
    </div>
  )
}

export type { SlotKey }
