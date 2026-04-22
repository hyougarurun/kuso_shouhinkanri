import { NextResponse } from "next/server"
import {
  deleteAsset,
  deleteFolder,
  deleteProject,
  getAsset,
  getProject,
  isAnimatorStore,
} from "@/lib/supabase/animatorLibrary"

interface Context {
  params: Promise<{ store: string; id: string }>
}

/**
 * GET /api/animator/library/[store]/[id]
 *   IndexedDB の dbGet(store, id) 互換
 *   projects: full（frames/srcURL 含む）
 *   assets:   metadata + signed URL
 *   folders:  該当無し（list で全件取得する設計）
 */
export async function GET(_req: Request, ctx: Context): Promise<Response> {
  const { store, id } = await ctx.params
  if (!isAnimatorStore(store)) {
    return NextResponse.json({ error: "invalid store" }, { status: 400 })
  }
  try {
    if (store === "projects") {
      const proj = await getProject(id)
      if (!proj) {
        return NextResponse.json({ error: "not found" }, { status: 404 })
      }
      return NextResponse.json({ item: proj })
    } else if (store === "assets") {
      const asset = await getAsset(id)
      if (!asset) {
        return NextResponse.json({ error: "not found" }, { status: 404 })
      }
      return NextResponse.json({ item: asset })
    } else {
      return NextResponse.json(
        { error: "folders は list 経由で取得してください" },
        { status: 400 },
      )
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/animator/library/[store]/[id]
 *   IndexedDB の dbDelete(store, id) 互換
 */
export async function DELETE(_req: Request, ctx: Context): Promise<Response> {
  const { store, id } = await ctx.params
  if (!isAnimatorStore(store)) {
    return NextResponse.json({ error: "invalid store" }, { status: 400 })
  }
  try {
    if (store === "projects") await deleteProject(id)
    else if (store === "assets") await deleteAsset(id)
    else await deleteFolder(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
