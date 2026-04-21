import { randomUUID } from "node:crypto"
import type { BaseModel } from "@/types"
import { createServerClient } from "./server"
import {
  buildBaseModelStoragePath,
  parseBaseModel,
  serializeBaseModel,
} from "./baseModelSerialize"

const BUCKET = "base-models"
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2 // 2h

export interface CreateBaseModelInput {
  gender: BaseModel["gender"]
  pose: BaseModel["pose"]
  garmentType: BaseModel["garmentType"]
  garmentColor: string
  backgroundColor: string
  variantLabel: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  sourcePrompt?: string
  sourceModel?: string
  fileBuffer: ArrayBuffer
  fileExtension: string
}

export async function createBaseModel(
  input: CreateBaseModelInput,
): Promise<BaseModel> {
  const sb = createServerClient()
  const id = randomUUID()
  const uniqueId = randomUUID()
  const storagePath = buildBaseModelStoragePath(id, uniqueId, input.fileExtension)

  const { error: uploadError } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, input.fileBuffer, {
      contentType: input.mimeType,
      upsert: false,
    })
  if (uploadError) {
    throw new Error(`Storage upload 失敗: ${uploadError.message}`)
  }

  const bm: BaseModel = {
    id,
    gender: input.gender,
    pose: input.pose,
    garmentType: input.garmentType,
    garmentColor: input.garmentColor,
    backgroundColor: input.backgroundColor,
    variantLabel: input.variantLabel,
    storagePath,
    bucket: BUCKET,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    width: input.width,
    height: input.height,
    isFavorite: false,
    notes: "",
    sourcePrompt: input.sourcePrompt ?? "",
    sourceModel: input.sourceModel ?? "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const row = serializeBaseModel(bm)
  const { data, error } = await sb
    .from("base_models")
    .insert(row)
    .select()
    .single()

  if (error) {
    await sb.storage.from(BUCKET).remove([storagePath])
    throw new Error(`DB insert 失敗: ${error.message}`)
  }
  return parseBaseModel(data)
}

export interface ListBaseModelsOptions {
  gender?: BaseModel["gender"]
  pose?: BaseModel["pose"]
  garmentType?: BaseModel["garmentType"]
  onlyFavorite?: boolean
}

export interface BaseModelWithUrl extends BaseModel {
  signedUrl: string
}

export async function listBaseModels(
  options: ListBaseModelsOptions = {},
): Promise<BaseModelWithUrl[]> {
  const sb = createServerClient()
  let q = sb.from("base_models").select("*").order("created_at", { ascending: false })
  if (options.gender) q = q.eq("gender", options.gender)
  if (options.pose) q = q.eq("pose", options.pose)
  if (options.garmentType) q = q.eq("garment_type", options.garmentType)
  if (options.onlyFavorite) q = q.eq("is_favorite", true)

  const { data, error } = await q
  if (error) throw new Error(`DB query 失敗: ${error.message}`)

  const rows = data ?? []
  const results: BaseModelWithUrl[] = []
  for (const row of rows) {
    const bm = parseBaseModel(row)
    const signed = await sb.storage
      .from(bm.bucket)
      .createSignedUrl(bm.storagePath, SIGNED_URL_TTL_SECONDS)
    results.push({
      ...bm,
      signedUrl: signed.data?.signedUrl ?? "",
    })
  }
  return results
}

export async function updateBaseModel(
  id: string,
  patch: { isFavorite?: boolean; notes?: string },
): Promise<BaseModel> {
  const sb = createServerClient()
  const update: { is_favorite?: boolean; notes?: string } = {}
  if (patch.isFavorite !== undefined) update.is_favorite = patch.isFavorite
  if (patch.notes !== undefined) update.notes = patch.notes

  const { data, error } = await sb
    .from("base_models")
    .update(update)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(`DB update 失敗: ${error.message}`)
  return parseBaseModel(data)
}

export async function deleteBaseModel(id: string): Promise<void> {
  const sb = createServerClient()
  const { data, error: selectErr } = await sb
    .from("base_models")
    .select("storage_path, bucket")
    .eq("id", id)
    .single()
  if (selectErr) throw new Error(`DB select 失敗: ${selectErr.message}`)

  const { error: delErr } = await sb.from("base_models").delete().eq("id", id)
  if (delErr) throw new Error(`DB delete 失敗: ${delErr.message}`)

  await sb.storage.from(data.bucket).remove([data.storage_path])
}
