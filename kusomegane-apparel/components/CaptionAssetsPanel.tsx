"use client"

import { useEffect, useRef, useState } from "react"
import type { CaptionAsset } from "@/types"
import {
  deriveLabel,
  groupByCategory,
  listCategories,
} from "@/lib/captionAssets/format"

interface Props {
  /** body を受けて親 textarea に挿入するコールバック。未指定ならクリップボードコピーのみ */
  onInsert?: (body: string) => void
}

export function CaptionAssetsPanel({ onInsert }: Props) {
  const [assets, setAssets] = useState<CaptionAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")
  const [draftBody, setDraftBody] = useState("")
  const [draftCategory, setDraftCategory] = useState("")
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("__all__")
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // プレビュー（選択中アセット）の編集 state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [editBody, setEditBody] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [updating, setUpdating] = useState(false)
  const [previewCopied, setPreviewCopied] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/caption-assets")
      const j = await res.json()
      if (!res.ok || j.error) throw new Error(j.error ?? `HTTP ${res.status}`)
      setAssets(j.assets as CaptionAsset[])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save() {
    if (!draftBody.trim()) {
      alert("本文は必須です")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/caption-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draftLabel.trim(),
          body: draftBody,
          category: draftCategory.trim(),
        }),
      })
      const j = await res.json()
      if (!res.ok || j.error) throw new Error(j.error ?? `HTTP ${res.status}`)
      setAssets((prev) => [j.asset as CaptionAsset, ...prev])
      setDraftLabel("")
      setDraftBody("")
      setDraftCategory("")
      setAdding(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("この文言アセットを削除しますか？")) return
    try {
      const res = await fetch(`/api/caption-assets/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      setAssets((prev) => prev.filter((a) => a.id !== id))
      if (selectedId === id) setSelectedId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  async function selectAsset(asset: CaptionAsset) {
    setSelectedId(asset.id)
    setEditLabel(asset.label)
    setEditBody(asset.body)
    setEditCategory(asset.category)
    setPreviewCopied(false)
    // クリックと同時にコピーも実行（既存挙動を維持）
    try {
      await navigator.clipboard.writeText(asset.body)
      setCopiedId(asset.id)
      setTimeout(() => setCopiedId((v) => (v === asset.id ? null : v)), 1200)
    } catch {
      // ignore
    }
  }

  async function copyFromPreview() {
    try {
      await navigator.clipboard.writeText(editBody)
      setPreviewCopied(true)
      setTimeout(() => setPreviewCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  async function updatePreview() {
    if (!selectedId) return
    if (!editBody.trim()) {
      alert("本文は必須です")
      return
    }
    setUpdating(true)
    try {
      const res = await fetch(`/api/caption-assets/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editLabel.trim(),
          body: editBody,
          category: editCategory,
        }),
      })
      const j = await res.json()
      if (!res.ok || j.error) throw new Error(j.error ?? `HTTP ${res.status}`)
      const updated = j.asset as CaptionAsset
      // updated_at desc を維持するため先頭に持ってくる
      setAssets((prev) => [updated, ...prev.filter((a) => a.id !== updated.id)])
      setEditLabel(updated.label)
      setEditBody(updated.body)
      setEditCategory(updated.category)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setUpdating(false)
    }
  }

  const categories = listCategories(assets)
  const filtered =
    filterCategory === "__all__"
      ? assets
      : assets.filter((a) => a.category === filterCategory)
  const grouped = groupByCategory(filtered)
  const selected = selectedId ? assets.find((a) => a.id === selectedId) : null

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] font-bold text-zinc-700">
          文言アセット{" "}
          <span className="text-[10px] font-normal text-zinc-500">
            （クリックでコピー＋右にプレビュー）
          </span>
        </div>
        <div className="flex gap-1 items-center">
          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-[10px] border border-zinc-300 rounded px-1 py-0.5 bg-white"
            >
              <option value="__all__">全カテゴリ</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => {
              setAdding((v) => !v)
              if (!adding) {
                setTimeout(() => bodyRef.current?.focus(), 0)
              }
            }}
            className="text-[10px] font-bold bg-white border border-zinc-300 hover:bg-zinc-100 rounded px-2 py-0.5"
          >
            {adding ? "閉じる" : "+ 追加"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[10px] text-red-700 bg-red-50 border border-red-200 rounded p-1.5">
          {error}
        </div>
      )}

      {adding && (
        <div className="bg-white rounded border border-zinc-300 p-2 space-y-1.5">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">
              ラベル（任意・空なら本文先頭 20 文字を自動表示）
            </label>
            <input
              type="text"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder={
                draftBody ? `自動: ${deriveLabel(draftBody, "")}` : "例: 期間限定"
              }
              className="w-full text-[11px] border border-zinc-300 rounded px-1.5 py-1"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">
              本文（必須・コピー時はこれが入る）
            </label>
            <textarea
              ref={bodyRef}
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={3}
              placeholder="※※※※期間限定×数量限定です※※※※※"
              className="w-full text-[11px] font-mono border border-zinc-300 rounded px-1.5 py-1 resize-y"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">
              カテゴリ（任意・既存から補完可）
            </label>
            <input
              type="text"
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              list="caption-asset-categories"
              placeholder="例: 販売条件 / 配送 / 注意書き"
              className="w-full text-[11px] border border-zinc-300 rounded px-1.5 py-1"
            />
            <datalist id="caption-asset-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex gap-1 justify-end">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setDraftLabel("")
                setDraftBody("")
                setDraftCategory("")
              }}
              className="text-[10px] bg-white border border-zinc-300 hover:bg-zinc-50 rounded px-2 py-0.5"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !draftBody.trim()}
              className="text-[10px] font-bold bg-brand-yellow text-black rounded px-2 py-0.5 hover:brightness-95 disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* 左: 一覧 */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {loading && assets.length === 0 ? (
            <div className="text-[10px] text-zinc-500 py-2 text-center">
              読み込み中…
            </div>
          ) : assets.length === 0 ? (
            <div className="text-[10px] text-zinc-500 py-2 text-center">
              アセットは未登録です。「+ 追加」から登録してください。
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.category || "__none__"}>
                <div className="text-[10px] font-bold text-zinc-500 mb-0.5">
                  {g.category || "（未分類）"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.items.map((a) => {
                    const selectedNow = a.id === selectedId
                    return (
                      <div
                        key={a.id}
                        className={`group relative inline-flex items-stretch bg-white border rounded overflow-hidden transition ${
                          selectedNow
                            ? "border-amber-400 ring-1 ring-amber-300"
                            : "border-zinc-300 hover:border-amber-400"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => selectAsset(a)}
                          title={a.body}
                          className="text-left text-[10px] px-2 py-1 max-w-[200px]"
                        >
                          <div className="font-bold text-zinc-800 truncate">
                            {copiedId === a.id ? "✓ コピー" : a.label}
                          </div>
                          <div className="text-[9px] text-zinc-500 truncate">
                            {a.body.replace(/\s+/g, " ").slice(0, 30)}
                          </div>
                        </button>
                        {onInsert && (
                          <button
                            type="button"
                            onClick={() => onInsert(a.body)}
                            title="編集中のキャプションに挿入"
                            className="border-l border-zinc-200 px-1.5 text-[10px] hover:bg-amber-50"
                          >
                            ↩
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(a.id)}
                          title="削除"
                          className="border-l border-zinc-200 px-1.5 text-[10px] text-zinc-400 hover:text-red-600 hover:bg-red-50"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 右: プレビュー / 編集 */}
        <div className="bg-white rounded border border-zinc-200 p-2 space-y-1.5 min-h-[200px]">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-1">
                <div className="text-[10px] font-bold text-zinc-500">
                  プレビュー / 編集
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-700 px-1"
                  title="閉じる"
                >
                  ×
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">
                  ラベル
                </label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full text-[11px] border border-zinc-300 rounded px-1.5 py-1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">
                  本文
                </label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={6}
                  className="w-full text-[11px] font-mono border border-zinc-300 rounded px-1.5 py-1 resize-y leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">
                  カテゴリ
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  list="caption-asset-categories"
                  className="w-full text-[11px] border border-zinc-300 rounded px-1.5 py-1"
                />
              </div>
              <div className="flex gap-1 justify-end pt-1">
                <button
                  type="button"
                  onClick={copyFromPreview}
                  className="text-[10px] bg-white border border-zinc-300 hover:bg-zinc-50 rounded px-2 py-0.5"
                >
                  {previewCopied ? "✓ コピー" : "📋 コピー"}
                </button>
                <button
                  type="button"
                  onClick={updatePreview}
                  disabled={updating || !editBody.trim()}
                  className="text-[10px] font-bold bg-brand-yellow text-black rounded px-2 py-0.5 hover:brightness-95 disabled:opacity-50"
                >
                  {updating ? "上書き中…" : "上書き保存"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-[10px] text-zinc-400 py-12 text-center">
              左のボタンを押すと
              <br />
              ここにプレビュー＆編集枠が出ます
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
