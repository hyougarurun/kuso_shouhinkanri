import { Product } from "@/types"
import { getNextBaseNumber } from "@/lib/productNumber"
import { v4 as uuidv4 } from "uuid"

export function duplicateProduct(source: Product): Product {
  const now = new Date().toISOString()
  const newBase = getNextBaseNumber()

  return {
    ...source,
    id: uuidv4(),
    productNumber: String(newBase),
    baseProductNumber: newBase,
    colorVariantIndex: undefined,
    currentStep: 1,
    steps: source.steps.map((s) => ({
      ...s,
      status: "pending" as const,
      completedAt: undefined,
    })),
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
}
