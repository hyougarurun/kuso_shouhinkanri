"use client"

import { useState } from "react"

export function CaptionBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  if (!text) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 text-[12px] text-zinc-500">
        キャプション未生成
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-zinc-700">
          商品概要キャプション
        </div>
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-black text-white text-[11px] font-bold px-2 py-1"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-[11px] font-mono bg-zinc-50 p-2 rounded max-h-60 overflow-y-auto">
        {text}
      </pre>
    </div>
  )
}
