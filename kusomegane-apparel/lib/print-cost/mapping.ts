import type { NormalizedMethod } from "./types"

/**
 * 加工種別（ユーザー入力の自由テキスト）を正規化された method 値に変換する。
 * QuickEstimateCard, StepD_Confirm 両方から共有する。
 */
export function mapMethodFromProcessingType(pt: string): NormalizedMethod {
  if (!pt) return "ink_print"
  if (pt.includes("刺繍")) return "embroidery"
  if (pt.includes("ワッペン")) return "patch"
  if (pt.includes("相良")) return "sagara_attach"
  return "ink_print"
}
