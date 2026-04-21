import type {
  ProcessingDetails,
  ProcessingMethod,
  Product,
} from "@/types"

const METHOD_LABEL: Record<ProcessingMethod, string> = {
  ink: "インク",
  embroidery: "刺繍",
  dtf: "DTF",
}

const LOCATION_LABEL: Record<"front" | "back" | "sleeve", string> = {
  front: "正面",
  back: "背面",
  sleeve: "袖",
}

/**
 * ProcessingDetails → シート E 列用の番号付き複数行テキスト。
 * 例:
 *   1.タグ付け
 *   2.正面インク
 *   3.背面刺繍
 *
 * 空欄（何も設定されていない）は空文字を返す。
 */
export function buildProcessingSummary(details: ProcessingDetails): string {
  const lines: string[] = []
  if (details.tagAttachment) lines.push("タグ付け")
  const order: Array<"front" | "back" | "sleeve"> = ["front", "back", "sleeve"]
  for (const key of order) {
    const method = details[key]
    if (method) lines.push(`${LOCATION_LABEL[key]}${METHOD_LABEL[method]}`)
  }
  return lines.map((line, i) => `${i + 1}.${line}`).join("\n")
}

/**
 * Product → シート E 列に出す文字列を決定。
 * processingDetails があれば構造化テキスト、なければ processingInstruction（旧自由文）。
 */
export function resolveProcessingCellText(product: Product): string {
  if (product.processingDetails) {
    const summary = buildProcessingSummary(product.processingDetails)
    if (summary.length > 0) return summary
  }
  return product.processingInstruction
}

export function emptyProcessingDetails(): ProcessingDetails {
  return {
    tagAttachment: false,
    front: null,
    back: null,
    sleeve: null,
  }
}
