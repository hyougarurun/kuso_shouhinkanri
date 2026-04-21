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

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  sizeBytes?: number
  webViewLink?: string
  uploadedAt: string
}

export interface GalleryImage {
  id: string
  dataUrl: string
  mimeType: string
  sizeBytes?: number
  addedAt: string
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
  plannedMonths?: string[]
  orderQuantities: OrderQuantities
  driveFolderUrl: string
  driveFiles?: DriveFile[]
  sheetRowNumbers: Record<string, number>
  sheetRegisteredAt?: string
  sheetRowNumber?: number
  captionText: string
  imagePreview: string | null
  images?: ProductImages
  gallery?: GalleryImage[]
  currentStep: number
  steps: FlowStep[]
  assets: ProductAssets
  sampleArrivalDate?: string
  estimation?: ProductEstimation
  createdAt: string
  updatedAt: string
}

export interface ProductEstimation {
  bodyCode: string
  color?: string
  location: string
  method: string
  bodyPriceRange: string
  bodyPriceMin?: number
  bodyPriceMax?: number
  subtotalProcessing: number
  totalMin?: number
  totalMax?: number
  estimatedAt: string
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

export type BaseModelGender = "male" | "female"
export type BaseModelPose = "front" | "back"
export type BaseModelGarmentType = "crewneck" | "hoodie" | "tshirt" | "longsleeve"

export interface BaseModel {
  id: string
  gender: BaseModelGender
  pose: BaseModelPose
  garmentType: BaseModelGarmentType
  garmentColor: string
  backgroundColor: string
  variantLabel: string
  storagePath: string
  bucket: string
  mimeType: string
  sizeBytes?: number
  width?: number
  height?: number
  isFavorite: boolean
  notes: string
  sourcePrompt: string
  sourceModel: string
  parentId?: string
  targetGarment?: BaseModelGarmentType
  generationPrompt: string
  generationModel: string
  createdAt: string
  updatedAt: string
}
