import { NextResponse } from "next/server"
import { deleteProductFromSheet } from "@/lib/google/sheets"

type Body = { productNumber?: string }

/**
 * POST /api/sheets/unregister
 * body: { productNumber }
 * 対象商品番号の行をシートから物理削除する。行が無ければ冪等に成功扱い。
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as Body
  const productNumber = body.productNumber
  if (!productNumber || typeof productNumber !== "string") {
    return NextResponse.json(
      { error: "productNumber は必須です" },
      { status: 400 },
    )
  }
  try {
    const result = await deleteProductFromSheet(productNumber)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
