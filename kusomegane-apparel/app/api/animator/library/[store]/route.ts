import { NextResponse } from "next/server"
import {
  deleteAsset,
  deleteFolder,
  deleteProject,
  isAnimatorStore,
  listAssets,
  listFolders,
  listProjects,
  putAsset,
  putFolder,
  putProject,
  type AnimatorStore,
} from "@/lib/supabase/animatorLibrary"

export const runtime = "nodejs"
// 10MB まで（projects は frames 配列込みで大きい）
export const maxDuration = 60

interface Context {
  params: Promise<{ store: string }>
}

/**
 * POST /api/animator/library/[store]
 *   body: JSON（store により shape が異なる）
 *   IndexedDB の dbPut(store, data) 互換
 */
export async function POST(req: Request, ctx: Context): Promise<Response> {
  const { store } = await ctx.params
  if (!isAnimatorStore(store)) {
    return NextResponse.json({ error: "invalid store" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "JSON body が不正です" },
      { status: 400 },
    )
  }

  try {
    if (store === "projects") {
      await putProject(body)
    } else if (store === "assets") {
      await putAsset(body)
    } else {
      await putFolder(body)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

/**
 * GET /api/animator/library/[store]
 *   list。IndexedDB の dbGetAll(store) 互換
 */
export async function GET(_req: Request, ctx: Context): Promise<Response> {
  const { store } = await ctx.params
  if (!isAnimatorStore(store)) {
    return NextResponse.json({ error: "invalid store" }, { status: 400 })
  }
  try {
    let items: unknown[]
    const s: AnimatorStore = store
    if (s === "projects") items = await listProjects()
    else if (s === "assets") items = await listAssets()
    else items = await listFolders()
    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/animator/library/[store]?id=...
 * 個別削除は [store]/[id]/route.ts でも実装しているが、こちらは未使用。
 */
export async function DELETE(req: Request, ctx: Context): Promise<Response> {
  const { store } = await ctx.params
  const id = new URL(req.url).searchParams.get("id")
  if (!isAnimatorStore(store) || !id) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 })
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
