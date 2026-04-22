import { NextResponse } from "next/server"
import { uploadGalleryItem } from "@/lib/supabase/productGallery"

interface Context {
  params: Promise<{ id: string }>
}

const MAX_BYTES = 8 * 1024 * 1024 // 8MB

export async function POST(req: Request, ctx: Context): Promise<Response> {
  const { id: productId } = await ctx.params
  const form = await req.formData()
  const file = form.get("file")
  const widthStr = form.get("width")
  const heightStr = form.get("height")

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'form field "file" に画像を添付してください' },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `ファイルが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。8MB 以下にしてください` },
      { status: 400 },
    )
  }
  try {
    const buffer = await file.arrayBuffer()
    const created = await uploadGalleryItem({
      productId,
      fileBuffer: buffer,
      mimeType: file.type || "image/jpeg",
      sizeBytes: file.size,
      width: typeof widthStr === "string" ? parseInt(widthStr, 10) : undefined,
      height: typeof heightStr === "string" ? parseInt(heightStr, 10) : undefined,
    })
    return NextResponse.json({ item: created })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
