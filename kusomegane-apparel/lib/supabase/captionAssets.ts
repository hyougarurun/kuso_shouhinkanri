import { createServerClient } from "./server"
import {
  parseCaptionAsset,
  serializeCaptionAsset,
  type CaptionAssetInsertInput,
} from "./captionAssetsParse"
import type { CaptionAssetRow } from "./database.types"
import type { CaptionAsset } from "@/types"

const TABLE = "caption_assets"

function generateId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function listCaptionAssets(): Promise<CaptionAsset[]> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .order("updated_at", { ascending: false })
  if (error) throw new Error(`caption_assets list 失敗: ${error.message}`)
  return (data ?? []).map(parseCaptionAsset)
}

export async function createCaptionAsset(
  input: CaptionAssetInsertInput
): Promise<CaptionAsset> {
  const sb = createServerClient()
  const row = {
    id: generateId(),
    ...serializeCaptionAsset(input),
  }
  const { data, error } = await sb
    .from(TABLE)
    .insert(row)
    .select("*")
    .single()
  if (error || !data) {
    throw new Error(`caption_assets insert 失敗: ${error?.message ?? "empty"}`)
  }
  return parseCaptionAsset(data)
}

export async function updateCaptionAsset(
  id: string,
  patch: Partial<CaptionAssetInsertInput>
): Promise<CaptionAsset> {
  const sb = createServerClient()
  const row: Partial<CaptionAssetRow> = {}
  if (patch.label !== undefined) row.label = patch.label
  if (patch.body !== undefined) row.body = patch.body
  if (patch.category !== undefined) row.category = patch.category ?? ""
  const { data, error } = await sb
    .from(TABLE)
    .update(row)
    .eq("id", id)
    .select("*")
    .single()
  if (error || !data) {
    throw new Error(`caption_assets update 失敗: ${error?.message ?? "not found"}`)
  }
  return parseCaptionAsset(data)
}

export async function deleteCaptionAsset(id: string): Promise<void> {
  const sb = createServerClient()
  const { error } = await sb.from(TABLE).delete().eq("id", id)
  if (error) throw new Error(`caption_assets delete 失敗: ${error.message}`)
}
