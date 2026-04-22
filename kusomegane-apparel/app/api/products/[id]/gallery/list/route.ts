import { NextResponse } from "next/server"
import { listGalleryItems } from "@/lib/supabase/productGallery"

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, ctx: Context): Promise<Response> {
  const { id: productId } = await ctx.params
  try {
    const items = await listGalleryItems(productId)
    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
