import { ImageAnalysis, Product } from "@/types"
import { DEFAULT_MATERIAL } from "@/constants"

export type WizardStep = 1 | 2 | 3 | 4

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

export interface WizardState {
  step: WizardStep
  image: WizardImage | null
  analysis: ImageAnalysis | null
  basic: WizardBasic
  caption: WizardCaption | null
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
      bodyModelNumber: "",
      material: DEFAULT_MATERIAL,
      isMadeToOrder: true,
      freeShipping: true,
      notes: "",
    },
    caption: null,
  }
}

export function validateBasic(b: WizardBasic): string[] {
  const errors: string[] = []
  if (!b.name.trim()) errors.push("商品名を入力してください")
  if (b.colors.length === 0) errors.push("カラーを1つ以上選択してください")
  if (b.sizes.length === 0) errors.push("サイズを1つ以上選択してください")
  return errors
}

export function wizardToProducts(
  state: WizardState,
  productNumbers: string[],
  baseNumber: number,
  makeId: () => string,
  now: string
): Product[] {
  const { basic, image, caption } = state
  const captionText = caption?.fullText ?? ""
  return productNumbers.map((num, idx) => {
    const hyphenIndex = num.indexOf("-")
    const colorIndex = hyphenIndex >= 0 ? idx : undefined
    const assignedColors =
      productNumbers.length > 1 ? [basic.colors[idx]] : [...basic.colors]
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
      createdAt: now,
      updatedAt: now,
    }
  })
}
