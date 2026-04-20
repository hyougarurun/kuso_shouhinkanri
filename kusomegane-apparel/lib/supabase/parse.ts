import type { FlowStep, Product, ProductEstimation } from "@/types"
import type { ProductEstimationJSON, ProductRow, ProductStepRow } from "./database.types"

function jsonToEstimation(
  json: ProductEstimationJSON | null,
): ProductEstimation | undefined {
  if (!json) return undefined
  return {
    bodyCode: json.bodyCode,
    color: json.color,
    location: json.location,
    method: json.method,
    bodyPriceRange: json.bodyPriceRange,
    bodyPriceMin: json.bodyPriceMin,
    bodyPriceMax: json.bodyPriceMax,
    subtotalProcessing: json.subtotalProcessing,
    totalMin: json.totalMin,
    totalMax: json.totalMax,
    estimatedAt: json.estimatedAt,
  }
}

/**
 * DB 行 + ステップ配列 → Product 型（UI 層で扱う形）。
 * 画像 / Drive ファイルは別途取得する想定（現行 UI は LocalStorage 依存のため）。
 */
export function parseProduct(
  row: ProductRow,
  steps: ProductStepRow[],
): Product {
  const flowSteps: FlowStep[] = [...steps]
    .sort((a, b) => a.step_number - b.step_number)
    .map((s) => ({
      stepNumber: s.step_number,
      status: s.status,
      completedAt: s.completed_at ?? undefined,
      notes: s.notes,
    }))

  return {
    id: row.id,
    productNumber: row.product_number,
    baseProductNumber: row.base_product_number,
    colorVariantIndex: row.color_variant_index ?? undefined,

    name: row.name,
    series: row.series,
    productType: row.product_type,
    colors: row.colors,
    sizes: row.sizes,

    processingType: row.processing_type,
    processingInstruction: row.processing_instruction,
    bodyModelNumber: row.body_model_number,
    material: row.material,

    isMadeToOrder: row.is_made_to_order,
    freeShipping: row.free_shipping,
    notes: row.notes,

    orderQuantities: row.order_quantities,

    driveFolderUrl: row.drive_folder_url,
    sheetRowNumbers: {}, // レガシー互換、Phase 2 で削除予定
    sheetRowNumber: row.sheet_row_number ?? undefined,
    sheetRegisteredAt: row.sheet_registered_at ?? undefined,

    captionText: row.caption_text,
    imagePreview: row.image_preview,

    currentStep: row.current_step,
    steps: flowSteps,
    assets: row.assets,

    sampleArrivalDate: row.sample_arrival_date ?? undefined,
    estimation: jsonToEstimation(row.estimation),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
