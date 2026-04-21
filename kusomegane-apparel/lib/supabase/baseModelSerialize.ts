import type { BaseModel } from "@/types"
import type { BaseModelRow } from "./database.types"

export function serializeBaseModel(
  bm: BaseModel,
): Omit<BaseModelRow, "created_at" | "updated_at"> {
  return {
    id: bm.id,
    gender: bm.gender,
    pose: bm.pose,
    garment_type: bm.garmentType,
    garment_color: bm.garmentColor,
    background_color: bm.backgroundColor,
    variant_label: bm.variantLabel,
    storage_path: bm.storagePath,
    bucket: bm.bucket,
    mime_type: bm.mimeType,
    size_bytes: bm.sizeBytes ?? null,
    width: bm.width ?? null,
    height: bm.height ?? null,
    is_favorite: bm.isFavorite,
    notes: bm.notes,
    source_prompt: bm.sourcePrompt,
    source_model: bm.sourceModel,
  }
}

export function parseBaseModel(row: BaseModelRow): BaseModel {
  return {
    id: row.id,
    gender: row.gender,
    pose: row.pose,
    garmentType: row.garment_type,
    garmentColor: row.garment_color,
    backgroundColor: row.background_color,
    variantLabel: row.variant_label,
    storagePath: row.storage_path,
    bucket: row.bucket,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    isFavorite: row.is_favorite,
    notes: row.notes,
    sourcePrompt: row.source_prompt,
    sourceModel: row.source_model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function buildBaseModelStoragePath(
  id: string,
  uniqueId: string,
  extension: string,
): string {
  const safeExt = extension.replace(/^\./, "").toLowerCase()
  return `${id}/${uniqueId}.${safeExt}`
}
