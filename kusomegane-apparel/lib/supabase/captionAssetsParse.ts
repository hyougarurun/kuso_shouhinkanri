import type { CaptionAsset } from "@/types"
import type { CaptionAssetRow } from "./database.types"

export function parseCaptionAsset(row: CaptionAssetRow): CaptionAsset {
  return {
    id: row.id,
    label: row.label,
    body: row.body,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface CaptionAssetInsertInput {
  label: string
  body: string
  category?: string | null
}

export function serializeCaptionAsset(
  input: CaptionAssetInsertInput
): { label: string; body: string; category: string } {
  return {
    label: input.label,
    body: input.body,
    category: input.category ?? "",
  }
}
