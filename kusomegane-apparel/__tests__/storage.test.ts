import { describe, it, expect } from "vitest"
import { storage } from "@/lib/storage"
import { makeProduct } from "./fixtures/product"

describe("storage (lib/storage.ts)", () => {
  it("TC-STR-001: getProducts が初回呼び出し時に空配列を返す", () => {
    // @critical
    const result = storage.getProducts()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([])
  })

  it("TC-STR-002: saveProducts で保存したデータが getProducts で取得できる", () => {
    // @critical
    const p = makeProduct({ id: "p1", productNumber: "59" })
    storage.saveProducts([p])
    const result = storage.getProducts()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("p1")
    expect(result[0].productNumber).toBe("59")
    expect(Array.isArray(result[0].colors)).toBe(true)
  })

  it("TC-STR-003: upsertProduct が新規商品を先頭に追加する", () => {
    // @critical
    storage.saveProducts([makeProduct({ id: "A", productNumber: "59" })])
    storage.upsertProduct(makeProduct({ id: "B", productNumber: "60" }))
    const result = storage.getProducts()
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("B")
    expect(result[1].id).toBe("A")
    expect(() => new Date(result[0].updatedAt).toISOString()).not.toThrow()
    expect(result[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("TC-STR-004: upsertProduct が既存 ID の商品を更新する", () => {
    // @critical
    storage.saveProducts([
      makeProduct({ id: "X", name: "旧名", updatedAt: "2026-01-01T00:00:00.000Z" }),
    ])
    storage.upsertProduct(makeProduct({ id: "X", name: "新名" }))
    const result = storage.getProducts()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("新名")
    expect(result[0].updatedAt).not.toBe("2026-01-01T00:00:00.000Z")
  })

  it("TC-STR-005: deleteProduct で指定 ID の商品が削除される", () => {
    // @critical
    storage.saveProducts([
      makeProduct({ id: "A" }),
      makeProduct({ id: "B" }),
    ])
    storage.deleteProduct("A")
    const result = storage.getProducts()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("B")
  })

  it("TC-STR-006: getDraft/saveDraft/clearDraft が正しく動作する", () => {
    expect(storage.getDraft()).toBeNull()
    storage.saveDraft({ name: "下書き" })
    expect(storage.getDraft()).toEqual({ name: "下書き" })
    storage.clearDraft()
    expect(storage.getDraft()).toBeNull()
  })
})
