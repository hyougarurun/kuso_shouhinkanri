import { describe, it, expect } from "vitest"
import { getNextBaseNumber, assignProductNumbers } from "@/lib/productNumber"
import { storage } from "@/lib/storage"
import { makeProduct } from "./fixtures/product"

describe("productNumber (lib/productNumber.ts)", () => {
  it("TC-PN-001: LocalStorage が空のとき、次の商品番号は 59 になる", () => {
    // @critical
    const n = getNextBaseNumber()
    expect(n).toBe(59)
  })

  it("TC-PN-002: 既存商品の最大 baseProductNumber + 1 が返る（枝番を含む）", () => {
    // @critical
    storage.saveProducts([
      makeProduct({ id: "p1", productNumber: "58", baseProductNumber: 58 }),
      makeProduct({ id: "p2", productNumber: "60-2", baseProductNumber: 60 }),
    ])
    const n = getNextBaseNumber()
    expect(n).toBe(61)
  })

  it("TC-PN-003: assignProductNumbers はカラー1色のとき枝番なしを返す", () => {
    // @critical
    const nums = assignProductNumbers(59, ["ブラック"])
    expect(nums).toEqual(["59"])
  })

  it("TC-PN-004: assignProductNumbers はカラー複数のとき枝番付きを順序通り返す", () => {
    // @critical
    const nums = assignProductNumbers(59, ["ブラック", "ホワイト", "ネイビー"])
    expect(nums).toEqual(["59-1", "59-2", "59-3"])
  })
})
