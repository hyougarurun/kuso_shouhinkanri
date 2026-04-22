"use client"

import { useEffect } from "react"
import { GalleryImage } from "@/types"

type Props = {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onChange: (next: number) => void
}

/**
 * ギャラリー拡大プレビュー。
 * - 背景クリック / × / ESC で閉じる
 * - ←/→ キー or 左右ボタンで前後の画像に切替
 * - 画像そのものはクリック素通り（閉じない）
 *
 * 既知の制約: gallery 内の画像は長辺 600px / JPEG q=0.7 に縮小保存されている
 * （LocalStorage 容量対策）。ここでの拡大も 600px が上限。
 */
export function GalleryLightbox({ images, index, onClose, onChange }: Props) {
  const current = images[index]
  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft" && hasPrev) onChange(index - 1)
      else if (e.key === "ArrowRight" && hasNext) onChange(index + 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, hasPrev, hasNext, onChange, onClose])

  if (!current) return null

  // GallerySection 側で signedUrl（フル解像度）を thumbDataUrl に差し込む設計。
  // なければ dataUrl（レガシー）にフォールバック。
  const imageSrc = current.thumbDataUrl ?? current.dataUrl ?? ""

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white text-2xl leading-none flex items-center justify-center"
      >
        ×
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onChange(index - 1)
          }}
          aria-label="前の画像"
          className="absolute left-3 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white text-3xl leading-none flex items-center justify-center"
        >
          ‹
        </button>
      )}

      <div
        className="flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={`gallery-${index + 1}`}
          className="max-w-[92vw] max-h-[82vh] object-contain rounded-md shadow-2xl bg-zinc-900"
        />
        <div className="text-white text-xs bg-black/60 rounded-full px-3 py-1">
          {index + 1} / {images.length}
        </div>
      </div>

      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onChange(index + 1)
          }}
          aria-label="次の画像"
          className="absolute right-3 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white text-3xl leading-none flex items-center justify-center"
        >
          ›
        </button>
      )}
    </div>
  )
}
