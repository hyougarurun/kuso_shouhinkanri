export type StepStatus = "pending" | "in_progress" | "done"
export type AssetStatus = "pending" | "uploaded" | "generated" | "done"

export type ProductType =
  | "Tシャツ"
  | "パーカー"
  | "スウェット"
  | "ロンT"
  | "トートバッグ"
  | "キャップ"
  | "その他"

export type ProcessingType =
  | "刺繍"
  | "プリント（インク）"
  | "DTF"
  | "転写"
  | "刺繍+インク"
  | "刺繍+DTF"
  | "その他"

export interface FlowStep {
  stepNumber: number
  status: StepStatus
  completedAt?: string
  notes: string
}

export interface ProductAssets {
  compositeImage: AssetStatus
  processingImage: AssetStatus
  aiWearingImage: AssetStatus
  sizeDetailDone: boolean
  captionDone: boolean
}

export interface ProductImages {
  composite: string | null
  processing: string | null
  wearing: string | null
  sizeDetail: string | null
}

export interface OrderQuantities {
  S?: number
  M?: number
  L?: number
  XL?: number
  XXL?: number
}

export interface Product {
  id: string
  productNumber: string
  baseProductNumber: number
  colorVariantIndex?: number
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
  orderQuantities: OrderQuantities
  driveFolderUrl: string
  sheetRowNumbers: Record<string, number>
  captionText: string
  imagePreview: string | null
  images?: ProductImages
  currentStep: number
  steps: FlowStep[]
  assets: ProductAssets
  sampleArrivalDate?: string
  createdAt: string
  updatedAt: string
}

export interface ImageAnalysis {
  productType: string
  bodyColor: string
  designElements: string
  processingHint: string
  overallVibe: string
}

export type CountdownColor = "normal" | "yellow" | "red"

export interface SampleCountdown {
  daysLeft: number
  color: CountdownColor
}
