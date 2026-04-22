import { NextResponse } from "next/server"
import {
  generateImage,
  type OpenAIImageQuality,
  type OpenAIImageSize,
} from "@/lib/openai/generateImage"
import { createBackgroundRecord } from "@/lib/supabase/creatorBackgrounds"

const MAX_BYTES = 15 * 1024 * 1024

/**
 * 既定プロンプト。OpenAI の safety system に引っかかりにくい表現を採用:
 *  - 特定作家名 (KUSOMEGANE artist) は不使用
 *  - "manga" "anime" 等、実写→二次元の変換を強く示唆する語は避ける
 *  - 「キャラなし・環境のみ」を明示して identity 懸念を下げる
 *  - ユーザは replace モードで完全上書き可能
 */
const DEFAULT_PROMPT_PREFIX = [
  "Create a stylized illustration of the scene shown in the input image.",
  "Hand-drawn flat illustration aesthetic with bold ink outlines and vibrant pop colors,",
  "a light paper grain texture, slightly loose and playful linework.",
  "Depict only the environment (buildings, sky, trees, roads, props, etc).",
  "Do NOT depict any human figures, faces, or characters — environment only.",
  "Preserve the original scene's composition, camera angle, perspective, and layout",
  "so the result can be used as a background plate with characters overlaid later.",
].join(" ")

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
  const promptMode = (form.get("promptMode") as string | null) ?? "append" // "append" | "replace"
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

  // append（既定）: 既定プロンプト + 追加指示
  // replace: ユーザ入力をそのまま使う（既定を一切使わない、safety 回避のための脱出口）
  const fullPrompt =
    promptMode === "replace" && promptExtra
      ? promptExtra
      : promptExtra
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
    const rawMsg = err instanceof Error ? err.message : String(err)
    // OpenAI safety system の moderation_blocked を検出して、分かりやすい案内文にする
    const isModeration = /moderation_blocked|safety system/i.test(rawMsg)
    const friendly = isModeration
      ? [
          "OpenAI の安全フィルタに弾かれました（moderation_blocked）。",
          "入力画像または指示文に、特定作家模倣・実写からの識別変換と解釈される要素が含まれている可能性があります。",
          "対処案:",
          "・入力画像を人物の写っていない純粋な風景に差し替える",
          "・追加指示から '〜風' '〜スタイル' などの固有表現を外す",
          "・「プロンプトを完全上書き」モードにして、自分で自由に書いてみる",
          "（例: 'flat vector landscape illustration, evening light, no humans'）",
          "",
          "元エラー: " + rawMsg,
        ].join("\n")
      : rawMsg
    return NextResponse.json(
      {
        error: friendly,
        moderationBlocked: isModeration,
      },
      { status: isModeration ? 400 : 500 },
    )
  }
}
