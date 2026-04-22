import { NextResponse } from "next/server"
import { deleteGalleryItem } from "@/lib/supabase/productGallery"

interface Context {
  params: Promise<{ id: string; itemId: string }>
}

export async function DELETE(_req: Request, ctx: Context): Promise<Response> {
  const { itemId } = await ctx.params
  try {
    await deleteGalleryItem(itemId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
