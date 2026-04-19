"use client"

import { useState } from "react"
import { v4 as uuid } from "uuid"
import { Product, DriveFile } from "@/types"

type Props = {
  product: Product
  onUpdate: (next: Product) => void
}

export function DriveStorageSection({ product, onUpdate }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const files = product.driveFiles ?? []

  function addFiles(fileList: FileList | File[]) {
    const now = new Date().toISOString()
    const newFiles: DriveFile[] = Array.from(fileList).map((f) => ({
      id: uuid(),
      name: f.name,
      mimeType: f.type || "application/octet-stream",
      sizeBytes: f.size,
      uploadedAt: now,
    }))
    onUpdate({
      ...product,
      driveFiles: [...files, ...newFiles],
      updatedAt: now,
    })
  }

  function removeFile(id: string) {
    onUpdate({
      ...product,
      driveFiles: files.filter((f) => f.id !== id),
      updatedAt: new Date().toISOString(),
    })
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }
  function onDragLeave() {
    setDragOver(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files)
    // input をリセットして同じファイル再選択を可能に
    e.target.value = ""
  }

  function formatSize(bytes?: number): string {
    if (bytes === undefined) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">Drive 添付ファイル</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            フォルダ <code className="bg-zinc-100 px-1">{product.productNumber}/</code>{" "}
            に格納（.ai / .psd / .png / .jpg / .pdf / .zip 等すべて対応）
          </p>
        </div>
        {files.length > 0 && (
          <span className="text-[10px] font-bold text-lime-800 bg-lime-50 border border-lime-300 rounded px-2 py-0.5">
            {files.length} ファイル格納済み
          </span>
        )}
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={
          "rounded-md border-2 border-dashed p-5 text-center transition " +
          (dragOver
            ? "border-lime-400 bg-lime-50"
            : "border-zinc-300 bg-zinc-50")
        }
      >
        <p className="text-xs text-zinc-600 mb-2">
          ファイルをドラッグ&ドロップ、または
        </p>
        <input
          type="file"
          multiple
          onChange={onChange}
          className="text-xs w-full file:mr-2 file:rounded file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 file:text-xs file:font-bold hover:file:bg-zinc-300"
        />
        <p className="text-[10px] text-zinc-400 mt-2">
          ※ Phase 1.5 で Google Drive へ自動アップロード。現在はローカル記録のみ
        </p>
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-md">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 p-2 text-xs">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{f.name}</div>
                <div className="text-[10px] text-zinc-500">
                  {f.mimeType}
                  {f.sizeBytes !== undefined && ` · ${formatSize(f.sizeBytes)}`}
                  {" · "}
                  {new Date(f.uploadedAt).toLocaleDateString("ja-JP")}
                </div>
              </div>
              {f.webViewLink && (
                <a
                  href={f.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  開く
                </a>
              )}
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="text-[11px] text-zinc-400 hover:text-red-600 px-1"
                aria-label="削除"
                title="削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
