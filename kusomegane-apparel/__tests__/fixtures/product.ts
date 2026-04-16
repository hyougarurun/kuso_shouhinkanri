import { Product, FlowStep } from "@/types"
import { FLOW_STEPS } from "@/constants"

function buildInitialSteps(): FlowStep[] {
  return FLOW_STEPS.map((s) => ({
    stepNumber: s.id,
    status: "pending" as const,
    notes: "",
  }))
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = "2026-04-16T00:00:00.000Z"
  const base: Product = {
    id: "test-id-" + Math.random().toString(36).slice(2, 10),
    productNumber: "59",
    baseProductNumber: 59,
    name: "ポチクソ 2フェーズ",
    series: "ポチクソ",
    productType: "Tシャツ",
    colors: ["ブラック"],
    sizes: ["S", "M", "L", "XL"],
    processingType: "DTF",
    processingInstruction: "",
    bodyModelNumber: "5001-01",
    material: "綿100% 5.6oz",
    isMadeToOrder: true,
    freeShipping: true,
    notes: "",
    orderQuantities: {},
    driveFolderUrl: "",
    sheetRowNumbers: {},
    captionText: "",
    imagePreview: null,
    currentStep: 1,
    steps: buildInitialSteps(),
    assets: {
      compositeImage: "pending",
      processingImage: "pending",
      aiWearingImage: "pending",
      sizeDetailDone: false,
      captionDone: false,
    },
    createdAt: now,
    updatedAt: now,
  }
  return { ...base, ...overrides }
}
