import { Product, FlowStep } from "@/types"
import { FLOW_STEPS } from "@/constants"
import { storage } from "@/lib/storage"

function buildSteps(doneUpTo: number): FlowStep[] {
  return FLOW_STEPS.map((s) => ({
    stepNumber: s.id,
    status: s.id <= doneUpTo ? ("done" as const) : ("pending" as const),
    notes: "",
    completedAt: s.id <= doneUpTo ? "2026-04-10T00:00:00.000Z" : undefined,
  }))
}

function buildAssets(full: boolean) {
  return {
    compositeImage: full ? ("done" as const) : ("pending" as const),
    processingImage: full ? ("done" as const) : ("pending" as const),
    aiWearingImage: full ? ("done" as const) : ("pending" as const),
    sizeDetailDone: full,
    captionDone: full,
  }
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "seed-1",
    productNumber: "56",
    baseProductNumber: 56,
    name: "ポチクソ 1フェーズ",
    series: "ポチクソ",
    productType: "Tシャツ",
    colors: ["ブラック"],
    sizes: ["S", "M", "L", "XL"],
    processingType: "刺繍+DTF",
    processingInstruction: "前面に刺繍ロゴ、背面に DTF プリント",
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
    currentStep: 8,
    steps: buildSteps(8),
    assets: buildAssets(true),
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "seed-2",
    productNumber: "57-1",
    baseProductNumber: 57,
    colorVariantIndex: 1,
    name: "アリガトサン キャッチーロゴ",
    series: "アリガトサン",
    productType: "パーカー",
    colors: ["ブラック"],
    sizes: ["M", "L", "XL", "XXL"],
    processingType: "DTF",
    processingInstruction: "胸元に大判 DTF",
    bodyModelNumber: "5214-01",
    material: "綿100% 10.0oz",
    isMadeToOrder: true,
    freeShipping: true,
    notes: "",
    orderQuantities: {},
    driveFolderUrl: "",
    sheetRowNumbers: {},
    captionText: "",
    imagePreview: null,
    currentStep: 4,
    steps: buildSteps(3),
    assets: buildAssets(false),
    sampleArrivalDate: "2026-04-19",
    createdAt: "2026-04-05T00:00:00.000Z",
    updatedAt: "2026-04-14T00:00:00.000Z",
  },
  {
    id: "seed-3",
    productNumber: "58",
    baseProductNumber: 58,
    name: "ありがとさん 2025春",
    series: "ありがとさん",
    productType: "トートバッグ",
    colors: ["ナチュラル"],
    sizes: ["フリー"],
    processingType: "プリント（インク）",
    processingInstruction: "側面に単色インクプリント",
    bodyModelNumber: "1460-01",
    material: "コットンキャンバス",
    isMadeToOrder: false,
    freeShipping: true,
    notes: "",
    orderQuantities: {},
    driveFolderUrl: "",
    sheetRowNumbers: {},
    captionText: "",
    imagePreview: null,
    currentStep: 1,
    steps: buildSteps(0),
    assets: buildAssets(false),
    createdAt: "2026-04-16T00:00:00.000Z",
    updatedAt: "2026-04-16T00:00:00.000Z",
  },
]

export function seedIfEmpty(): void {
  if (typeof window === "undefined") return
  const existing = storage.getProducts()
  if (existing.length > 0) return
  storage.saveProducts(SAMPLE_PRODUCTS)
}
