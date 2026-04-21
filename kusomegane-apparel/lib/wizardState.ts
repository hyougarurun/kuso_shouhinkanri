import {
  GalleryImage,
  ImageAnalysis,
  ProcessingDetails,
  Product,
  ProductEstimation,
} from "@/types"
import { DEFAULT_MATERIAL } from "@/constants"
import { emptyProcessingDetails } from "@/lib/processingSummary"
import type {
  EstimationResult,
  NormalizedLocation,
  NormalizedMethod,
} from "@/lib/print-cost/types"

export type WizardStep = 1 | 2 | 3

export interface WizardImage {
  dataUrl: string
  base64: string
  mediaType: "image/jpeg" | "image/png" | "image/webp"
}

export interface WizardBasic {
  name: string
  series: string
  productType: string
  colors: string[]
  sizes: string[]
  processingType: string
  processingInstruction: string
  processingDetails: ProcessingDetails
  bodyModelNumber: string
  material: string
  isMadeToOrder: boolean
  freeShipping: boolean
  notes: string
}

export interface WizardCaption {
  description: string
  designDesc: string
  fullText: string
}

export interface WizardEstimationLocation {
  location: NormalizedLocation
  method: NormalizedMethod | ""
}

export interface WizardEstimation {
  bodyCode: string
  color: string
  locations: WizardEstimationLocation[]
  result: EstimationResult | null
}

export interface WizardState {
  step: WizardStep
  image: WizardImage | null
  analysis: ImageAnalysis | null
  basic: WizardBasic
  caption: WizardCaption | null
  estimation: WizardEstimation | null
}

export function initialWizardState(): WizardState {
  return {
    step: 1,
    image: null,
    analysis: null,
    basic: {
      name: "",
      series: "",
      productType: "",
      colors: [],
      sizes: [],
      processingType: "",
      processingInstruction: "",
      processingDetails: emptyProcessingDetails(),
      bodyModelNumber: "",
      material: DEFAULT_MATERIAL,
      isMadeToOrder: true,
      freeShipping: true,
      notes: "",
    },
    caption: null,
    estimation: null,
  }
}

export function validateBasic(b: WizardBasic): string[] {
  const errors: string[] = []
  if (!b.name.trim()) errors.push("商品名を入力してください")
  if (b.colors.length === 0) errors.push("カラーを1つ以上選択してください")
  if (b.sizes.length === 0) errors.push("サイズを1つ以上選択してください")
  return errors
}

function estimationToProductEstimation(
  est: WizardEstimation,
  now: string,
): ProductEstimation | undefined {
  if (!est.result) return undefined
  const first = est.locations[0] ?? {
    location: "front" as const,
    method: "ink_print" as const,
  }
  return {
    bodyCode: est.bodyCode,
    color: est.color || undefined,
    location: first.location,
    method: first.method || "ink_print",
    bodyPriceRange: est.result.bodyPrice.range,
    bodyPriceMin: est.result.bodyPrice.minPrice,
    bodyPriceMax: est.result.bodyPrice.maxPrice,
    subtotalProcessing: est.result.subtotalProcessing,
    totalMin: est.result.totalMin,
    totalMax: est.result.totalMax,
    estimatedAt: now,
  }
}

export function wizardToProducts(
  state: WizardState,
  productNumbers: string[],
  baseNumber: number,
  makeId: () => string,
  now: string,
): Product[] {
  const { basic, image, caption, estimation } = state
  const captionText = caption?.fullText ?? ""
  const productEstimation = estimation
    ? estimationToProductEstimation(estimation, now)
    : undefined

  return productNumbers.map((num, idx) => {
    const hyphenIndex = num.indexOf("-")
    const colorIndex = hyphenIndex >= 0 ? idx : undefined
    const assignedColors =
      productNumbers.length > 1 ? [basic.colors[idx]] : [...basic.colors]
    // 登録画像を gallery 先頭に投入（商品詳細の Gallery セクションで即表示されるように）
    const gallery: GalleryImage[] = image
      ? [
          {
            id: `${num}-initial-${Date.now()}`,
            dataUrl: image.dataUrl,
            mimeType: image.mediaType,
            addedAt: now,
          },
        ]
      : []
    return {
      id: makeId(),
      productNumber: num,
      baseProductNumber: baseNumber,
      colorVariantIndex: colorIndex !== undefined ? colorIndex + 1 : undefined,
      name: basic.name.trim(),
      series: basic.series.trim(),
      productType: basic.productType,
      colors: assignedColors,
      sizes: [...basic.sizes],
      processingType: basic.processingType,
      processingInstruction: basic.processingInstruction,
      processingDetails: basic.processingDetails,
      bodyModelNumber: basic.bodyModelNumber,
      material: basic.material,
      isMadeToOrder: basic.isMadeToOrder,
      freeShipping: basic.freeShipping,
      notes: basic.notes,
      orderQuantities: {},
      driveFolderUrl: "",
      sheetRowNumbers: {},
      captionText,
      imagePreview: image?.dataUrl ?? null,
      gallery,
      currentStep: 2,
      steps: Array.from({ length: 8 }, (_, i) => ({
        stepNumber: i + 1,
        status: i + 1 <= 2 ? ("done" as const) : ("pending" as const),
        notes: "",
        completedAt: i + 1 <= 2 ? now : undefined,
      })),
      assets: {
        compositeImage: image ? ("uploaded" as const) : ("pending" as const),
        processingImage: "pending",
        aiWearingImage: "pending",
        sizeDetailDone: false,
        captionDone: captionText.length > 0,
      },
      estimation: productEstimation,
      createdAt: now,
      updatedAt: now,
    }
  })
}
