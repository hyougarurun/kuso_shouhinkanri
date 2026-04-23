"use client"

import { useEffect, useState } from "react"
import {
  CHARACTERS,
  getCharacter,
  type CharacterId,
} from "@/lib/postCaption/characters"
import {
  getCounter,
  setCounter,
  bumpCounter,
  type CounterKind,
} from "@/lib/postCaption/counters"
import { composeCaption } from "@/lib/postCaption/composeCaption"
import { resizeImage } from "@/lib/imageResize"
import {
  MODEL_OPTIONS,
  DEFAULT_MODEL_ID,
  LENGTH_PRESETS,
  LENGTH_MIN,
  LENGTH_MAX,
  type ModelId,
} from "@/lib/postCaption/constants"
import { CaptionResultCard } from "@/components/post-caption/CaptionResultCard"

const CLAUDE_MAX_BYTES = 3_500_000

async function shrinkForClaude(file: File): Promise<Blob> {
  const attempts: Array<{ maxSize: number; quality: number }> = [
    { maxSize: 1600, quality: 0.85 },
    { maxSize: 1280, quality: 0.8 },
    { maxSize: 1024, quality: 0.75 },
    { maxSize: 800, quality: 0.7 },
    { maxSize: 640, quality: 0.65 },
  ]
  let lastBlob: Blob | null = null
  for (const opt of attempts) {
    const resized = await resizeImage(file, { ...opt, forceJpeg: true })
    const blob = await (await fetch(resized.dataUrl)).blob()
    lastBlob = blob
    if (blob.size <= CLAUDE_MAX_BYTES) return blob
  }
  return lastBlob!
}

function CounterField({
  label,
  kind,
  value,
  onChange,
}: {
  label: string
  kind: CounterKind
  value: number | null
  onChange: (n: number | null) => void
}) {
  const [draft, setDraft] = useState<string>("")

  function commit() {
    const n = Number.parseInt(draft, 10)
    if (!Number.isFinite(n) || n < 0) {
      alert(`${label} は 0 以上の整数で入力してください`)
      return
    }
    try {
      setCounter(kind, n)
      onChange(n)
      setDraft("")
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  function bump() {
    try {
      const next = bumpCounter(kind)
      onChange(next)
    } catch {
      alert(`${label} は未設定です。まず初期値を入力してから「確定」してください。`)
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-700 mb-1">
        {label}（現在: {value == null ? "未設定" : value}）
      </label>
      <div className="flex gap-1">
        <input
          type="number"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={value == null ? "例: 143" : `上書きする値`}
          className="flex-1 text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
        />
        <button
          onClick={commit}
          className="text-[11px] bg-white border border-zinc-300 hover:bg-zinc-50 rounded px-2 py-1 font-semibold"
        >
          確定
        </button>
        <button
          onClick={bump}
          className="text-[11px] bg-white border border-zinc-300 hover:bg-zinc-50 rounded px-2 py-1 font-semibold"
          title="+1 自動採番"
        >
          +1
        </button>
      </div>
    </div>
  )
}

export default function CaptionsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [dragOver, setDragOver] = useState(false)

  const [characterId, setCharacterId] = useState<CharacterId>(
    CHARACTERS[0].id
  )
  const [title, setTitle] = useState("")
  const [episode, setEpisode] = useState<number | null>(null)
  const [postNo, setPostNo] = useState<number | null>(null)

  const [situation, setSituation] = useState("")
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL_ID)

  const [targetLength, setTargetLength] = useState<number>(
    CHARACTERS[0].defaultLength
  )

  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEpisode(getCounter("episode"))
    setPostNo(getCounter("postNo"))
  }, [])

  useEffect(() => {
    const c = getCharacter(characterId)
    if (c) setTargetLength(c.defaultLength)
  }, [characterId])

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
    if (!title.trim()) {
      setError("タイトルを入力してください")
      return
    }
    if (episode == null) {
      setError("話数を設定してください（手動入力 → 確定）")
      return
    }
    if (postNo == null) {
      setError("Post No. を設定してください（手動入力 → 確定）")
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("characterId", characterId)
      form.append("situation", situation)
      form.append("targetLength", String(targetLength))
      form.append("model", model)
      form.append("count", "1")
      if (file) {
        const blob = await shrinkForClaude(file)
        form.append("file", new File([blob], "caption-source.jpg", { type: "image/jpeg" }))
      }

      const res = await fetch("/api/post-captions/generate", {
        method: "POST",
        body: form,
      })
      const j = await res.json()
      if (!res.ok || j.error) {
        throw new Error(j.error || `生成失敗 (HTTP ${res.status})`)
      }
      const bodies = j.captions as string[]
      const composed = bodies.map((body) =>
        composeCaption({
          title: title.trim(),
          episode,
          characterId,
          body,
          postNo,
        })
      )
      setResults(composed)
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

  const currentCharacter = getCharacter(characterId)

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-bold">投稿キャプション生成</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          キャラ雛形 + 作画 + 状況メモ → AI で本文生成 → タイトル/Post No./タグをコード組み立て · Phase C2.1
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
              キャラ
            </label>
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value as CharacterId)}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
            >
              {CHARACTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}（{c.titleLabel}）
                </option>
              ))}
            </select>
            {currentCharacter && (
              <p className="text-[10px] text-zinc-500 mt-1 whitespace-pre-wrap">
                {currentCharacter.promptBody}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              タイトル（手動入力）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ダメージジーンズ病院で回復させメガネ"
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
            />
          </div>

          <CounterField
            label="話数"
            kind="episode"
            value={episode}
            onChange={setEpisode}
          />
          <CounterField
            label="Post No."
            kind="postNo"
            value={postNo}
            onChange={setPostNo}
          />

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
              step={10}
              value={targetLength}
              onChange={(e) => setTargetLength(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={generating || !title.trim() || episode == null || postNo == null}
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
