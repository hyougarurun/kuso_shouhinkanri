"use client"

import { useState } from "react"
import { Product, DriveFile } from "@/types"

type Props = {
  product: Product
  onUpdate: (next: Product) => void
}

type FolderResponse = {
  folder: {
    id: string
    name: string
    webViewLink: string
    isNew: boolean
  }
}

type UploadResponse = {
  file: {
    id: string
    name: string
    mimeType: string
    sizeBytes?: number
    webViewLink: string
  }
}

function extractFolderIdFromUrl(url: string): string | null {
  if (!url) return null
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return m?.[1] ?? null
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DriveStorageSection({ product, onUpdate }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progressLabel, setProgressLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const files = product.driveFiles ?? []

  async function ensureFolderId(): Promise<{ id: string; webViewLink: string }> {
    const cachedId = extractFolderIdFromUrl(product.driveFolderUrl)
    if (cachedId) {
      return { id: cachedId, webViewLink: product.driveFolderUrl }
    }
    const res = await fetch("/api/drive/folder/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productNumber: product.productNumber }),
    })
    const data = (await res.json()) as FolderResponse | { error: string }
    if (!res.ok || !("folder" in data)) {
      throw new Error(
        "error" in data ? data.error : `フォルダ作成に失敗（HTTP ${res.status}）`,
      )
    }
    return { id: data.folder.id, webViewLink: data.folder.webViewLink }
  }

  async function addFiles(fileList: FileList | File[]) {
    const list = Array.from(fileList)
    if (list.length === 0) return
    setUploading(true)
    setError(null)
    try {
      setProgressLabel("フォルダを確認中…")
      const folder = await ensureFolderId()

      const uploaded: DriveFile[] = []
      for (let i = 0; i < list.length; i++) {
        const f = list[i]
        setProgressLabel(`アップロード中 (${i + 1}/${list.length}) ${f.name}`)
        const fd = new FormData()
        fd.append("folderId", folder.id)
        fd.append("file", f)
        const res = await fetch("/api/drive/upload", {
          method: "POST",
          body: fd,
        })
        const data = (await res.json()) as UploadResponse | { error: string }
        if (!res.ok || !("file" in data)) {
          throw new Error(
            "error" in data
              ? data.error
              : `アップロード失敗（HTTP ${res.status}）`,
          )
        }
        uploaded.push({
          id: data.file.id,
          name: data.file.name,
          mimeType: data.file.mimeType,
          sizeBytes: data.file.sizeBytes,
          webViewLink: data.file.webViewLink,
          uploadedAt: new Date().toISOString(),
        })
      }

      onUpdate({
        ...product,
        driveFolderUrl: folder.webViewLink || product.driveFolderUrl,
        driveFiles: [...files, ...uploaded],
        updatedAt: new Date().toISOString(),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
      setProgressLabel(null)
    }
  }

  function removeLocal(id: string) {
    // Drive 本体のファイルは残す。ローカル記録からのみ除去（Phase 2 で Drive 側削除 API 追加予定）
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
    if (uploading) return
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ""
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">Drive 添付ファイル</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            フォルダ <code className="bg-zinc-100 px-1">{product.productNumber}/</code>{" "}
            に格納（.ai / .psd / .png / .jpg / .pdf / .zip 等すべて対応、最大 100MB）
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
          (uploading
            ? "border-blue-400 bg-blue-50"
            : dragOver
              ? "border-lime-400 bg-lime-50"
              : "border-zinc-300 bg-zinc-50")
        }
      >
        {uploading ? (
          <p className="text-xs text-blue-700 font-bold">
            {progressLabel ?? "アップロード中…"}
          </p>
        ) : (
          <>
            <p className="text-xs text-zinc-600 mb-2">
              ファイルをドラッグ&ドロップ、または
            </p>
            <input
              type="file"
              multiple
              onChange={onChange}
              disabled={uploading}
              className="text-xs w-full file:mr-2 file:rounded file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 file:text-xs file:font-bold hover:file:bg-zinc-300 disabled:opacity-50"
            />
            <p className="text-[10px] text-zinc-500 mt-2">
              直接 Google Drive にアップロード（商品番号フォルダに格納）
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">
          エラー: {error}
        </div>
      )}

      {product.driveFolderUrl && (
        <div className="text-[11px]">
          <a
            href={product.driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            📁 Drive フォルダを開く
          </a>
        </div>
      )}

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
                onClick={() => removeLocal(f.id)}
                className="text-[11px] text-zinc-400 hover:text-red-600 px-1"
                aria-label="記録から削除（Drive 上のファイルは残ります）"
                title="記録から削除（Drive 上のファイルは残ります）"
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
