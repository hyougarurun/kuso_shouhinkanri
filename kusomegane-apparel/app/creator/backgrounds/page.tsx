"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { SuggestiveInput } from "@/components/SuggestiveInput"

type Background = {
  id: string
  storagePath: string
  signedUrl: string
  mimeType: string
  width?: number
  height?: number
  prompt: string
  model: string
  quality: string
  title: string
  isFavorite: boolean
  createdAt: string
}

const SIZE_OPTIONS = [
  { value: "1024x1024", label: "1024×1024 (最安)" },
  { value: "1536x1536", label: "1536×1536 (中)" },
  { value: "2048x2048", label: "2048×2048 (推奨・作画サイズ)" },
  { value: "2560x2560", label: "2560×2560 (大)" },
]

const QUALITY_OPTIONS = [
  { value: "low", label: "Low (~$0.01・実験用)" },
  { value: "medium", label: "Medium (~$0.05)" },
  { value: "high", label: "High (~$0.2・推奨)" },
]

export default function CreatorBackgroundsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [promptExtra, setPromptExtra] = useState("")
  const [promptMode, setPromptMode] = useState<"append" | "replace">("append")
  const [title, setTitle] = useState("")
  const [size, setSize] = useState("2048x2048")
  const [quality, setQuality] = useState("high")
  const [keepSource, setKeepSource] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [backgrounds, setBackgrounds] = useState<Background[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyFavorite, setOnlyFavorite] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const zoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = file ? URL.createObjectURL(file) : ""
    setPreview(url)
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    refresh()
  }, [])

  // paste 対応（画像 UP の標準）
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return
      for (const it of e.clipboardData.items) {
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile()
          if (f) {
            e.preventDefault()
            setFile(f)
            return
          }
        }
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch("/api/creator/backgrounds/list")
      if (!res.ok) throw new Error("履歴取得失敗")
      const j = await res.json()
      setBackgrounds(j.backgrounds ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  async function generate() {
    if (!file) return
    setGenerating(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("prompt", promptExtra)
      form.append("promptMode", promptMode)
      form.append("size", size)
      form.append("quality", quality)
      form.append("title", title)
      if (keepSource) form.append("keepSource", "1")

      const res = await fetch("/api/creator/backgrounds/generate", {
        method: "POST",
        body: form,
      })
      const j = await res.json()
      if (!res.ok || j.error) {
        throw new Error(j.error || `生成失敗 (HTTP ${res.status})`)
      }
      setFile(null)
      setTitle("")
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  async function toggleFavorite(bg: Background) {
    const res = await fetch(`/api/creator/backgrounds/${bg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !bg.isFavorite }),
    })
    if (res.ok) refresh()
  }

  async function remove(bg: Background) {
    if (!confirm(`「${bg.title || bg.id.slice(0, 8)}」を削除しますか？`)) return
    const res = await fetch(`/api/creator/backgrounds/${bg.id}`, { method: "DELETE" })
    if (res.ok) refresh()
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = Array.from(e.dataTransfer.files).find((x) =>
      x.type.startsWith("image/"),
    )
    if (f) setFile(f)
  }

  const displayed = useMemo(() => {
    return onlyFavorite ? backgrounds.filter((b) => b.isFavorite) : backgrounds
  }, [backgrounds, onlyFavorite])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-bold">背景生成アシスタント</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          外部画像 → GPT-image-2 で KUSOMEGANE 作者風の背景イラストに変換
          · 既定 2048×2048 / High 品質（~$0.2/枚）
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {/* 左: 入力 */}
        <section className="col-span-1 bg-white rounded-lg border border-zinc-200 p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold">入力</h2>

          <div
            ref={zoneRef}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={
              "rounded-md border-2 border-dashed p-3 text-center transition " +
              (dragOver
                ? "border-brand-yellow bg-amber-50"
                : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100")
            }
          >
            <input
              id="bg-file-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0])
                e.target.value = ""
              }}
              className="hidden"
            />
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="source"
                  className="w-full aspect-square object-contain rounded bg-white"
                />
                <button
                  onClick={() => setFile(null)}
                  disabled={generating}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                >
                  ×
                </button>
              </div>
            ) : (
              <label htmlFor="bg-file-input" className="cursor-pointer block py-6">
                <p className="text-xs text-zinc-700 font-semibold">
                  クリック / DnD / <kbd className="px-1 bg-white border border-zinc-300 rounded text-[10px]">⌘V</kbd>
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">PNG / JPEG / WebP</p>
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              タイトル（任意）
            </label>
            <SuggestiveInput
              historyKey="creator.bg.title"
              value={title}
              onChange={setTitle}
              placeholder="例: 公園・夕焼け"
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-700">
                {promptMode === "append" ? "追加指示（任意）" : "プロンプト（完全上書き）"}
              </label>
              <div className="inline-flex rounded-md bg-zinc-100 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPromptMode("append")}
                  className={
                    "px-2 py-0.5 rounded " +
                    (promptMode === "append"
                      ? "bg-white text-zinc-900 shadow-sm font-bold"
                      : "text-zinc-500")
                  }
                >
                  既定+追加
                </button>
                <button
                  type="button"
                  onClick={() => setPromptMode("replace")}
                  className={
                    "px-2 py-0.5 rounded " +
                    (promptMode === "replace"
                      ? "bg-white text-zinc-900 shadow-sm font-bold"
                      : "text-zinc-500")
                  }
                >
                  完全上書き
                </button>
              </div>
            </div>
            <SuggestiveInput
              historyKey="creator.bg.promptExtra"
              value={promptExtra}
              onChange={setPromptExtra}
              placeholder={
                promptMode === "append"
                  ? "例: 夕焼け寄せて / 線画強調 / 明るく"
                  : "例: flat vector landscape illustration, soft lighting, no humans"
              }
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            />
            {promptMode === "replace" && (
              <p className="text-[10px] text-amber-700 mt-1">
                ⚠ 既定プロンプトを使わず、ここに書いた文字列だけでリクエストします。
                safety 回避用の脱出口。
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                サイズ
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                disabled={generating}
                className="w-full text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
              >
                {SIZE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                品質
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                disabled={generating}
                className="w-full text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
              >
                {QUALITY_OPTIONS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={keepSource}
              onChange={(e) => setKeepSource(e.target.checked)}
            />
            元画像も Storage に保存（後から参照可能）
          </label>

          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-800">
            GPT-image-2 に「KUSOMEGANE 作者風のイラストに変換」を指示します。
            2048×2048 High = 1 枚 ~$0.2（約 30 円）。10〜30 秒かかります。
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={generating || !file}
            className="w-full rounded-md bg-brand-yellow text-black text-sm font-bold py-2.5 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {generating ? "生成中…（10〜30 秒）" : "🎨 KUSOMEGANE 作者風に変換"}
          </button>
        </section>

        {/* 右: 履歴 */}
        <section className="col-span-2 bg-white rounded-lg border border-zinc-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">履歴 {backgrounds.length > 0 && `(${backgrounds.length})`}</h2>
            <label className="inline-flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={onlyFavorite}
                onChange={(e) => setOnlyFavorite(e.target.checked)}
              />
              お気に入りのみ
            </label>
          </div>

          {loading ? (
            <div className="text-center text-sm text-zinc-500 py-8">読み込み中...</div>
          ) : displayed.length === 0 ? (
            <div className="text-center text-sm text-zinc-500 py-8">
              生成結果がまだありません
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {displayed.map((bg) => (
                <div
                  key={bg.id}
                  className="flex flex-col bg-white rounded-lg border border-zinc-200 overflow-hidden hover:shadow-md transition"
                >
                  <div className="relative aspect-square bg-zinc-100">
                    {bg.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bg.signedUrl}
                        alt={bg.title || bg.id}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
                        No Image
                      </div>
                    )}
                    <button
                      onClick={() => toggleFavorite(bg)}
                      className={
                        "absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm transition " +
                        (bg.isFavorite
                          ? "bg-yellow-400 text-black"
                          : "bg-white/80 text-zinc-400 hover:text-yellow-600")
                      }
                    >
                      ★
                    </button>
                  </div>
                  <div className="p-2 text-xs space-y-1">
                    {bg.title && (
                      <div className="font-bold text-zinc-900 truncate">
                        {bg.title}
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-500 truncate">
                      {bg.width}×{bg.height} · {bg.quality}
                    </div>
                    <div className="flex gap-1 pt-1">
                      <a
                        href={bg.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-[10px] text-center bg-zinc-100 hover:bg-zinc-200 rounded px-2 py-1 font-semibold text-zinc-700"
                      >
                        DL
                      </a>
                      <button
                        onClick={() => remove(bg)}
                        className="text-[10px] bg-red-50 hover:bg-red-100 rounded px-2 py-1 font-semibold text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
