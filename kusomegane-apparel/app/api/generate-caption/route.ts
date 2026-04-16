import { NextRequest, NextResponse } from "next/server"
import { generateCaption } from "@/lib/anthropic"
import { buildFullCaption } from "@/lib/caption"
import { Product, ImageAnalysis } from "@/types"

export const runtime = "nodejs"

type Body = {
  product?: Partial<Product>
  analysis?: ImageAnalysis | null
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が未設定です（.env.local を確認してください）" },
      { status: 500 }
    )
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "リクエスト JSON が不正です" }, { status: 400 })
  }

  if (!body.product) {
    return NextResponse.json({ error: "product が必要です" }, { status: 400 })
  }

  try {
    const ai = await generateCaption(body.product, body.analysis ?? null)
    const caption = buildFullCaption(body.product, ai.description, ai.designDesc)
    return NextResponse.json({
      caption,
      description: ai.description,
      designDesc: ai.designDesc,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: `キャプション生成に失敗: ${message}` },
      { status: 500 }
    )
  }
}
