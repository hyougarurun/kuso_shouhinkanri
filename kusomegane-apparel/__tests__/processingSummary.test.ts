import { describe, it, expect } from "vitest"
import {
  buildProcessingSummary,
  emptyProcessingDetails,
  resolveProcessingCellText,
} from "@/lib/processingSummary"
import type { ProcessingDetails, Product } from "@/types"

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    productNumber: "59",
    baseProductNumber: 59,
    name: "テスト",
    series: "",
    productType: "",
    colors: [],
    sizes: [],
    processingType: "",
    processingInstruction: "",
    bodyModelNumber: "",
    material: "",
    isMadeToOrder: true,
    freeShipping: true,
    notes: "",
    orderQuantities: {},
    driveFolderUrl: "",
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
    createdAt: "",
    updatedAt: "",
    ...overrides,
  }
}

describe("buildProcessingSummary", () => {
  it("TC-PROC-001: タグ付け + 正面インク + 背面刺繍 を 1.2.3. 番号付きで返す", () => {
    const details: ProcessingDetails = {
      tagAttachment: true,
      front: "ink",
      back: "embroidery",
      sleeve: null,
    }
    expect(buildProcessingSummary(details)).toBe(
      "1.タグ付け\n2.正面インク\n3.背面刺繍",
    )
  })

  it("TC-PROC-002: 全て空 → 空文字", () => {
    expect(buildProcessingSummary(emptyProcessingDetails())).toBe("")
  })

  it("TC-PROC-003: 袖 DTF のみ → 1.袖DTF", () => {
    const details: ProcessingDetails = {
      tagAttachment: false,
      front: null,
      back: null,
      sleeve: "dtf",
    }
    expect(buildProcessingSummary(details)).toBe("1.袖DTF")
  })

  it("TC-PROC-004: タグ付けなし + 全方法埋め → 1.正面 2.背面 3.袖", () => {
    const details: ProcessingDetails = {
      tagAttachment: false,
      front: "ink",
      back: "embroidery",
      sleeve: "dtf",
    }
    expect(buildProcessingSummary(details)).toBe(
      "1.正面インク\n2.背面刺繍\n3.袖DTF",
    )
  })
})

describe("resolveProcessingCellText", () => {
  it("TC-PROC-005: processingDetails があればそれを優先", () => {
    const p = makeProduct({
      processingInstruction: "自由文",
      processingDetails: {
        tagAttachment: true,
        front: "ink",
        back: null,
        sleeve: null,
      },
    })
    expect(resolveProcessingCellText(p)).toBe("1.タグ付け\n2.正面インク")
  })

  it("TC-PROC-006: processingDetails が空 → processingInstruction にフォールバック", () => {
    const p = makeProduct({
      processingInstruction: "既存の自由文",
      processingDetails: emptyProcessingDetails(),
    })
    expect(resolveProcessingCellText(p)).toBe("既存の自由文")
  })

  it("TC-PROC-007: processingDetails 未設定 → processingInstruction", () => {
    const p = makeProduct({ processingInstruction: "旧データ" })
    expect(resolveProcessingCellText(p)).toBe("旧データ")
  })
})
