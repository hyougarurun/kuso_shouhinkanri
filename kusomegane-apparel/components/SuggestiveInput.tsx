"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  loadInputHistory,
  pushInputHistory,
  removeInputHistoryItem,
} from "@/lib/inputHistory"

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "list"
> & {
  /**
   * LocalStorage の保存キー（フィールドごとに一意。例: "baseModel.garmentColor"）
   * 同じキーは別画面でも履歴を共有する。
   */
  historyKey: string
  value: string
  onChange: (value: string) => void
  /**
   * 履歴に加えて datalist に出す追加候補。
   * 例: 請求書から抽出した実績ボディ型番一覧。重複は自動で排除される。
   */
  extraOptions?: Array<{ value: string; label?: string }>
}

/**
 * フリーテキスト入力 + 履歴サジェスト。
 * - HTML5 `<datalist>` でブラウザネイティブの補完
 * - blur 時に value を履歴に push
 * - ↓ ボタンで履歴一覧を表示し、項目ごとに × で個別削除可能
 */
export function SuggestiveInput({
  historyKey,
  value,
  onChange,
  onBlur,
  extraOptions,
  ...rest
}: Props) {
  const [history, setHistory] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const datalistId = useId()

  useEffect(() => {
    setHistory(loadInputHistory(historyKey))
  }, [historyKey])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener("mousedown", onClickOutside)
    return () => window.removeEventListener("mousedown", onClickOutside)
  }, [open])

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (e.target.value.trim() !== "") {
      pushInputHistory(historyKey, e.target.value)
      setHistory(loadInputHistory(historyKey))
    }
    onBlur?.(e)
  }

  function pickHistory(v: string) {
    onChange(v)
    setOpen(false)
  }

  function removeHistoryItem(v: string, e: React.MouseEvent) {
    e.stopPropagation()
    removeInputHistoryItem(historyKey, v)
    setHistory(loadInputHistory(historyKey))
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex">
        <input
          {...rest}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          list={datalistId}
          className={
            (rest.className ?? "") +
            (history.length > 0 ? " rounded-r-none" : "")
          }
        />
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            tabIndex={-1}
            title="入力履歴"
            className="px-1.5 border border-l-0 border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs rounded-r"
          >
            ▾
          </button>
        )}
      </div>

      {/* HTML5 datalist: タイプ中の自動補完（履歴 + 追加候補） */}
      <datalist id={datalistId}>
        {history.map((v) => (
          <option key={`h-${v}`} value={v} />
        ))}
        {(extraOptions ?? [])
          .filter((opt) => !history.includes(opt.value))
          .map((opt) => (
            <option key={`e-${opt.value}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </datalist>

      {/* ▾ クリックで開くカスタム履歴ポップオーバー（個別削除可能） */}
      {open && history.length > 0 && (
        <ul className="absolute z-30 right-0 mt-0.5 w-full max-h-48 overflow-y-auto bg-white border border-zinc-200 rounded shadow-md text-sm">
          {history.map((v) => (
            <li
              key={v}
              onClick={() => pickHistory(v)}
              className="flex items-center justify-between px-2 py-1 hover:bg-zinc-50 cursor-pointer"
            >
              <span className="truncate">{v}</span>
              <button
                type="button"
                onClick={(e) => removeHistoryItem(v, e)}
                className="ml-2 text-zinc-400 hover:text-red-600 text-xs px-1"
                title="この履歴を削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
