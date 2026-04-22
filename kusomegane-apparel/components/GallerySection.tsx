"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Product, GalleryImage } from "@/types"
import {
  deleteGalleryItemRemote,
  listGalleryRemote,
  reorderGalleryRemote,
  uploadGalleryFile,
} from "@/lib/galleryClient"

// 拡大表示時のみロード（初期バンドル削減）
const GalleryLightbox = dynamic(
  () => import("./GalleryLightbox").then((m) => m.GalleryLightbox),
  { ssr: false },
)

type Props = {
  product: Product
  onUpdate: (next: Product) => void
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 商品ギャラリー。
 *
 * 設計:
 * - 一覧表示: LocalStorage 内の `thumbDataUrl`（300px）で即描画（高速）
 * - 拡大表示: /api/products/[id]/gallery/list で取得した Signed URL（フル解像度 1920px）
 * - アップロード: フル解像度を Storage へ、300px サムネのみ LocalStorage へ
 * - 並び替え/削除: Storage と LocalStorage の両方を同期
 */
export function GallerySection({ product, onUpdate }: Props) {
  const gallery = useMemo(() => product.gallery ?? [], [product.gallery])

  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Signed URL (id → url)。遅延取得して lightbox でのフル画像表示に使う
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [fetchedUrls, setFetchedUrls] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchUrls() {
      if (gallery.length === 0) return
      // 全てが storagePath を持っていれば list API で signed URL 取得
      const hasAnyStorage = gallery.some((g) => g.storagePath)
      if (!hasAnyStorage) return
      try {
        const items = await listGalleryRemote(product.id)
        if (cancelled) return
        const map: Record<string, string> = {}
        for (const it of items) {
          map[it.id] = it.signedUrl
        }
        setSignedUrls(map)
      } catch {
        // URL 取得失敗してもサムネ表示は生きているので致命的ではない
      } finally {
        if (!cancelled) setFetchedUrls(true)
      }
    }
    fetchUrls()
    return () => {
      cancelled = true
    }
  }, [product.id, gallery])

  function commitGallery(next: GalleryImage[]) {
    const firstPreview =
      next[0]?.thumbDataUrl ?? next[0]?.dataUrl ?? null
    onUpdate({
      ...product,
      gallery: next,
      imagePreview: firstPreview ?? product.imagePreview ?? null,
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
        newImages.push(await uploadGalleryFile(product.id, f))
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

  async function removeAt(index: number) {
    const target = gallery[index]
    if (!target) return
    // Storage 側を先に消す（失敗してもローカルから消すのは OK とする）
    if (target.storagePath) {
      try {
        await deleteGalleryItemRemote(product.id, target.id)
      } catch {
        // サーバ側で既に無い等は無視
      }
    }
    const next = gallery.filter((_, i) => i !== index)
    commitGallery(next)
  }

  function moveItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return
    const next = [...gallery]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commitGallery(next)
    // サーバにも並び順を反映（失敗しても UI は先に更新済み）
    reorderGalleryRemote(
      product.id,
      next.filter((g) => g.storagePath).map((g) => g.id),
    ).catch(() => {})
  }

  function onCardDragStart(e: React.DragEvent<HTMLDivElement>, i: number) {
    e.dataTransfer.setData("text/kusomegane-gallery-index", String(i))
    e.dataTransfer.effectAllowed = "move"
    setDraggingIndex(i)
  }
  function onCardDragOver(e: React.DragEvent<HTMLDivElement>, i: number) {
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

  // Lightbox で表示する画像の URL。Signed URL があればフル、無ければサムネ。
  const lightboxImages: GalleryImage[] = useMemo(() => {
    return gallery.map((g) => {
      const full = signedUrls[g.id]
      if (full) return { ...g, thumbDataUrl: full } // lightbox は thumbDataUrl を参照するため注入
      // 旧 dataUrl（レガシー）がある場合はそれを使う
      if (g.dataUrl) return { ...g, thumbDataUrl: g.dataUrl }
      return g
    })
  }, [gallery, signedUrls])

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
            1 枚目がサムネ判定 · ドラッグで並び替え · Cmd+V で貼り付け · クリックで拡大
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
            const thumb = img.thumbDataUrl ?? img.dataUrl ?? signedUrls[img.id]
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
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={`gallery-${i}`}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-400">
                    読込中...
                  </div>
                )}
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
          <p className="text-xs text-blue-700 font-bold">アップロード中…</p>
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
              フル解像度（長辺 1920px）は Supabase に保存、サムネ 300px のみローカル
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {previewIndex !== null && lightboxImages[previewIndex] && (
        <GalleryLightbox
          images={lightboxImages}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onChange={(next) => setPreviewIndex(next)}
        />
      )}
    </div>
  )
}
