"use client"

import { useEffect, useState } from "react"
import { loadPresets, type Preset } from "@/lib/postCaption/presets"
import {
  MODEL_OPTIONS,
  DEFAULT_MODEL_ID,
  LENGTH_PRESETS,
  LENGTH_MIN,
  LENGTH_MAX,
  DEFAULT_LENGTH,
  TONE_OPTIONS,
  DEFAULT_TONE,
  type ModelId,
} from "@/lib/postCaption/constants"
import type { Tone } from "@/lib/postCaption/buildPrompt"
import { CaptionResultCard } from "@/components/post-caption/CaptionResultCard"

export default function CaptionsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [dragOver, setDragOver] = useState(false)

  const [presets, setPresets] = useState<Preset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>("")
  const [presetBody, setPresetBody] = useState("")

  const [situation, setSituation] = useState("")
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL_ID)
  const [targetLength, setTargetLength] = useState<number>(DEFAULT_LENGTH)
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE)

  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const list = loadPresets()
    setPresets(list)
    if (list.length > 0) {
      setSelectedPresetId(list[0].id)
      setPresetBody(list[0].body)
    }
  }, [])

  useEffect(() => {
    const found = presets.find((p) => p.id === selectedPresetId)
    if (found) setPresetBody(found.body)
  }, [selectedPresetId, presets])

  useEffect(() => {
    const url = file ? URL.createObjectURL(file) : ""
    setPreview(url)
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [file])

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

  async function generate() {
    if (!presetBody.trim()) {
      setError("指示文（プリセット本文）が空です")
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("presetBody", presetBody)
      form.append("situation", situation)
      form.append("targetLength", String(targetLength))
      form.append("tone", tone)
      form.append("model", model)
      form.append("count", "1")
      if (file) form.append("file", file)

      const res = await fetch("/api/post-captions/generate", {
        method: "POST",
        body: form,
      })
      const j = await res.json()
      if (!res.ok || j.error) {
        throw new Error(j.error || `生成失敗 (HTTP ${res.status})`)
      }
      setResults(j.captions as string[])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = Array.from(e.dataTransfer.files).find((x) =>
      x.type.startsWith("image/")
    )
    if (f) setFile(f)
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-bold">投稿キャプション生成</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          作画 + 状況メモ → AI で日記風キャプションを生成 · Phase C2（1件生成・Claude のみ）
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {/* 左: 入力 */}
        <section className="col-span-1 bg-white rounded-lg border border-zinc-200 p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold">入力</h2>

          <div
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
              id="caption-file-input"
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
              <label
                htmlFor="caption-file-input"
                className="cursor-pointer block py-4"
              >
                <p className="text-xs text-zinc-700 font-semibold">
                  作画を UP（任意）
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  クリック / DnD /{" "}
                  <kbd className="px-1 bg-white border border-zinc-300 rounded text-[10px]">
                    ⌘V
                  </kbd>
                </p>
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              プリセット
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              指示文（編集可）
            </label>
            <textarea
              value={presetBody}
              onChange={(e) => setPresetBody(e.target.value)}
              rows={3}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              状況メモ（箇条書き・任意）
            </label>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={5}
              placeholder={"例:\n- 朝寝坊\n- コーヒー切れてた\n- 雨"}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1 resize-y font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              モデル
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelId)}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
            >
              {MODEL_OPTIONS.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  disabled={m.provider !== "claude"}
                >
                  {m.label}
                  {m.provider !== "claude" ? "（未対応）" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              文字数: {targetLength} 字
            </label>
            <div className="flex gap-1 mb-1">
              {LENGTH_PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setTargetLength(n)}
                  className={
                    "flex-1 text-[11px] py-1 rounded border transition " +
                    (targetLength === n
                      ? "bg-brand-yellow border-amber-400 font-bold"
                      : "bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={LENGTH_MIN}
              max={LENGTH_MAX}
              step={50}
              value={targetLength}
              onChange={(e) => setTargetLength(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              文体
            </label>
            <div className="flex gap-3 text-xs">
              {TONE_OPTIONS.map((t) => (
                <label key={t.value} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="tone"
                    value={t.value}
                    checked={tone === t.value}
                    onChange={() => setTone(t.value as Tone)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={generating || !presetBody.trim()}
            className="w-full rounded-md bg-brand-yellow text-black text-sm font-bold py-2.5 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {generating ? "生成中…" : "✍️ 1件生成"}
          </button>
        </section>

        {/* 右: 結果 */}
        <section className="col-span-2 bg-white rounded-lg border border-zinc-200 p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold">
            結果 {results.length > 0 && `(${results.length})`}
          </h2>
          {results.length === 0 ? (
            <div className="text-center text-sm text-zinc-500 py-12">
              まだ生成結果がありません。左のフォームから生成してください。
              <br />
              <span className="text-[11px] text-zinc-400">
                Phase C3 で 3 件並列生成・各カード再生成に拡張予定
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((text, i) => (
                <CaptionResultCard key={i} index={i} initialText={text} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
