import { NextResponse } from "next/server"
import {
  generateImage,
  type OpenAIImageQuality,
  type OpenAIImageSize,
} from "@/lib/openai/generateImage"
import { createBackgroundRecord } from "@/lib/supabase/creatorBackgrounds"

const MAX_BYTES = 15 * 1024 * 1024

const DEFAULT_PROMPT_PREFIX =
  "Redraw the provided photograph as an illustration in the style of the KUSOMEGANE artist. " +
  "Flat cartoon / playful manga style, thick ink outlines, pop colors, subtle paper texture, " +
  "humorous but refined, not too clean — a bit quirky. Background-only (no characters), " +
  "suitable as a backdrop for overlaying existing characters. Preserve the original composition, " +
  "perspective, and subject placement so it can be reused as a drop-in background."

function isQuality(v: unknown): v is OpenAIImageQuality {
  return v === "low" || v === "medium" || v === "high" || v === "auto"
}
function isSize(v: unknown): v is OpenAIImageSize {
  // gpt-image-2 は柔軟サイズだが、型上は固定値。カスタムサイズは string で受けてそのまま渡す
  return (
    v === "1024x1024" ||
    v === "1024x1536" ||
    v === "1536x1024" ||
    v === "auto"
  )
}

/**
 * POST /api/creator/backgrounds/generate
 *
 * multipart/form-data:
 *   - file: 入力画像（元にする風景写真等）
 *   - prompt: 任意の追加指示（空なら既定の KUSOMEGANE 画風プロンプトのみ）
 *   - size: "1024x1024" | "2048x2048"（既定 2048x2048、k2 の作画サイズに合わせる）
 *   - quality: "low" | "medium" | "high"（既定 high、作画用途）
 *   - model: gpt-image-2 / gpt-image-1.5 等（既定 gpt-image-2）
 *   - keepSource: "1" で入力画像も一緒に Storage 保存
 *   - title: 保存時のタイトル（任意）
 */
export async function POST(req: Request): Promise<Response> {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json(
      { error: "multipart/form-data が不正です" },
      { status: 400 },
    )
  }

  const file = form.get("file")
  const promptExtra = ((form.get("prompt") as string | null) ?? "").trim()
  const sizeRaw = (form.get("size") as string | null) ?? "2048x2048"
  const quality = (form.get("quality") as string | null) ?? "high"
  const model = (form.get("model") as string | null) ?? "gpt-image-2"
  const keepSource = form.get("keepSource") === "1"
  const title = ((form.get("title") as string | null) ?? "").trim()

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'form field "file" に元画像を添付してください' },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `ファイルが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。15MB 以下にしてください` },
      { status: 400 },
    )
  }
  if (!isQuality(quality)) {
    return NextResponse.json(
      { error: "quality は low/medium/high/auto" },
      { status: 400 },
    )
  }

  // gpt-image-2 は size に 2048x2048 などもそのまま受け付ける（max 3840、16 の倍数）
  // 型には無いがランタイムで渡す
  const size = (isSize(sizeRaw) ? sizeRaw : sizeRaw) as OpenAIImageSize

  const fullPrompt = promptExtra
    ? `${DEFAULT_PROMPT_PREFIX}\n\nAdditional notes: ${promptExtra}`
    : DEFAULT_PROMPT_PREFIX

  try {
    const buffer = await file.arrayBuffer()

    const generated = await generateImage({
      sourceImage: buffer,
      sourceMimeType: file.type || "image/png",
      prompt: fullPrompt,
      model,
      quality,
      size,
    })

    const imageBuffer = Uint8Array.from(
      Buffer.from(generated.base64, "base64"),
    ).buffer

    const created = await createBackgroundRecord({
      imageBuffer,
      mimeType: generated.mimeType,
      sourceBuffer: keepSource ? buffer : undefined,
      sourceMimeType: keepSource ? file.type || "image/png" : undefined,
      prompt: fullPrompt,
      model: generated.model,
      quality: generated.quality,
      title,
    })

    return NextResponse.json({ background: created })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
