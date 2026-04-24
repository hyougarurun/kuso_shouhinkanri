"use client"

import { useEffect, useRef, useState } from "react"

const STORAGE_KEY = "kuso:home:memo"

export function HomeMemo() {
  const [text, setText] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STORAGE_KEY) ?? ""
    // 初回マウント時に localStorage の永続値を反映するための同期（hydration 後）。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(stored)
    setHydrated(true)
  }, [])

  function handleChange(value: string) {
    setText(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, value)
        setSavedAt(Date.now())
      } catch {
        // quota 超え等はサイレント
      }
    }, 300)
  }

  useEffect(() => {
    return () => {
      // unmount 時に未保存分を flush
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        try {
          localStorage.setItem(STORAGE_KEY, text)
        } catch {
          // noop
        }
      }
    }
  }, [text])

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm space-y-1.5">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-zinc-700">
          📝 メモ <span className="text-[10px] font-normal text-zinc-400">（自動保存）</span>
        </h2>
        {savedAt && (
          <span className="text-[10px] text-zinc-400">
            保存: {new Date(savedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
      <textarea
        value={hydrated ? text : ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="タスク・気になっていること・買うものメモなど自由に。"
        rows={10}
        className="w-full text-[12px] font-mono leading-relaxed border border-zinc-200 rounded p-2 resize-y focus:outline-none focus:ring-2 focus:ring-brand-yellow"
      />
    </section>
  )
}
