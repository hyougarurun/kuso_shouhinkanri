import { NextResponse } from "next/server"
import {
  createBaseModel,
  fetchBaseModelWithBinary,
} from "@/lib/supabase/baseModels"
import {
  buildGarmentSwapPrompt,
  generateImage as geminiGenerateImage,
  type VariationMode,
} from "@/lib/gemini/generateImage"
import {
  generateImage as openaiGenerateImage,
  type OpenAIImageQuality,
  type OpenAIImageSize,
} from "@/lib/openai/generateImage"
import type { BaseModel } from "@/types"

interface Context {
  params: Promise<{ id: string }>
}

function validateGarment(v: unknown): v is BaseModel["garmentType"] {
  return v === "tshirt" || v === "longsleeve" || v === "crewneck" || v === "hoodie"
}

function validateMode(v: unknown): v is VariationMode {
  return v === "conservative" || v === "balanced" || v === "creative"
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "png"
}

/**
 * model 文字列を (provider, tier) にパースする。
 * 例:
 *   "gemini-2.5-flash-image"   → { provider: "gemini", modelId: "gemini-2.5-flash-image" }
 *   "gpt-image-2/medium"       → { provider: "openai", modelId: "gpt-image-2", quality: "medium" }
 *   "gpt-image-2"              → { provider: "openai", modelId: "gpt-image-2", quality: "medium"（既定） }
 *   undefined                  → { provider: "gemini", modelId: undefined } （Gemini 側のデフォルト）
 */
function parseModel(model: string | undefined): {
  provider: "gemini" | "openai"
  modelId?: string
  quality?: OpenAIImageQuality
} {
  if (!model) return { provider: "gemini" }
  if (model.startsWith("gpt-image")) {
    const [base, tier] = model.split("/")
    const quality: OpenAIImageQuality =
      tier === "low" || tier === "medium" || tier === "high" || tier === "auto"
        ? tier
        : "medium"
    return { provider: "openai", modelId: base, quality }
  }
  return { provider: "gemini", modelId: model }
}

/**
 * POST /api/base-models/:id/generate-variation
 * body: { targetGarment, variationMode?, additionalPrompt?, model?, size? }
 *
 * model 文字列で Gemini / OpenAI を振り分け:
 *   - "gemini-*"          → Google Gemini 2.5 Flash Image（既定）
 *   - "gpt-image-2/low"   → OpenAI gpt-image-2（Low 品質）
 *   - "gpt-image-2/medium"→ OpenAI gpt-image-2（Medium）
 *   - "gpt-image-2/high"  → OpenAI gpt-image-2（High）
 *
 * 返ってきた画像を Storage に保存して新規 base_models 行（parent_id=:id）を作る。
 */
export async function POST(req: Request, ctx: Context): Promise<Response> {
  const { id } = await ctx.params
  let body: {
    targetGarment?: unknown
    variationMode?: unknown
    additionalPrompt?: unknown
    model?: unknown
    size?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON body が不正です" }, { status: 400 })
  }

  if (!validateGarment(body.targetGarment)) {
    return NextResponse.json(
      { error: "targetGarment は tshirt / longsleeve / crewneck / hoodie" },
      { status: 400 },
    )
  }
  const variationMode: VariationMode = validateMode(body.variationMode)
    ? body.variationMode
    : "balanced"
  const additionalPrompt =
    typeof body.additionalPrompt === "string" ? body.additionalPrompt : ""
  const overrideModel = typeof body.model === "string" ? body.model : undefined
  const size = typeof body.size === "string" ? body.size : undefined

  try {
    const { model: parent, buffer } = await fetchBaseModelWithBinary(id)

    const basePrompt = buildGarmentSwapPrompt(body.targetGarment, variationMode)
    const fullPrompt = additionalPrompt
      ? `${basePrompt}\n\nAdditional notes: ${additionalPrompt}`
      : basePrompt

    const { provider, modelId, quality } = parseModel(overrideModel)

    let resultBase64: string
    let resultMime: string
    let resultModelLabel: string

    if (provider === "openai") {
      const generated = await openaiGenerateImage({
        sourceImage: buffer,
        sourceMimeType: parent.mimeType,
        prompt: fullPrompt,
        model: modelId ?? "gpt-image-2",
        quality: quality ?? "medium",
        size: (size as OpenAIImageSize | undefined) ?? "1024x1024",
      })
      resultBase64 = generated.base64
      resultMime = generated.mimeType
      resultModelLabel = `${generated.model}/${generated.quality}`
    } else {
      const generated = await geminiGenerateImage({
        sourceImage: buffer,
        sourceMimeType: parent.mimeType,
        prompt: fullPrompt,
        model: modelId,
      })
      resultBase64 = generated.base64
      resultMime = generated.mimeType
      resultModelLabel = generated.model
    }

    const variantLabel = parent.variantLabel
      ? `${parent.variantLabel}-${body.targetGarment}`
      : body.targetGarment

    const fileBuffer = Uint8Array.from(Buffer.from(resultBase64, "base64")).buffer
    const created = await createBaseModel({
      gender: parent.gender,
      pose: parent.pose,
      garmentType: body.targetGarment,
      garmentColor: parent.garmentColor,
      backgroundColor: parent.backgroundColor,
      variantLabel,
      mimeType: resultMime,
      sizeBytes: fileBuffer.byteLength,
      parentId: parent.id,
      targetGarment: body.targetGarment,
      generationPrompt: fullPrompt,
      generationModel: resultModelLabel,
      sourceModel: resultModelLabel,
      fileBuffer,
      fileExtension: extFromMime(resultMime),
    })
    return NextResponse.json({ model: created })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
