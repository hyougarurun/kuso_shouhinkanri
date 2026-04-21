import { NextResponse } from "next/server"
import {
  createBaseModel,
  fetchBaseModelWithBinary,
} from "@/lib/supabase/baseModels"
import {
  buildGarmentSwapPrompt,
  generateImage,
  type VariationMode,
} from "@/lib/gemini/generateImage"
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
 * POST /api/base-models/:id/generate-variation
 * body: { targetGarment, additionalPrompt?, model? }
 *
 * 親画像 + 指示文を Gemini 2.5 Flash Image に投げ、
 * 返ってきた画像を Storage に保存して新規 base_models 行（parent_id=:id）を作る。
 */
export async function POST(req: Request, ctx: Context): Promise<Response> {
  const { id } = await ctx.params
  let body: {
    targetGarment?: unknown
    variationMode?: unknown
    additionalPrompt?: unknown
    model?: unknown
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

  try {
    const { model: parent, buffer } = await fetchBaseModelWithBinary(id)

    const basePrompt = buildGarmentSwapPrompt(body.targetGarment, variationMode)
    const fullPrompt = additionalPrompt
      ? `${basePrompt}\n\nAdditional notes: ${additionalPrompt}`
      : basePrompt

    const generated = await generateImage({
      sourceImage: buffer,
      sourceMimeType: parent.mimeType,
      prompt: fullPrompt,
      model: overrideModel,
    })

    // 派生用 variantLabel: 親 + サフィックス
    const variantLabel = parent.variantLabel
      ? `${parent.variantLabel}-${body.targetGarment}`
      : body.targetGarment

    const fileBuffer = Uint8Array.from(Buffer.from(generated.base64, "base64")).buffer
    const created = await createBaseModel({
      gender: parent.gender,
      pose: parent.pose,
      garmentType: body.targetGarment,
      garmentColor: parent.garmentColor,
      backgroundColor: parent.backgroundColor,
      variantLabel,
      mimeType: generated.mimeType,
      sizeBytes: fileBuffer.byteLength,
      parentId: parent.id,
      targetGarment: body.targetGarment,
      generationPrompt: fullPrompt,
      generationModel: generated.model,
      sourceModel: generated.model,
      fileBuffer,
      fileExtension: extFromMime(generated.mimeType),
    })
    return NextResponse.json({ model: created })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
