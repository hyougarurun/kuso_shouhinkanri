"use client"

import { useState } from "react"
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
  const [file, setFile] = useState<File | null>(null)
  const [gender, setGender] = useState<BaseModelGender>("male")
  const [pose, setPose] = useState<BaseModelPose>("front")
  const [garmentType, setGarmentType] = useState<BaseModelGarmentType>("crewneck")
  const [garmentColor, setGarmentColor] = useState("")
  const [backgroundColor, setBackgroundColor] = useState("")
  const [variantLabel, setVariantLabel] = useState("")
  const [sourceModel, setSourceModel] = useState("nano-banana-pro")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function submit() {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("gender", gender)
      form.append("pose", pose)
      form.append("garmentType", garmentType)
      form.append("garmentColor", garmentColor)
      form.append("backgroundColor", backgroundColor)
      form.append("variantLabel", variantLabel)
      form.append("sourceModel", sourceModel)
      const res = await fetch("/api/base-models/upload", {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "unknown" }))
        throw new Error(j.error || "アップロード失敗")
      }
      onUploaded()
      onClose()
      setFile(null)
      setVariantLabel("")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold">base モデル登録</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">画像ファイル *</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">バリアント名（任意）</label>
            <input
              type="text"
              value={variantLabel}
              onChange={(e) => setVariantLabel(e.target.value)}
              placeholder="例: #01"
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">生成モデル</label>
            <input
              type="text"
              value={sourceModel}
              onChange={(e) => setSourceModel(e.target.value)}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 rounded"
            >
              キャンセル
            </button>
            <button
              onClick={submit}
              disabled={uploading || !file}
              className="px-4 py-1.5 text-sm bg-brand-yellow text-black font-bold rounded hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "アップロード中..." : "登録"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
