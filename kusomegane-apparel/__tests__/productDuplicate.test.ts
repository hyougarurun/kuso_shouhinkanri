import { describe, it, expect } from "vitest"
import { duplicateProduct } from "@/lib/productDuplicate"
import { makeProduct } from "./fixtures/product"
import { storage } from "@/lib/storage"

describe("productDuplicate (lib/productDuplicate.ts)", () => {
  it("TC-DUP-001: duplicateProduct は新しい id を持つ商品を返す", () => {
    const source = makeProduct({ id: "original-id" })
    storage.saveProducts([source])
    const dup = duplicateProduct(source)
    expect(dup.id).toBeDefined()
    expect(dup.id).not.toBe("original-id")
    expect(typeof dup.id).toBe("string")
    expect(dup.id.length).toBeGreaterThan(0)
  })

  it("TC-DUP-002: duplicateProduct は新しい productNumber を採番する", () => {
    const source = makeProduct({ id: "src", productNumber: "59", baseProductNumber: 59 })
    storage.saveProducts([source])
    const dup = duplicateProduct(source)
    expect(dup.productNumber).not.toBe("59")
    expect(dup.baseProductNumber).toBeGreaterThan(59)
  })

  it("TC-DUP-003: duplicateProduct は全項目をコピーする（名前・シリーズ・色等）", () => {
    const source = makeProduct({
      id: "src",
      name: "テスト商品",
      series: "テストシリーズ",
      colors: ["ブラック", "ホワイト"],
      sizes: ["S", "M", "L"],
      processingType: "DTF",
      bodyModelNumber: "5001-01",
      material: "綿100% 5.6oz",
      captionText: "キャプションテスト",
      imagePreview: "data:image/png;base64,abc",
    })
    storage.saveProducts([source])
    const dup = duplicateProduct(source)
    expect(dup.name).toBe("テスト商品")
    expect(dup.series).toBe("テストシリーズ")
    expect(dup.colors).toEqual(["ブラック", "ホワイト"])
    expect(dup.sizes).toEqual(["S", "M", "L"])
    expect(dup.processingType).toBe("DTF")
    expect(dup.bodyModelNumber).toBe("5001-01")
    expect(dup.material).toBe("綿100% 5.6oz")
    expect(dup.captionText).toBe("キャプションテスト")
    expect(dup.imagePreview).toBe("data:image/png;base64,abc")
  })

  it("TC-DUP-004: duplicateProduct は steps を全て pending にリセットする", () => {
    const source = makeProduct({ id: "src" })
    source.steps[0].status = "done"
    source.steps[1].status = "done"
    source.currentStep = 3
    storage.saveProducts([source])
    const dup = duplicateProduct(source)
    expect(dup.currentStep).toBe(1)
    for (const step of dup.steps) {
      expect(step.status).toBe("pending")
      expect(step.completedAt).toBeUndefined()
    }
  })

  it("TC-DUP-005: duplicateProduct は assets を全て pending にリセットする", () => {
    const source = makeProduct({ id: "src" })
    source.assets = {
      compositeImage: "done",
      processingImage: "done",
      aiWearingImage: "done",
      sizeDetailDone: true,
      captionDone: true,
    }
    storage.saveProducts([source])
    const dup = duplicateProduct(source)
    expect(dup.assets.compositeImage).toBe("pending")
    expect(dup.assets.processingImage).toBe("pending")
    expect(dup.assets.aiWearingImage).toBe("pending")
    expect(dup.assets.sizeDetailDone).toBe(false)
    expect(dup.assets.captionDone).toBe(false)
  })

  it("TC-DUP-006: duplicateProduct は createdAt/updatedAt を現在時刻にする", () => {
    const source = makeProduct({
      id: "src",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    })
    storage.saveProducts([source])
    const before = new Date().toISOString()
    const dup = duplicateProduct(source)
    const after = new Date().toISOString()
    expect(dup.createdAt >= before).toBe(true)
    expect(dup.createdAt <= after).toBe(true)
    expect(dup.updatedAt >= before).toBe(true)
    expect(dup.updatedAt <= after).toBe(true)
  })
})
