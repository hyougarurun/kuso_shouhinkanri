"use client"

import { useRef, useState } from "react"
import { ImageAnalysis } from "@/types"
import { resizeImage } from "@/lib/imageResize"
import { WizardImage } from "@/lib/wizardState"

export function StepA_ImageUpload({
  image,
  analysis,
  onImageChange,
  onAnalysisChange,
}: {
  image: WizardImage | null
  analysis: ImageAnalysis | null
  onImageChange: (img: WizardImage | null) => void
  onAnalysisChange: (a: ImageAnalysis | null) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    try {
      const resized = await resizeImage(file)
      onImageChange({
        dataUrl: resized.dataUrl,
        base64: resized.base64,
        mediaType: resized.mediaType,
      })
      onAnalysisChange(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function runAnalysis() {
    if (!image) return
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ base64: image.base64, mediaType: image.mediaType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "解析に失敗しました")
        return
      }
      onAnalysisChange(data.analysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-zinc-900">STEP A: 画像アップロード</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          商品の合成画像（白背景）をアップロードしてください。PNG / JPG 対応。
        </p>
      </div>

      {/* ドロップゾーン */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) await handleFile(file)
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          dragging ? "border-brand-yellow bg-yellow-50" : "border-zinc-300 bg-white"
        }`}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.dataUrl}
            alt="アップロード画像"
            className="max-h-64 mx-auto rounded"
          />
        ) : (
          <div className="text-xs text-zinc-500 py-8">
            画像をここにドラッグ&ドロップ
            <br />
            またはクリックしてファイルを選択
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) await handleFile(file)
            e.target.value = ""
          }}
        />
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {image && (
        <button
          type="button"
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full rounded-lg bg-black text-white text-sm font-bold py-2 disabled:opacity-50"
        >
          {analyzing ? "解析中..." : "AI で画像を解析する"}
        </button>
      )}

      {analysis && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-[12px] space-y-1">
          <div className="font-bold text-zinc-900">AI 解析結果</div>
          <div>
            <span className="text-zinc-500">商品種別: </span>
            {analysis.productType}
          </div>
          <div>
            <span className="text-zinc-500">ボディカラー: </span>
            {analysis.bodyColor}
          </div>
          <div>
            <span className="text-zinc-500">デザイン要素: </span>
            {analysis.designElements}
          </div>
          <div>
            <span className="text-zinc-500">加工推定: </span>
            {analysis.processingHint}
          </div>
          <div>
            <span className="text-zinc-500">雰囲気: </span>
            {analysis.overallVibe}
          </div>
        </div>
      )}
    </div>
  )
}
