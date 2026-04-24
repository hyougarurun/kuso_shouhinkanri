/**
 * Supabase Postgres スキーマ型定義（Phase 1.1 手書き版）。
 * migration: supabase/migrations/20260420000001_init_products_schema.sql
 * 将来は `supabase gen types typescript --linked` で自動生成に置き換える。
 */

import type {
  AssetStatus,
  BaseModelGarmentType,
  BaseModelGender,
  BaseModelPose,
  StepStatus,
} from "@/types"

export type StepStatusDB = StepStatus
export type ImageSlotDB = "composite" | "processing" | "wearing" | "sizeDetail"

export type BaseModelGenderDB = BaseModelGender
export type BaseModelPoseDB = BaseModelPose
export type BaseModelGarmentTypeDB = BaseModelGarmentType

export type ProductAssetsJSON = {
  compositeImage: AssetStatus
  processingImage: AssetStatus
  aiWearingImage: AssetStatus
  sizeDetailDone: boolean
  captionDone: boolean
}

export type ProductEstimationJSON = {
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

export type ProductRow = {
  id: string
  product_number: string
  base_product_number: number
  color_variant_index: number | null

  name: string
  series: string
  product_type: string
  colors: string[]
  sizes: string[]

  processing_type: string
  processing_instruction: string
  body_model_number: string
  material: string

  is_made_to_order: boolean
  free_shipping: boolean
  notes: string

  order_quantities: Record<string, number>

  drive_folder_url: string
  sheet_row_number: number | null
  sheet_registered_at: string | null

  caption_text: string

  current_step: number
  sample_arrival_date: string | null

  estimation: ProductEstimationJSON | null
  assets: ProductAssetsJSON

  image_preview: string | null

  created_at: string
  updated_at: string
}

export type ProductStepRow = {
  id: string
  product_id: string
  step_number: number
  status: StepStatusDB
  completed_at: string | null
  notes: string
}

export type ProductImageRow = {
  id: string
  product_id: string
  slot: ImageSlotDB
  storage_path: string
  bucket: string
  mime_type: string
  size_bytes: number | null
  sort_order: number
  is_primary: boolean
  created_at: string
}

export type ProductGalleryItemRow = {
  id: string
  product_id: string
  storage_path: string
  bucket: string
  mime_type: string
  size_bytes: number | null
  width: number | null
  height: number | null
  sort_order: number
  created_at: string
}

export type ProductDriveFileRow = {
  id: string
  product_id: string
  drive_file_id: string
  name: string
  mime_type: string
  size_bytes: number | null
  web_view_link: string | null
  uploaded_at: string
}

export type AnimatorProjectRow = {
  id: string
  name: string
  folder: string
  frame_count: number
  fps: number | null
  platform: string | null
  motion_id: string | null
  data_path: string
  thumbnail_path: string | null
  size_bytes: number | null
  created_at: string
  updated_at: string
}

export type AnimatorAssetRow = {
  id: string
  name: string
  folder: string
  format: string | null
  size_kb: number | null
  data_path: string
  thumbnail_path: string | null
  created_at: string
}

export type AnimatorFolderRow = {
  id: string
  name: string
  tab: string
  parent: string
  created_at: string
}

export type CreatorBackgroundRow = {
  id: string
  storage_path: string
  bucket: string
  mime_type: string
  size_bytes: number | null
  width: number | null
  height: number | null
  source_storage_path: string | null
  source_mime_type: string | null
  prompt: string
  model: string
  quality: string
  title: string
  is_favorite: boolean
  notes: string
  created_at: string
  updated_at: string
}

export type CaptionAssetRow = {
  id: string
  label: string
  body: string
  category: string
  created_at: string
  updated_at: string
}

export type BaseModelRow = {
  id: string
  gender: BaseModelGenderDB
  pose: BaseModelPoseDB
  garment_type: BaseModelGarmentTypeDB
  garment_color: string
  background_color: string
  variant_label: string
  storage_path: string
  bucket: string
  mime_type: string
  size_bytes: number | null
  width: number | null
  height: number | null
  is_favorite: boolean
  notes: string
  source_prompt: string
  source_model: string
  parent_id: string | null
  target_garment: BaseModelGarmentTypeDB | null
  generation_prompt: string
  generation_model: string
  created_at: string
  updated_at: string
}

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      products: {
        Row: ProductRow
        Insert: Omit<ProductRow, "created_at" | "updated_at"> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<ProductRow>
        Relationships: []
      }
      product_steps: {
        Row: ProductStepRow
        Insert: Omit<ProductStepRow, "id"> & { id?: string }
        Update: Partial<ProductStepRow>
        Relationships: []
      }
      product_images: {
        Row: ProductImageRow
        Insert: Omit<ProductImageRow, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<ProductImageRow>
        Relationships: []
      }
      product_gallery_items: {
        Row: ProductGalleryItemRow
        Insert: Omit<ProductGalleryItemRow, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<ProductGalleryItemRow>
        Relationships: []
      }
      product_drive_files: {
        Row: ProductDriveFileRow
        Insert: Omit<ProductDriveFileRow, "id" | "uploaded_at"> & {
          id?: string
          uploaded_at?: string
        }
        Update: Partial<ProductDriveFileRow>
        Relationships: []
      }
      animator_projects: {
        Row: AnimatorProjectRow
        Insert: Omit<AnimatorProjectRow, "created_at" | "updated_at"> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<AnimatorProjectRow>
        Relationships: []
      }
      animator_assets: {
        Row: AnimatorAssetRow
        Insert: Omit<AnimatorAssetRow, "created_at"> & {
          created_at?: string
        }
        Update: Partial<AnimatorAssetRow>
        Relationships: []
      }
      animator_folders: {
        Row: AnimatorFolderRow
        Insert: Omit<AnimatorFolderRow, "created_at"> & {
          created_at?: string
        }
        Update: Partial<AnimatorFolderRow>
        Relationships: []
      }
      creator_backgrounds: {
        Row: CreatorBackgroundRow
        Insert: Omit<CreatorBackgroundRow, "id" | "created_at" | "updated_at"> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<CreatorBackgroundRow>
        Relationships: []
      }
      base_models: {
        Row: BaseModelRow
        Insert: Omit<BaseModelRow, "id" | "created_at" | "updated_at"> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<BaseModelRow>
        Relationships: []
      }
      caption_assets: {
        Row: CaptionAssetRow
        Insert: Omit<CaptionAssetRow, "created_at" | "updated_at"> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<CaptionAssetRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
