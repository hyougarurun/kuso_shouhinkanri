"use client"

import { useState } from "react"
import type { WizardImage } from "@/lib/wizardState"

async function fileToWizardImage(file: File): Promise<WizardImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(",")[1] ?? ""
      resolve({
        dataUrl,
        base64,
        mediaType: file.type as WizardImage["mediaType"],
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

type Props = {
  image: WizardImage | null
  onImageChange: (image: WizardImage | null) => void
}

export function Step1_Image({ image, onImageChange }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError(
        `画像ファイルを指定してください（${file.type || "種別不明"}）`,
      )
      return
    }
    setError(null)
    try {
      const img = await fileToWizardImage(file)
      onImageChange(img)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ""
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }
  function onDragLeave() {
    setDragOver(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }
  function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile()
        if (f) {
          handleFile(f)
          e.preventDefault()
          break
        }
      }
    }
  }
  function remove() {
    onImageChange(null)
    setError(null)
  }

  const border = dragOver
    ? "border-brand-yellow bg-amber-50"
    : image
      ? "border-zinc-200 bg-zinc-50"
      : "border-dashed border-zinc-300 bg-zinc-50"

  return (
    <div
      tabIndex={0}
      onPaste={onPaste}
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4 outline-none focus:ring-2 focus:ring-brand-yellow"
    >
      <div>
        <h2 className="text-base font-bold">STEP 1: 画像アップロード</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          ドラッグ&ドロップ / ファイル選択 / クリップボードから貼り付け（Cmd+V）対応。
          ※ このカードをクリックで focus させると Cmd+V が効きます
        </p>
      </div>

      {image ? (
        <div className="space-y-3">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.dataUrl}
              alt="アップロード画像"
              className="max-h-[400px] max-w-full object-contain rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={remove}
              className="rounded-md border border-zinc-300 bg-white text-zinc-700 text-xs font-bold px-3 py-2 hover:bg-zinc-50"
            >
              画像を削除
            </button>
            <label className="rounded-md border border-zinc-300 bg-white text-zinc-700 text-xs font-bold px-3 py-2 hover:bg-zinc-50 cursor-pointer">
              別の画像を選択
              <input
                type="file"
                accept="image/*"
                onChange={onChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`rounded-md border-2 ${border} p-10 text-center transition`}
        >
          <p className="text-sm text-zinc-700 mb-1 font-bold">
            ここに画像をドラッグ&ドロップ
          </p>
          <p className="text-[11px] text-zinc-500 mb-4">
            または Cmd+V でコピー画像を貼り付け
          </p>
          <label className="inline-block rounded-md bg-brand-yellow text-black text-sm font-bold px-4 py-2 cursor-pointer hover:brightness-95 transition">
            ファイルを選択
            <input
              type="file"
              accept="image/*"
              onChange={onChange}
              className="hidden"
            />
          </label>
          <p className="text-[10px] text-zinc-400 mt-4">
            jpg / png / webp / gif 対応
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
