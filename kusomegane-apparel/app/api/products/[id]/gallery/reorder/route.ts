import { NextResponse } from "next/server"
import { reorderGalleryItems } from "@/lib/supabase/productGallery"

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, ctx: Context): Promise<Response> {
  const { id: productId } = await ctx.params
  let body: { orderedIds?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON body が不正です" }, { status: 400 })
  }
  if (!Array.isArray(body.orderedIds)) {
    return NextResponse.json(
      { error: "orderedIds (string[]) が必要です" },
      { status: 400 },
    )
  }
  const ids = body.orderedIds.filter((x): x is string => typeof x === "string")
  try {
    await reorderGalleryItems(productId, ids)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
