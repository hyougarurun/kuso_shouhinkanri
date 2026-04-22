"use client"

import { useState } from "react"
import { v4 as uuid } from "uuid"
import { Product, GalleryImage } from "@/types"
import { resizeImage } from "@/lib/imageResize"
import { GalleryLightbox } from "./GalleryLightbox"

type Props = {
  product: Product
  onUpdate: (next: Product) => void
}

async function fileToGalleryImage(file: File): Promise<GalleryImage> {
  // LocalStorage 容量対策: 長辺 600px、JPEG 強制、quality 0.7 に固定。
  // 1 枚あたり 30〜80 KB 程度に収める。
  const resized = await resizeImage(file, {
    maxSize: 600,
    quality: 0.7,
    forceJpeg: true,
  })
  const sizeEstimate = Math.floor(resized.base64.length * 0.75)
  return {
    id: uuid(),
    dataUrl: resized.dataUrl,
    mimeType: resized.mediaType,
    sizeBytes: sizeEstimate,
    addedAt: new Date().toISOString(),
  }
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function GallerySection({ product, onUpdate }: Props) {
  const gallery = product.gallery ?? []
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function commitGallery(next: GalleryImage[]) {
    const firstDataUrl = next[0]?.dataUrl ?? null
    onUpdate({
      ...product,
      gallery: next,
      // 1 枚目を商品カードのサムネとして使う
      imagePreview: firstDataUrl ?? product.imagePreview ?? null,
      updatedAt: new Date().toISOString(),
    })
  }

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (list.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const newImages: GalleryImage[] = []
      for (const f of list) {
        newImages.push(await fileToGalleryImage(f))
      }
      commitGallery([...gallery, ...newImages])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  function onDragOverZone(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }
  function onDragLeaveZone() {
    setDragOver(false)
  }
  function onDropZone(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }
  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ""
  }
  function onPasteZone(e: React.ClipboardEvent) {
    const files: File[] = []
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile()
        if (f) files.push(f)
      }
    }
    if (files.length) {
      addFiles(files)
      e.preventDefault()
    }
  }

  function removeAt(index: number) {
    const next = gallery.filter((_, i) => i !== index)
    commitGallery(next)
  }

  function moveItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return
    const next = [...gallery]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commitGallery(next)
  }

  function onCardDragStart(e: React.DragEvent<HTMLDivElement>, i: number) {
    e.dataTransfer.setData("text/kusomegane-gallery-index", String(i))
    e.dataTransfer.effectAllowed = "move"
    setDraggingIndex(i)
  }
  function onCardDragOver(e: React.DragEvent<HTMLDivElement>, i: number) {
    // ギャラリー間の並び替えドラッグでのみ動く
    if (!e.dataTransfer.types.includes("text/kusomegane-gallery-index")) return
    e.preventDefault()
    setOverIndex(i)
  }
  function onCardDrop(e: React.DragEvent<HTMLDivElement>, to: number) {
    const raw = e.dataTransfer.getData("text/kusomegane-gallery-index")
    if (!raw) return
    const from = parseInt(raw, 10)
    if (Number.isInteger(from)) moveItem(from, to)
    setDraggingIndex(null)
    setOverIndex(null)
  }
  function onCardDragEnd() {
    setDraggingIndex(null)
    setOverIndex(null)
  }

  return (
    <div
      tabIndex={0}
      onPaste={onPasteZone}
      className="bg-white rounded-lg shadow-sm p-3 space-y-3 outline-none focus:ring-2 focus:ring-brand-yellow"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm font-bold">ギャラリー（並び替え可）</div>
          <div className="text-[10px] text-zinc-500">
            1 枚目がサムネイル判定 · ドラッグで並び替え · Cmd+V で貼り付け
          </div>
        </div>
        {gallery.length > 0 && (
          <div className="text-[11px] text-zinc-500">{gallery.length} 枚</div>
        )}
      </div>

      {gallery.length > 0 && (
        <div className="grid grid-cols-6 gap-2">
          {gallery.map((img, i) => {
            const isDragging = draggingIndex === i
            const isOver = overIndex === i && draggingIndex !== i
            return (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => onCardDragStart(e, i)}
                onDragOver={(e) => onCardDragOver(e, i)}
                onDrop={(e) => onCardDrop(e, i)}
                onDragEnd={onCardDragEnd}
                onClick={() => setPreviewIndex(i)}
                className={`relative aspect-square rounded-md overflow-hidden border bg-zinc-100 select-none cursor-zoom-in active:cursor-grabbing transition ${
                  isDragging
                    ? "opacity-30"
                    : isOver
                      ? "ring-2 ring-brand-yellow"
                      : "border-zinc-200"
                }`}
                title={
                  "クリックで拡大 / ドラッグで並び替え" +
                  (img.sizeBytes ? ` · ${formatSize(img.sizeBytes)}` : "")
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={`gallery-${i}`}
                  draggable={false}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] font-bold bg-brand-yellow text-black rounded px-1 py-0.5">
                    サムネ
                  </span>
                )}
                <span className="absolute top-1 right-1 text-[9px] font-bold bg-black/60 text-white rounded px-1 py-0.5">
                  {i + 1}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeAt(i)
                  }}
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[11px] flex items-center justify-center hover:bg-black/90"
                  aria-label="削除"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div
        onDragOver={onDragOverZone}
        onDragLeave={onDragLeaveZone}
        onDrop={onDropZone}
        className={`rounded-md border-2 border-dashed p-4 text-center transition ${
          uploading
            ? "border-blue-400 bg-blue-50"
            : dragOver
              ? "border-brand-yellow bg-amber-50"
              : "border-zinc-300 bg-zinc-50"
        }`}
      >
        {uploading ? (
          <p className="text-xs text-blue-700 font-bold">処理中…</p>
        ) : (
          <>
            <p className="text-xs text-zinc-700 mb-2">
              画像をドラッグ&ドロップ / ファイル選択 / Cmd+V
            </p>
            <label className="inline-block rounded-md bg-brand-yellow text-black text-xs font-bold px-3 py-1.5 cursor-pointer hover:brightness-95 transition">
              ファイルを選択
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileInputChange}
                className="hidden"
              />
            </label>
            <p className="text-[10px] text-zinc-400 mt-2">
              複数選択可 · 自動で長辺 800px に縮小 · 追加した順に並びます
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {previewIndex !== null && gallery[previewIndex] && (
        <GalleryLightbox
          images={gallery}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onChange={(next) => setPreviewIndex(next)}
        />
      )}
    </div>
  )
}
