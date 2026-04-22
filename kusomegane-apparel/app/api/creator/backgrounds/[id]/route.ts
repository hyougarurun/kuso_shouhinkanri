import { NextResponse } from "next/server"
import {
  deleteBackground,
  updateBackground,
} from "@/lib/supabase/creatorBackgrounds"

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, ctx: Context): Promise<Response> {
  const { id } = await ctx.params
  let body: { title?: string; isFavorite?: boolean; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON body が不正です" }, { status: 400 })
  }
  try {
    const updated = await updateBackground(id, body)
    return NextResponse.json({ background: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export async function DELETE(_req: Request, ctx: Context): Promise<Response> {
  const { id } = await ctx.params
  try {
    await deleteBackground(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
