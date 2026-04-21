"use client"

import { useEffect, useRef, useState } from "react"
import { SuggestiveInput } from "@/components/SuggestiveInput"

type Location = "front-center" | "front-left-chest" | "back-center" | "sleeve"
type Size = "small" | "medium" | "large"

const LOCATIONS: { value: Location; label: string }[] = [
  { value: "front-center", label: "胸中央" },
  { value: "front-left-chest", label: "左胸（ワッペン）" },
  { value: "back-center", label: "背面中央" },
  { value: "sleeve", label: "袖" },
]

const SIZES: { value: Size; label: string; hint: string }[] = [
  { value: "small", label: "小", hint: "〜10cm" },
  { value: "medium", label: "中", hint: "20〜25cm" },
  { value: "large", label: "大", hint: "35〜40cm" },
]

const MODEL_OPTIONS = [
  { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image (~$0.039/枚)" },
  { value: "gemini-2.5-flash-image-preview", label: "Gemini 2.5 Flash Image Preview" },
]

type Props = {
  open: boolean
  baseModelId: string | null
  baseThumbUrl?: string
  baseLabel?: string
  onClose: () => void
  onGenerated: () => void
}

export function CompositeDialog({
  open,
  baseModelId,
  baseThumbUrl,
  baseLabel,
  onClose,
  onGenerated,
}: Props) {
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [designPreview, setDesignPreview] = useState<string>("")
  const [dragOver, setDragOver] = useState(false)
  const [location, setLocation] = useState<Location>("front-center")
  const [size, setSize] = useState<Size>("medium")
  const [additionalPrompt, setAdditionalPrompt] = useState("")
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // paste サポート（ダイアログ開いてる間だけ window 全体で受け取る）
  useEffect(() => {
    if (!open) return
    function onWindowPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile()
          if (f) {
            e.preventDefault()
            setDesignFile(f)
            return
          }
        }
      }
    }
    window.addEventListener("paste", onWindowPaste)
    dialogRef.current?.focus()
    return () => window.removeEventListener("paste", onWindowPaste)
  }, [open])

  // プレビュー URL
  useEffect(() => {
    if (!designFile) {
      setDesignPreview("")
      return
    }
    const url = URL.createObjectURL(designFile)
    setDesignPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [designFile])

  if (!open || !baseModelId) return null

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setDesignFile(f)
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = Array.from(e.dataTransfer.files).find((x) =>
      x.type.startsWith("image/"),
    )
    if (f) setDesignFile(f)
  }

  async function submit() {
    if (!designFile) return
    setBusy(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("designFile", designFile)
      form.append("location", location)
      form.append("size", size)
      form.append("additionalPrompt", additionalPrompt)
      form.append("model", model)

      const res = await fetch(`/api/base-models/${baseModelId}/composite`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "unknown" }))
        throw new Error(j.error || "合成失敗")
      }
      onGenerated()
      onClose()
      setDesignFile(null)
      setAdditionalPrompt("")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto outline-none"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">🖼 デザイン合成</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              元画像: {baseLabel || baseModelId.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-zinc-500 hover:text-zinc-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {/* プレビュー: base + design */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-zinc-500 font-semibold mb-1">
                ベース
              </div>
              {baseThumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={baseThumbUrl}
                  alt="base"
                  className="w-full aspect-square object-contain rounded border border-zinc-200 bg-zinc-50"
                />
              ) : (
                <div className="w-full aspect-square rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center text-xs text-zinc-400">
                  No Image
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-semibold mb-1">
                デザイン（PNG 透過推奨）
              </div>
              {designPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={designPreview}
                    alt="design"
                    className="w-full aspect-square object-contain rounded border border-zinc-200 bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%),linear-gradient(-45deg,#f3f4f6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f3f4f6_75%),linear-gradient(-45deg,transparent_75%,#f3f4f6_75%)] [background-size:12px_12px] [background-position:0_0,0_6px,6px_-6px,-6px_0]"
                  />
                  <button
                    onClick={() => setDesignFile(null)}
                    disabled={busy}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={
                    "w-full aspect-square rounded border-2 border-dashed flex flex-col items-center justify-center text-center p-2 cursor-pointer transition " +
                    (dragOver
                      ? "border-brand-yellow bg-amber-50"
                      : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100")
                  }
                >
                  <input
                    id="composite-design-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onPickFile}
                    className="hidden"
                  />
                  <label
                    htmlFor="composite-design-input"
                    className="cursor-pointer block"
                  >
                    <p className="text-[11px] text-zinc-700 font-semibold leading-tight">
                      クリック / DnD / <kbd className="px-1 py-0.5 bg-white border border-zinc-300 rounded text-[10px]">⌘V</kbd>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      PNG/JPEG/WebP
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                配置
              </label>
              <div className="grid grid-cols-2 gap-1">
                {LOCATIONS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLocation(l.value)}
                    disabled={busy}
                    className={
                      "px-2 py-1.5 rounded text-xs font-semibold border transition " +
                      (location === l.value
                        ? "bg-brand-yellow text-black border-amber-400"
                        : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50")
                    }
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                サイズ
              </label>
              <div className="grid grid-cols-3 gap-1">
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSize(s.value)}
                    disabled={busy}
                    title={s.hint}
                    className={
                      "px-2 py-1.5 rounded text-xs font-semibold border transition " +
                      (size === s.value
                        ? "bg-brand-yellow text-black border-amber-400"
                        : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50")
                    }
                  >
                    <div>{s.label}</div>
                    <div className="text-[9px] font-normal opacity-75">
                      {s.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              追加指示（任意）
            </label>
            <SuggestiveInput
              historyKey="baseModel.compositeAdditional"
              value={additionalPrompt}
              onChange={setAdditionalPrompt}
              placeholder="例: やや斜めに / 色を少し褪せさせて / 刺繍風に"
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              モデル
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={busy}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-800">
            ベース画像の人物・背景・服を保ち、デザインだけ服の布地に合わせて合成します。透過 PNG 推奨。10〜30 秒かかります。
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 rounded disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={submit}
              disabled={busy || !designFile}
              className="px-4 py-1.5 text-sm bg-brand-yellow text-black font-bold rounded hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "生成中..." : "🖼 合成"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
