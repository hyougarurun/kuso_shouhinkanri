import { describe, it, expect } from "vitest"
import { buildRowValues } from "@/lib/google/sheets"
import type { Product } from "@/types"

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    productNumber: "59",
    baseProductNumber: 59,
    name: "テスト",
    series: "",
    productType: "Tシャツ",
    colors: ["ホワイト", "ブラック"],
    sizes: ["M", "L", "XL"],
    processingType: "インク",
    processingInstruction: "①タグ付け\n②正面：インク",
    bodyModelNumber: "5001-01",
    material: "",
    isMadeToOrder: true,
    freeShipping: true,
    notes: "メモ",
    orderQuantities: {},
    driveFolderUrl: "https://drive.google.com/drive/folders/abc",
    sheetRowNumbers: {},
    captionText: "",
    imagePreview: null,
    currentStep: 1,
    steps: [],
    assets: {
      compositeImage: "pending",
      processingImage: "pending",
      aiWearingImage: "pending",
      sizeDetailDone: false,
      captionDone: false,
    },
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    ...overrides,
  }
}

describe("buildRowValues", () => {
  it("TC-SHEETS-001: 8 列（A〜H）を正しく組み立てる", () => {
    const row = buildRowValues(makeProduct())
    expect(row).toHaveLength(8)
    expect(row[0]).toBe("") // A: 商品（画像欄、将来 =IMAGE()）
    expect(row[1]).toBe("59") // B: 商品番号
    expect(row[2]).toBe("ホワイト・ブラック") // C: 色
    expect(row[3]).toBe("M・L・XL") // D: サイズ
    expect(row[4]).toBe("①タグ付け\n②正面：インク") // E: 加工
    expect(row[5]).toBe("5001-01") // F: ボディ型番
    expect(row[6]).toBe("https://drive.google.com/drive/folders/abc") // G
    expect(row[7]).toBe("メモ") // H: 備考
  })

  it("TC-SHEETS-002: 空配列や空文字は空文字で埋まる", () => {
    const row = buildRowValues(
      makeProduct({
        colors: [],
        sizes: [],
        processingInstruction: "",
        bodyModelNumber: "",
        driveFolderUrl: "",
        notes: "",
      }),
    )
    expect(row).toEqual(["", "59", "", "", "", "", "", ""])
  })

  it("TC-SHEETS-003: 枝番商品（20-1）も B 列に文字列でそのまま入る", () => {
    const row = buildRowValues(makeProduct({ productNumber: "20-1" }))
    expect(row[1]).toBe("20-1")
  })
})
