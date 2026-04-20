import { NextResponse } from "next/server"
import { ensureProductFolder } from "@/lib/google/drive"

type Body = {
  productNumber: string
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as Body
  if (!body?.productNumber) {
    return NextResponse.json(
      { error: "productNumber は必須です" },
      { status: 400 },
    )
  }

  try {
    const folder = await ensureProductFolder(body.productNumber)
    return NextResponse.json({ folder })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
