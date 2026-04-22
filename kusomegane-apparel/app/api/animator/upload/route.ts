import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const BUCKET = "animator-assets"
const MAX_BYTES = 15 * 1024 * 1024 // 15MB（アニメーターは PNG/GIF 想定なので大きめ）
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 // 24h

function extFromMime(mime: string, filename: string): string {
  const m = filename.match(/\.([A-Za-z0-9]+)$/)
  if (m) return m[1].toLowerCase()
  if (mime === "image/png") return "png"
  if (mime === "image/gif") return "gif"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "bin"
}

/**
 * POST /api/animator/upload (multipart/form-data)
 *
 * KUSOMEGANE Animator の iframe からアップロード画像を Supabase に
 * バックアップするエンドポイント。DB には行を作らず、Storage のみ書き込む
 * （シンプル運用。将来的に animator_assets テーブルが必要なら追加）。
 *
 * form fields:
 *   - file: File
 *
 * 返却: { path, signedUrl }
 */
export async function POST(req: Request): Promise<Response> {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json(
      { error: "multipart/form-data が不正です" },
      { status: 400 },
    )
  }
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'form field "file" にファイルを添付してください' },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `ファイルが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。15MB 以下にしてください`,
      },
      { status: 400 },
    )
  }

  try {
    const sb = createServerClient()
    const id = randomUUID()
    const ext = extFromMime(file.type, file.name)
    // 日付フォルダ配下に 1 日単位で整理
    const ymd = new Date().toISOString().slice(0, 10)
    const path = `${ymd}/${id}.${ext}`

    const buffer = await file.arrayBuffer()
    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })
    if (upErr) throw new Error(`Storage upload 失敗: ${upErr.message}`)

    const { data: signed } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

    return NextResponse.json({
      path,
      signedUrl: signed?.signedUrl ?? "",
      bucket: BUCKET,
      size: file.size,
      mime: file.type,
      name: file.name,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
