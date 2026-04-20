import { describe, it, expect } from "vitest"
import { makeProduct } from "./fixtures/product"
import { ensureImages } from "@/lib/migrateProduct"

describe("ensureImages（旧 images→gallery マイグレーション + images 廃止）", () => {
  it("gallery 空 / images 無し / imagePreview のみ → gallery は空、imagePreview は維持", () => {
    const product = makeProduct({ imagePreview: "data:image/png;base64,abc" })
    delete (product as unknown as Record<string, unknown>).images

    const result = ensureImages(product)
    expect(result.images).toBeUndefined()
    expect(result.gallery).toEqual([])
    expect(result.imagePreview).toBe("data:image/png;base64,abc")
  })

  it("gallery 空 / images に複数スロットあり → gallery に順番通りコピー、images 削除", () => {
    const product = makeProduct({
      imagePreview: null,
      images: {
        composite: "data:image/png;base64,c",
        processing: "data:image/png;base64,p",
        wearing: null,
        sizeDetail: "data:image/png;base64,s",
      },
    })

    const result = ensureImages(product)
    expect(result.images).toBeUndefined()
    expect(result.gallery).toHaveLength(3)
    expect(result.gallery?.[0].dataUrl).toBe("data:image/png;base64,c")
    expect(result.gallery?.[1].dataUrl).toBe("data:image/png;base64,p")
    expect(result.gallery?.[2].dataUrl).toBe("data:image/png;base64,s")
    // imagePreview は gallery[0] で上書きされる
    expect(result.imagePreview).toBe("data:image/png;base64,c")
  })

  it("gallery が既にある場合は gallery を温存、images だけ削除、imagePreview は gallery[0] で上書き", () => {
    const product = makeProduct({
      imagePreview: "old",
      gallery: [
        {
          id: "g1",
          dataUrl: "data:image/png;base64,existing",
          mimeType: "image/png",
          addedAt: "2026-04-20T00:00:00.000Z",
        },
      ],
      images: {
        composite: "should-be-ignored",
        processing: null,
        wearing: null,
        sizeDetail: null,
      },
    })

    const result = ensureImages(product)
    expect(result.images).toBeUndefined()
    expect(result.gallery).toHaveLength(1)
    expect(result.gallery?.[0].id).toBe("g1")
    expect(result.imagePreview).toBe("data:image/png;base64,existing")
  })

  it("元の product を変更しない（イミュータブル）", () => {
    const product = makeProduct({ imagePreview: "data:image/png;base64,abc" })
    delete (product as unknown as Record<string, unknown>).images

    const result = ensureImages(product)
    expect(result).not.toBe(product)
  })
})
