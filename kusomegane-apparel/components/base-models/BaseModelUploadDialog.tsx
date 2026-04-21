"use client"

import { useEffect, useRef, useState } from "react"
import type {
  BaseModelGarmentType,
  BaseModelGender,
  BaseModelPose,
} from "@/types"

const GARMENT_OPTIONS: { value: BaseModelGarmentType; label: string }[] = [
  { value: "crewneck", label: "クルーネックスウェット" },
  { value: "hoodie", label: "プルオーバーパーカー" },
  { value: "tshirt", label: "Tシャツ" },
  { value: "longsleeve", label: "ロンT" },
]

type Props = {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}

export function BaseModelUploadDialog({ open, onClose, onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [gender, setGender] = useState<BaseModelGender>("male")
  const [pose, setPose] = useState<BaseModelPose>("front")
  const [garmentType, setGarmentType] = useState<BaseModelGarmentType>("crewneck")
  const [garmentColor, setGarmentColor] = useState("")
  const [backgroundColor, setBackgroundColor] = useState("")
  const [variantLabel, setVariantLabel] = useState("")
  const [sourceModel, setSourceModel] = useState("")
  const [uploading, setUploading] = useState(false)
  const [progressIdx, setProgressIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onWindowPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return
      const added: File[] = []
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile()
          if (f) added.push(f)
        }
      }
      if (added.length > 0) {
        e.preventDefault()
        addFiles(added)
      }
    }
    window.addEventListener("paste", onWindowPaste)
    dialogRef.current?.focus()
    return () => window.removeEventListener("paste", onWindowPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  if (!open) return null

  function addFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles])
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? [])
    if (list.length > 0) addFiles(list)
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    )
    if (dropped.length > 0) addFiles(dropped)
  }

  async function submit() {
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    setProgressIdx(0)
    try {
      for (let i = 0; i < files.length; i++) {
        setProgressIdx(i + 1)
        const f = files[i]
        const form = new FormData()
        form.append("file", f)
        form.append("gender", gender)
        form.append("pose", pose)
        form.append("garmentType", garmentType)
        form.append("garmentColor", garmentColor)
        form.append("backgroundColor", backgroundColor)
        // バリアントラベルが空 + 複数 → 自動連番
        const label =
          variantLabel && files.length > 1
            ? `${variantLabel}-${i + 1}`
            : variantLabel
        form.append("variantLabel", label)
        form.append("sourceModel", sourceModel)
        const res = await fetch("/api/base-models/upload", {
          method: "POST",
          body: form,
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({ error: "unknown" }))
          throw new Error(`${i + 1}/${files.length}: ${j.error || "アップロード失敗"}`)
        }
      }
      onUploaded()
      onClose()
      setFiles([])
      setVariantLabel("")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
      setProgressIdx(0)
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
          <h3 className="text-lg font-bold">base モデル登録</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="space-y-3">
          {/* ドロップゾーン */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={
              "rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition " +
              (dragOver
                ? "border-brand-yellow bg-amber-50"
                : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100")
            }
          >
            <input
              id="base-model-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={onPickFiles}
              className="hidden"
            />
            <label htmlFor="base-model-file-input" className="cursor-pointer block">
              <p className="text-sm text-zinc-700 font-semibold">
                クリックして選択 / ドラッグ&ドロップ / <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-xs">Cmd</kbd>+<kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-xs">V</kbd> でペースト
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                PNG / JPEG / WebP（複数可・10MB/枚まで）
              </p>
            </label>
          </div>

          {/* プレビュー */}
          {files.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-zinc-700 mb-1">
                {files.length} 枚 選択中
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {files.map((f, idx) => (
                  <div key={idx} className="relative aspect-[3/4] bg-zinc-100 rounded overflow-hidden border border-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previews[idx]}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(idx)}
                      disabled={uploading}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-[10px] leading-none hover:bg-black/80 disabled:opacity-50"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded">
                      {Math.round(f.size / 1024)}KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as BaseModelGender)}
                className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
              >
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">ポーズ</label>
              <select
                value={pose}
                onChange={(e) => setPose(e.target.value as BaseModelPose)}
                className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
              >
                <option value="front">前向き</option>
                <option value="back">振り返り背中</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">服の種類</label>
            <select
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value as BaseModelGarmentType)}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            >
              {GARMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">服の色</label>
              <input
                type="text"
                value={garmentColor}
                onChange={(e) => setGarmentColor(e.target.value)}
                placeholder="例: ブラック"
                className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">背景色</label>
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="例: マスタードイエロー"
                className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                ラベル（任意）
              </label>
              <input
                type="text"
                value={variantLabel}
                onChange={(e) => setVariantLabel(e.target.value)}
                placeholder="例: ポコポコメガネ"
                className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">出典モデル（任意）</label>
              <input
                type="text"
                value={sourceModel}
                onChange={(e) => setSourceModel(e.target.value)}
                placeholder="例: real-photo / nano-banana-pro"
                className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 gap-2">
            <div className="text-xs text-zinc-500">
              {uploading
                ? `アップロード中... ${progressIdx}/${files.length}`
                : files.length > 0
                  ? `${files.length} 枚を一括登録`
                  : ""}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={uploading}
                className="px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 rounded disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={submit}
                disabled={uploading || files.length === 0}
                className="px-4 py-1.5 text-sm bg-brand-yellow text-black font-bold rounded hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "アップロード中..." : `登録 (${files.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
