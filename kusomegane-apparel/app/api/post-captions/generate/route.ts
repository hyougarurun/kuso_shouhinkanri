import { NextRequest, NextResponse } from "next/server"
import { buildPrompt, type Tone } from "@/lib/postCaption/buildPrompt"
import { parseSituation } from "@/lib/postCaption/parseSituation"
import {
  generateWithClaude,
  type SupportedMediaType,
} from "@/lib/postCaption/providers/claude"
import type { ModelId } from "@/lib/postCaption/constants"

export const runtime = "nodejs"
export const maxDuration = 60

const ACCEPT_MIME: SupportedMediaType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
]

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json(
      { error: "multipart/form-data で送信してください" },
      { status: 400 }
    )
  }

  const presetBody = String(form.get("presetBody") ?? "").trim()
  const situationRaw = String(form.get("situation") ?? "")
  const targetLengthStr = String(form.get("targetLength") ?? "500")
  const tone = String(form.get("tone") ?? "tame") as Tone
  const model = String(
    form.get("model") ?? "claude-haiku-4-5-20251001"
  ) as ModelId
  const countStr = String(form.get("count") ?? "1")

  if (!presetBody) {
    return NextResponse.json(
      { error: "プリセット本文（指示文）が空です" },
      { status: 400 }
    )
  }

  const targetLength = Number.parseInt(targetLengthStr, 10)
  if (!Number.isFinite(targetLength) || targetLength <= 0) {
    return NextResponse.json(
      { error: "targetLength が不正です" },
      { status: 400 }
    )
  }

  const count = Math.min(Math.max(Number.parseInt(countStr, 10) || 1, 1), 5)

  const file = form.get("file")
  let image: { base64: string; mediaType: SupportedMediaType } | undefined
  if (file instanceof File && file.size > 0) {
    if (!ACCEPT_MIME.includes(file.type as SupportedMediaType)) {
      return NextResponse.json(
        { error: `非対応の画像形式: ${file.type}（JPEG/PNG/WebP のみ）` },
        { status: 400 }
      )
    }
    const buf = Buffer.from(await file.arrayBuffer())
    image = {
      base64: buf.toString("base64"),
      mediaType: file.type as SupportedMediaType,
    }
  }

  const prompt = buildPrompt({
    presetBody,
    situation: parseSituation(situationRaw),
    targetLength,
    tone,
  })

  if (!model.startsWith("claude-")) {
    return NextResponse.json(
      {
        error: `モデル "${model}" は Phase C2 では未対応です（Claude のみ対応）`,
      },
      { status: 400 }
    )
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が未設定です（.env.local を確認してください）" },
      { status: 500 }
    )
  }

  try {
    const tasks = Array.from({ length: count }, () =>
      generateWithClaude({ model, prompt, image })
    )
    const captions = await Promise.all(tasks)
    return NextResponse.json({ captions, prompt })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: `生成失敗: ${message}` },
      { status: 500 }
    )
  }
}
