import { NextResponse } from "next/server"
import {
  createCaptionAsset,
  listCaptionAssets,
} from "@/lib/supabase/captionAssets"
import { deriveLabel } from "@/lib/captionAssets/format"

export const runtime = "nodejs"

export async function GET(): Promise<Response> {
  try {
    const assets = await listCaptionAssets()
    return NextResponse.json({ assets })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request): Promise<Response> {
  let body: { label?: string; body?: string; category?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON body が不正です" }, { status: 400 })
  }
  if (!body.body || typeof body.body !== "string" || !body.body.trim()) {
    return NextResponse.json(
      { error: "body（本文）は必須です" },
      { status: 400 }
    )
  }
  try {
    const asset = await createCaptionAsset({
      label: deriveLabel(body.body, body.label),
      body: body.body,
      category: body.category ?? "",
    })
    return NextResponse.json({ asset })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
