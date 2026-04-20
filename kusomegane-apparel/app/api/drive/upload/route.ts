import { NextResponse } from "next/server"
import { uploadFileToDrive } from "@/lib/google/drive"

const MAX_BYTES = 100 * 1024 * 1024 // 100MB: .ai/.psd の実サイズ想定

export async function POST(req: Request): Promise<Response> {
  const form = await req.formData()
  const file = form.get("file")
  const folderId = form.get("folderId")

  if (typeof folderId !== "string" || !folderId) {
    return NextResponse.json(
      { error: "folderId は必須です" },
      { status: 400 },
    )
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'form field "file" にファイルを添付してください' },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `ファイルが大きすぎます（${Math.round(
          file.size / 1024 / 1024,
        )}MB）。100MB 以下にしてください`,
      },
      { status: 400 },
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadFileToDrive({
      folderId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      data: buffer,
    })
    return NextResponse.json({ file: uploaded })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
