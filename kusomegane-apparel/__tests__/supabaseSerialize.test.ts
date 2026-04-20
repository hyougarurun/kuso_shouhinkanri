import { describe, it, expect } from "vitest"
import { serializeProduct } from "@/lib/supabase/serialize"
import { parseProduct } from "@/lib/supabase/parse"
import type { Product } from "@/types"
import type { ProductRow, ProductStepRow } from "@/lib/supabase/database.types"

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    productNumber: "59",
    baseProductNumber: 59,
    name: "テスト商品",
    series: "シリーズA",
    productType: "Tシャツ",
    colors: ["ホワイト"],
    sizes: ["M", "L"],
    processingType: "インク",
    processingInstruction: "正面ワンポイント",
    bodyModelNumber: "5001-01",
    material: "コットン",
    isMadeToOrder: true,
    freeShipping: true,
    notes: "備考",
    orderQuantities: { M: 10, L: 5 },
    driveFolderUrl: "",
    sheetRowNumbers: {},
    captionText: "",
    imagePreview: null,
    currentStep: 2,
    steps: [],
    assets: {
      compositeImage: "uploaded",
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

describe("serializeProduct", () => {
  it("TC-SB-005: Product → DB 行へ正しく変換する", () => {
    const row = serializeProduct(makeProduct())

    expect(row.id).toBe("p1")
    expect(row.product_number).toBe("59")
    expect(row.base_product_number).toBe(59)
    expect(row.color_variant_index).toBeNull()
    expect(row.name).toBe("テスト商品")
    expect(row.colors).toEqual(["ホワイト"])
    expect(row.sizes).toEqual(["M", "L"])
    expect(row.body_model_number).toBe("5001-01")
    expect(row.is_made_to_order).toBe(true)
    expect(row.order_quantities).toEqual({ M: 10, L: 5 })
    expect(row.sheet_row_number).toBeNull()
    expect(row.sheet_registered_at).toBeNull()
    expect(row.estimation).toBeNull()
    expect(row.sample_arrival_date).toBeNull()
    expect(row.assets.compositeImage).toBe("uploaded")
  })

  it("estimation を含む Product を JSON に変換", () => {
    const product = makeProduct({
      estimation: {
        bodyCode: "5001-01",
        color: "ホワイト",
        location: "front",
        method: "ink_print",
        bodyPriceRange: "633〜955",
        bodyPriceMin: 633,
        bodyPriceMax: 955,
        subtotalProcessing: 1800,
        totalMin: 2433,
        totalMax: 2755,
        estimatedAt: "2026-04-20T00:00:00.000Z",
      },
    })
    const row = serializeProduct(product)
    expect(row.estimation).not.toBeNull()
    expect(row.estimation?.totalMin).toBe(2433)
    expect(row.estimation?.bodyCode).toBe("5001-01")
  })
})

describe("parseProduct", () => {
  function makeRow(overrides: Partial<ProductRow> = {}): ProductRow {
    const baseRow = serializeProduct(makeProduct())
    return {
      ...baseRow,
      created_at: "2026-04-20T00:00:00.000Z",
      updated_at: "2026-04-20T01:00:00.000Z",
      ...overrides,
    } as ProductRow
  }

  it("TC-SB-006: DB 行 + steps → Product 型へ正しく変換する", () => {
    const steps: ProductStepRow[] = [
      {
        id: "s2",
        product_id: "p1",
        step_number: 2,
        status: "in_progress",
        completed_at: null,
        notes: "",
      },
      {
        id: "s1",
        product_id: "p1",
        step_number: 1,
        status: "done",
        completed_at: "2026-04-20T00:00:00.000Z",
        notes: "",
      },
    ]
    const product = parseProduct(makeRow(), steps)

    expect(product.id).toBe("p1")
    expect(product.productNumber).toBe("59")
    expect(product.colors).toEqual(["ホワイト"])
    // steps は step_number 順にソートされる
    expect(product.steps.map((s) => s.stepNumber)).toEqual([1, 2])
    expect(product.steps[0].status).toBe("done")
    expect(product.steps[0].completedAt).toBe("2026-04-20T00:00:00.000Z")
    expect(product.steps[1].status).toBe("in_progress")
    expect(product.sheetRowNumber).toBeUndefined()
    expect(product.sheetRegisteredAt).toBeUndefined()
    expect(product.estimation).toBeUndefined()
    expect(product.sampleArrivalDate).toBeUndefined()
    expect(product.assets.compositeImage).toBe("uploaded")
  })

  it("estimation がラウンドトリップで復元される", () => {
    const original = makeProduct({
      sampleArrivalDate: "2026-05-01",
      estimation: {
        bodyCode: "5001-01",
        color: "ホワイト",
        location: "front",
        method: "ink_print",
        bodyPriceRange: "633〜955",
        bodyPriceMin: 633,
        bodyPriceMax: 955,
        subtotalProcessing: 1800,
        totalMin: 2433,
        totalMax: 2755,
        estimatedAt: "2026-04-20T00:00:00.000Z",
      },
    })
    const row = makeRow(serializeProduct(original))
    const restored = parseProduct(row, [])

    expect(restored.sampleArrivalDate).toBe("2026-05-01")
    expect(restored.estimation?.totalMin).toBe(2433)
    expect(restored.estimation?.bodyCode).toBe("5001-01")
  })
})
