import { describe, it, expect } from "vitest"
import { makeProduct } from "./fixtures/product"
import { ensureImages } from "@/lib/migrateProduct"

describe("ensureImages", () => {
  it("images が undefined の場合、imagePreview から composite を補完する", () => {
    const product = makeProduct({ imagePreview: "data:image/png;base64,abc" })
    // images フィールドが無い状態
    delete (product as unknown as Record<string, unknown>).images

    const result = ensureImages(product)
    expect(result.images).toEqual({
      composite: "data:image/png;base64,abc",
      processing: null,
      wearing: null,
      sizeDetail: null,
    })
  })

  it("images が undefined で imagePreview も null の場合、全て null", () => {
    const product = makeProduct({ imagePreview: null })
    delete (product as unknown as Record<string, unknown>).images

    const result = ensureImages(product)
    expect(result.images).toEqual({
      composite: null,
      processing: null,
      wearing: null,
      sizeDetail: null,
    })
  })

  it("images が既にある場合はそのまま返す", () => {
    const images = {
      composite: "data:image/png;base64,xxx",
      processing: "data:image/png;base64,yyy",
      wearing: null,
      sizeDetail: null,
    }
    const product = makeProduct({ images })

    const result = ensureImages(product)
    expect(result.images).toEqual(images)
    expect(result).toBe(product) // 同一オブジェクトを返す
  })

  it("元のproductを変更しない（イミュータブル）", () => {
    const product = makeProduct({ imagePreview: "data:image/png;base64,abc" })
    delete (product as unknown as Record<string, unknown>).images

    const result = ensureImages(product)
    expect(result).not.toBe(product)
    expect(product.images).toBeUndefined()
  })
})
