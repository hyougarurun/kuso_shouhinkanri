import { describe, it, expect } from "vitest"
import {
  getNextBaseNumber,
  assignProductNumbers,
  findConflictingProduct,
} from "@/lib/productNumber"
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

  it("TC-PN-003 (改): assignProductNumbers はカラー数によらず常に [base] を返す（Phase E2）", () => {
    // @critical
    expect(assignProductNumbers(59, ["ブラック"])).toEqual(["59"])
    expect(
      assignProductNumbers(59, ["ブラック", "ホワイト", "ネイビー"])
    ).toEqual(["59"])
  })

  it("TC-PN-004 (改): assignProductNumbers はカラー 0 件でも [base] を返す", () => {
    // @critical
    expect(assignProductNumbers(59, [])).toEqual(["59"])
  })
})

describe("findConflictingProduct (Phase E1)", () => {
  it("TC-PNC-001: 競合なし → null", () => {
    const products = [
      makeProduct({ id: "a", productNumber: "58" }),
      makeProduct({ id: "b", productNumber: "60" }),
    ]
    expect(findConflictingProduct("59", "a", products)).toBeNull()
  })

  it("TC-PNC-002: 自分自身は競合扱いしない", () => {
    const products = [makeProduct({ id: "a", productNumber: "58" })]
    expect(findConflictingProduct("58", "a", products)).toBeNull()
  })

  it("TC-PNC-003: 他商品と完全一致 → その商品を返す", () => {
    const products = [
      makeProduct({ id: "a", productNumber: "58" }),
      makeProduct({ id: "b", productNumber: "60" }),
    ]
    const hit = findConflictingProduct("60", "a", products)
    expect(hit?.id).toBe("b")
  })

  it("TC-PNC-004: 前後 trim して比較", () => {
    const products = [makeProduct({ id: "a", productNumber: "58" })]
    expect(findConflictingProduct("  58  ", "x", products)?.id).toBe("a")
  })

  it("TC-PNC-005: candidate が空文字 / 空白のみ → null", () => {
    const products = [makeProduct({ id: "a", productNumber: "58" })]
    expect(findConflictingProduct("", "x", products)).toBeNull()
    expect(findConflictingProduct("   ", "x", products)).toBeNull()
  })
})
