import type { Product, ProductEstimation } from "@/types"
import type { ProductEstimationJSON, ProductRow } from "./database.types"

function estimationToJSON(
  est?: ProductEstimation,
): ProductEstimationJSON | null {
  if (!est) return null
  return {
    bodyCode: est.bodyCode,
    color: est.color,
    location: est.location,
    method: est.method,
    bodyPriceRange: est.bodyPriceRange,
    bodyPriceMin: est.bodyPriceMin,
    bodyPriceMax: est.bodyPriceMax,
    subtotalProcessing: est.subtotalProcessing,
    totalMin: est.totalMin,
    totalMax: est.totalMax,
    estimatedAt: est.estimatedAt,
  }
}

/**
 * Product → products テーブル行（created_at / updated_at は DB 側で付与）。
 * steps / images / drive_files は別テーブルなので含めない。
 */
export function serializeProduct(
  product: Product,
): Omit<ProductRow, "created_at" | "updated_at"> {
  return {
    id: product.id,
    product_number: product.productNumber,
    base_product_number: product.baseProductNumber,
    color_variant_index: product.colorVariantIndex ?? null,

    name: product.name,
    series: product.series,
    product_type: product.productType,
    colors: product.colors,
    sizes: product.sizes,

    processing_type: product.processingType,
    processing_instruction: product.processingInstruction,
    body_model_number: product.bodyModelNumber,
    material: product.material,

    is_made_to_order: product.isMadeToOrder,
    free_shipping: product.freeShipping,
    notes: product.notes,

    order_quantities: product.orderQuantities as Record<string, number>,

    drive_folder_url: product.driveFolderUrl,
    sheet_row_number: product.sheetRowNumber ?? null,
    sheet_registered_at: product.sheetRegisteredAt ?? null,

    caption_text: product.captionText,

    current_step: product.currentStep,
    sample_arrival_date: product.sampleArrivalDate ?? null,

    estimation: estimationToJSON(product.estimation),
    assets: product.assets,

    image_preview: product.imagePreview,
  }
}
