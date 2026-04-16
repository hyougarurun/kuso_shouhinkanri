import { NextRequest, NextResponse } from "next/server"
import { analyzeProductImage } from "@/lib/anthropic"

export const runtime = "nodejs"

type Body = {
  base64?: string
  mediaType?: "image/jpeg" | "image/png" | "image/webp"
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

  if (!body.base64 || !body.mediaType) {
    return NextResponse.json(
      { error: "base64 と mediaType が必要です" },
      { status: 400 }
    )
  }

  try {
    const analysis = await analyzeProductImage(body.base64, body.mediaType)
    return NextResponse.json({ analysis })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `画像解析に失敗: ${message}` }, { status: 500 })
  }
}
