import { NextResponse } from "next/server"
import {
  createBaseModel,
  fetchBaseModelWithBinary,
} from "@/lib/supabase/baseModels"
import {
  buildCompositePrompt,
  generateImage,
  type CompositeLocation,
  type CompositeSize,
} from "@/lib/gemini/generateImage"

interface Context {
  params: Promise<{ id: string }>
}

const MAX_DESIGN_BYTES = 10 * 1024 * 1024 // 10MB

function validateLocation(v: unknown): v is CompositeLocation {
  return (
    v === "front-center" ||
    v === "front-left-chest" ||
    v === "back-center" ||
    v === "sleeve"
  )
}
function validateSize(v: unknown): v is CompositeSize {
  return v === "small" || v === "medium" || v === "large"
}
function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "png"
}

/**
 * POST /api/base-models/:id/composite (multipart/form-data)
 *
 * form fields:
 *   - designFile: File (デザイン画像、PNG 推奨。透過背景対応)
 *   - location: "front-center" | "front-left-chest" | "back-center" | "sleeve"
 *   - size: "small" | "medium" | "large"
 *   - additionalPrompt?: string
 *   - model?: string (Gemini モデル ID 上書き)
 *
 * 処理: 親 base 画像 + デザイン画像 + 合成プロンプト → Gemini 多画像生成
 *       → 新 base_model 行（parent_id=:id）
 */
export async function POST(req: Request, ctx: Context): Promise<Response> {
  const { id } = await ctx.params

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { error: "multipart/form-data が不正です" },
      { status: 400 },
    )
  }

  const designFile = form.get("designFile")
  const location = form.get("location")
  const size = form.get("size")
  const additionalPrompt =
    (form.get("additionalPrompt") as string | null) ?? ""
  const overrideModel = (form.get("model") as string | null) ?? undefined

  if (!(designFile instanceof File)) {
    return NextResponse.json(
      { error: 'form field "designFile" にデザイン画像を添付してください' },
      { status: 400 },
    )
  }
  if (designFile.size > MAX_DESIGN_BYTES) {
    return NextResponse.json(
      {
        error: `デザイン画像が大きすぎます（${Math.round(designFile.size / 1024 / 1024)}MB）。10MB 以下にしてください`,
      },
      { status: 400 },
    )
  }
  if (!validateLocation(location)) {
    return NextResponse.json(
      {
        error:
          "location は front-center / front-left-chest / back-center / sleeve",
      },
      { status: 400 },
    )
  }
  if (!validateSize(size)) {
    return NextResponse.json(
      { error: "size は small / medium / large" },
      { status: 400 },
    )
  }

  try {
    const { model: parent, buffer: parentBuf } =
      await fetchBaseModelWithBinary(id)
    const designBuf = await designFile.arrayBuffer()

    const prompt = buildCompositePrompt({
      location,
      size,
      additionalPrompt,
    })

    const generated = await generateImage({
      sourceImage: parentBuf,
      sourceMimeType: parent.mimeType,
      extraImages: [
        {
          buffer: designBuf,
          mimeType: designFile.type || "image/png",
        },
      ],
      prompt,
      model: overrideModel,
    })

    const variantLabel = parent.variantLabel
      ? `${parent.variantLabel}-合成`
      : `合成-${parent.id.slice(0, 6)}`

    const fileBuffer = Uint8Array.from(
      Buffer.from(generated.base64, "base64"),
    ).buffer
    const created = await createBaseModel({
      gender: parent.gender,
      pose: parent.pose,
      garmentType: parent.garmentType,
      garmentColor: parent.garmentColor,
      backgroundColor: parent.backgroundColor,
      variantLabel,
      mimeType: generated.mimeType,
      sizeBytes: fileBuffer.byteLength,
      parentId: parent.id,
      targetGarment: parent.garmentType,
      generationPrompt: prompt,
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
