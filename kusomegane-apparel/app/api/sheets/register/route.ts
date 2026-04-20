import { NextResponse } from "next/server"
import { registerProductToList1 } from "@/lib/google/sheets"
import type { Product } from "@/types"

type Body = { product: Product }

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as Body
  if (!body?.product?.productNumber) {
    return NextResponse.json(
      { error: "product.productNumber は必須です" },
      { status: 400 },
    )
  }
  try {
    const result = await registerProductToList1(body.product)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
