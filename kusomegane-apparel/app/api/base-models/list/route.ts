import { NextResponse } from "next/server"
import {
  listBaseModels,
  type ListBaseModelsOptions,
} from "@/lib/supabase/baseModels"
import type { BaseModel } from "@/types"

function parseGender(v: string | null): BaseModel["gender"] | undefined {
  if (v === "male" || v === "female") return v
  return undefined
}
function parsePose(v: string | null): BaseModel["pose"] | undefined {
  if (v === "front" || v === "back") return v
  return undefined
}
function parseGarmentType(v: string | null): BaseModel["garmentType"] | undefined {
  if (v === "crewneck" || v === "hoodie" || v === "tshirt" || v === "longsleeve") {
    return v
  }
  return undefined
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const options: ListBaseModelsOptions = {
    gender: parseGender(url.searchParams.get("gender")),
    pose: parsePose(url.searchParams.get("pose")),
    garmentType: parseGarmentType(url.searchParams.get("garmentType")),
    onlyFavorite: url.searchParams.get("favorite") === "1",
  }
  try {
    const models = await listBaseModels(options)
    return NextResponse.json({ models })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
