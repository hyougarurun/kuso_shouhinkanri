"use client"

import { useEffect, useState } from "react"
import { Product } from "@/types"

type Props = {
  product?: Product
  /** 新規: text 単独渡しも後方互換で受ける */
  text?: string
  onUpdate?: (captionText: string) => void
}

export function CaptionBlock({ product, text, onUpdate }: Props) {
  const initial = product?.captionText ?? text ?? ""
  const [draft, setDraft] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 親の captionText が変わった（他操作含む）時の同期
  useEffect(() => {
    if (!editing) setDraft(initial)
  }, [initial, editing])

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  function save() {
    if (onUpdate) onUpdate(draft)
    setEditing(false)
  }

  function cancel() {
    setDraft(initial)
    setEditing(false)
  }

  async function regenerate() {
    if (!product || !onUpdate) return
    if (!confirm("現在のキャプションを AI で再生成します。上書きしてよいですか？")) return
    setRegenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, analysis: null }),
      })
      const json = await res.json()
      if (!res.ok || !json.caption) {
        throw new Error(json.error ?? `再生成失敗 (HTTP ${res.status})`)
      }
      setDraft(json.caption)
      onUpdate(json.caption)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRegenerating(false)
    }
  }

  const canEdit = !!onUpdate
  const canRegenerate = !!onUpdate && !!product

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] font-bold text-zinc-700">
          商品概要キャプション
        </div>
        <div className="flex gap-1">
          {canRegenerate && !editing && (
            <button
              type="button"
              onClick={regenerate}
              disabled={regenerating}
              className="rounded-md border border-zinc-300 bg-white text-[11px] font-bold text-zinc-700 px-2 py-1 hover:bg-zinc-50 disabled:opacity-50"
              title="Claude でキャプションを作り直す"
            >
              {regenerating ? "生成中…" : "🔄 再生成"}
            </button>
          )}
          {canEdit && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-zinc-300 bg-white text-[11px] font-bold text-zinc-700 px-2 py-1 hover:bg-zinc-50"
            >
              ✏ 編集
            </button>
          )}
          {editing && (
            <>
              <button
                type="button"
                onClick={cancel}
                className="rounded-md border border-zinc-300 bg-white text-[11px] font-bold text-zinc-700 px-2 py-1 hover:bg-zinc-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-md bg-brand-yellow text-black text-[11px] font-bold px-2 py-1 hover:brightness-95"
              >
                保存
              </button>
            </>
          )}
          <button
            type="button"
            onClick={copy}
            disabled={!draft}
            className="rounded-md bg-black text-white text-[11px] font-bold px-2 py-1 disabled:opacity-50"
          >
            {copied ? "コピー済" : "コピー"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          className="w-full text-[11px] font-mono bg-zinc-50 p-2 rounded border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow whitespace-pre-wrap"
        />
      ) : draft ? (
        <pre className="whitespace-pre-wrap text-[11px] font-mono bg-zinc-50 p-2 rounded max-h-60 overflow-y-auto">
          {draft}
        </pre>
      ) : (
        <div className="text-[12px] text-zinc-500 py-2">
          キャプション未生成
          {canRegenerate && "（「🔄 再生成」で AI 生成）"}
        </div>
      )}
    </div>
  )
}
