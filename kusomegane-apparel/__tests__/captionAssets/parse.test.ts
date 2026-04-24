import { describe, it, expect } from "vitest"
import {
  parseCaptionAsset,
  serializeCaptionAsset,
} from "@/lib/supabase/captionAssetsParse"
import type { CaptionAssetRow } from "@/lib/supabase/database.types"

describe("captionAssets parse/serialize", () => {
  it("TC-AS-009: parseCaptionAsset — DB Row → TS", () => {
    const row: CaptionAssetRow = {
      id: "asset_1",
      label: "L",
      body: "B",
      category: "C",
      created_at: "2026-04-24T10:00:00Z",
      updated_at: "2026-04-24T11:00:00Z",
    }
    expect(parseCaptionAsset(row)).toEqual({
      id: "asset_1",
      label: "L",
      body: "B",
      category: "C",
      createdAt: "2026-04-24T10:00:00Z",
      updatedAt: "2026-04-24T11:00:00Z",
    })
  })

  it("TC-AS-010: serializeCaptionAsset — insert 用に label/body/category のみ", () => {
    const result = serializeCaptionAsset({
      label: "L",
      body: "B",
      category: "C",
    })
    expect(result).toEqual({ label: "L", body: "B", category: "C" })
    // id/created_at/updated_at は含まない
    expect(result).not.toHaveProperty("id")
    expect(result).not.toHaveProperty("created_at")
    expect(result).not.toHaveProperty("updated_at")
  })

  it("TC-AS-011: serializeCaptionAsset — category undefined は空文字に正規化", () => {
    expect(
      serializeCaptionAsset({ label: "L", body: "B", category: undefined })
    ).toEqual({ label: "L", body: "B", category: "" })
  })
})
