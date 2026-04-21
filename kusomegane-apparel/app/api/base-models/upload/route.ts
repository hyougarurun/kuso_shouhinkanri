import { NextResponse } from "next/server"
import { createBaseModel } from "@/lib/supabase/baseModels"
import type { BaseModel } from "@/types"

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

function validateGender(v: unknown): v is BaseModel["gender"] {
  return v === "male" || v === "female"
}
function validatePose(v: unknown): v is BaseModel["pose"] {
  return v === "front" || v === "back"
}
function validateGarmentType(v: unknown): v is BaseModel["garmentType"] {
  return v === "crewneck" || v === "hoodie" || v === "tshirt" || v === "longsleeve"
}

function extensionFromMime(mime: string, filename: string): string {
  const m = filename.match(/\.([A-Za-z0-9]+)$/)
  if (m) return m[1].toLowerCase()
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "bin"
}

export async function POST(req: Request): Promise<Response> {
  const form = await req.formData()
  const file = form.get("file")
  const gender = form.get("gender")
  const pose = form.get("pose")
  const garmentType = form.get("garmentType")
  const garmentColor = (form.get("garmentColor") as string | null) ?? ""
  const backgroundColor = (form.get("backgroundColor") as string | null) ?? ""
  const variantLabel = (form.get("variantLabel") as string | null) ?? ""
  const sourcePrompt = (form.get("sourcePrompt") as string | null) ?? ""
  const sourceModel = (form.get("sourceModel") as string | null) ?? ""

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'form field "file" にファイルを添付してください' },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `ファイルが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。10MB 以下にしてください` },
      { status: 400 },
    )
  }
  if (!validateGender(gender)) {
    return NextResponse.json({ error: "gender は male / female" }, { status: 400 })
  }
  if (!validatePose(pose)) {
    return NextResponse.json({ error: "pose は front / back" }, { status: 400 })
  }
  if (!validateGarmentType(garmentType)) {
    return NextResponse.json(
      { error: "garmentType は crewneck / hoodie / tshirt / longsleeve" },
      { status: 400 },
    )
  }

  try {
    const buffer = await file.arrayBuffer()
    const created = await createBaseModel({
      gender,
      pose,
      garmentType,
      garmentColor,
      backgroundColor,
      variantLabel,
      mimeType: file.type || "image/png",
      sizeBytes: file.size,
      sourcePrompt,
      sourceModel,
      fileBuffer: buffer,
      fileExtension: extensionFromMime(file.type, file.name),
    })
    return NextResponse.json({ model: created })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
