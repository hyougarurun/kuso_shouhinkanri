"use client"

import { useState, useEffect } from "react"

interface Props {
  index: number
  initialText: string
  onRegenerate?: () => void
  regenerating?: boolean
}

export function CaptionResultCard({
  index,
  initialText,
  onRegenerate,
  regenerating,
}: Props) {
  const [text, setText] = useState(initialText)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setText(initialText)
  }, [initialText])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // noop
    }
  }

  const charCount = text.length

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-500">
          Result #{index + 1}
        </span>
        <span className="text-[10px] text-zinc-400">{charCount} 字</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full text-sm border border-zinc-300 rounded px-2 py-2 bg-white resize-y leading-relaxed"
      />
      <div className="flex gap-2">
        <button
          onClick={copy}
          className="text-[11px] bg-zinc-100 hover:bg-zinc-200 rounded px-3 py-1.5 font-semibold text-zinc-700"
        >
          {copied ? "✓ コピーしました" : "📋 コピー"}
        </button>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="text-[11px] bg-zinc-100 hover:bg-zinc-200 rounded px-3 py-1.5 font-semibold text-zinc-700 disabled:opacity-50"
          >
            {regenerating ? "再生成中…" : "🔄 再生成"}
          </button>
        )}
      </div>
    </div>
  )
}
