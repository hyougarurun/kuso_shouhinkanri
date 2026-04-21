import { describe, it, expect } from "vitest"
import {
  serializeBaseModel,
  parseBaseModel,
  buildBaseModelStoragePath,
} from "@/lib/supabase/baseModelSerialize"
import type { BaseModel } from "@/types"
import type { BaseModelRow } from "@/lib/supabase/database.types"

function makeBaseModel(overrides: Partial<BaseModel> = {}): BaseModel {
  return {
    id: "bm-1",
    gender: "male",
    pose: "front",
    garmentType: "crewneck",
    garmentColor: "black",
    backgroundColor: "mustard yellow",
    variantLabel: "#01",
    storagePath: "bm-1/original.png",
    bucket: "base-models",
    mimeType: "image/png",
    sizeBytes: 1024,
    width: 768,
    height: 1024,
    isFavorite: false,
    notes: "",
    sourcePrompt: "Professional Japanese lookbook...",
    sourceModel: "nano-banana-pro",
    generationPrompt: "",
    generationModel: "",
    createdAt: "2026-04-21T00:00:00.000Z",
    updatedAt: "2026-04-21T00:00:00.000Z",
    ...overrides,
  }
}

describe("serializeBaseModel", () => {
  it("TC-BM-001: 全フィールドを Row 形式に変換する", () => {
    const bm = makeBaseModel()
    const row = serializeBaseModel(bm)
    expect(row).toEqual({
      id: "bm-1",
      gender: "male",
      pose: "front",
      garment_type: "crewneck",
      garment_color: "black",
      background_color: "mustard yellow",
      variant_label: "#01",
      storage_path: "bm-1/original.png",
      bucket: "base-models",
      mime_type: "image/png",
      size_bytes: 1024,
      width: 768,
      height: 1024,
      is_favorite: false,
      notes: "",
      source_prompt: "Professional Japanese lookbook...",
      source_model: "nano-banana-pro",
      parent_id: null,
      target_garment: null,
      generation_prompt: "",
      generation_model: "",
    })
  })

  it("TC-BM-002: sizeBytes / width / height undefined → null に正規化", () => {
    const bm = makeBaseModel({
      sizeBytes: undefined,
      width: undefined,
      height: undefined,
    })
    const row = serializeBaseModel(bm)
    expect(row.size_bytes).toBeNull()
    expect(row.width).toBeNull()
    expect(row.height).toBeNull()
  })
})

describe("parseBaseModel", () => {
  const baseRow: BaseModelRow = {
    id: "bm-1",
    gender: "female",
    pose: "back",
    garment_type: "hoodie",
    garment_color: "white",
    background_color: "orange red",
    variant_label: "#07",
    storage_path: "bm-1/hoodie.png",
    bucket: "base-models",
    mime_type: "image/png",
    size_bytes: 2048,
    width: 1024,
    height: 1536,
    is_favorite: true,
    notes: "good light",
    source_prompt: "some prompt",
    source_model: "nano-banana-pro",
    parent_id: null,
    target_garment: null,
    generation_prompt: "",
    generation_model: "",
    created_at: "2026-04-21T01:00:00.000Z",
    updated_at: "2026-04-21T02:00:00.000Z",
  }

  it("TC-BM-003: Row → BaseModel に変換する", () => {
    const bm = parseBaseModel(baseRow)
    expect(bm).toEqual({
      id: "bm-1",
      gender: "female",
      pose: "back",
      garmentType: "hoodie",
      garmentColor: "white",
      backgroundColor: "orange red",
      variantLabel: "#07",
      storagePath: "bm-1/hoodie.png",
      bucket: "base-models",
      mimeType: "image/png",
      sizeBytes: 2048,
      width: 1024,
      height: 1536,
      isFavorite: true,
      notes: "good light",
      sourcePrompt: "some prompt",
      sourceModel: "nano-banana-pro",
      generationPrompt: "",
      generationModel: "",
      createdAt: "2026-04-21T01:00:00.000Z",
      updatedAt: "2026-04-21T02:00:00.000Z",
    })
  })

  it("TC-BM-004: null フィールドは undefined に変換される", () => {
    const row: BaseModelRow = {
      ...baseRow,
      size_bytes: null,
      width: null,
      height: null,
    }
    const bm = parseBaseModel(row)
    expect(bm.sizeBytes).toBeUndefined()
    expect(bm.width).toBeUndefined()
    expect(bm.height).toBeUndefined()
  })
})

describe("buildBaseModelStoragePath", () => {
  it("TC-BM-005: <id>/<uniqueId>.<ext> 形式で、拡張子のドットは除去される", () => {
    const path = buildBaseModelStoragePath("bm-1", "abc123", ".png")
    expect(path).toBe("bm-1/abc123.png")
  })

  it("TC-BM-006: 拡張子は小文字化される", () => {
    const path = buildBaseModelStoragePath("bm-2", "xyz", "PNG")
    expect(path).toBe("bm-2/xyz.png")
  })
})
