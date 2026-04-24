import { NextResponse } from "next/server"
import {
  deleteCaptionAsset,
  updateCaptionAsset,
} from "@/lib/supabase/captionAssets"
import { deriveLabel } from "@/lib/captionAssets/format"

export const runtime = "nodejs"

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, ctx: Context): Promise<Response> {
  const { id } = await ctx.params
  let body: { label?: string; body?: string; category?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON body が不正です" }, { status: 400 })
  }
  try {
    const patch: { label?: string; body?: string; category?: string } = {}
    if (body.body !== undefined) {
      if (!body.body.trim()) {
        return NextResponse.json(
          { error: "body（本文）を空にはできません" },
          { status: 400 }
        )
      }
      patch.body = body.body
      patch.label = deriveLabel(body.body, body.label)
    } else if (body.label !== undefined) {
      patch.label = body.label.trim() || "(無題)"
    }
    if (body.category !== undefined) patch.category = body.category
    const asset = await updateCaptionAsset(id, patch)
    return NextResponse.json({ asset })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, ctx: Context): Promise<Response> {
  const { id } = await ctx.params
  try {
    await deleteCaptionAsset(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
