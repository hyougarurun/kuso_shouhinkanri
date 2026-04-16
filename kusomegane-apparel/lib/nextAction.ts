import { Product } from "@/types"
import { FLOW_STEPS } from "@/constants"

const ALL_DONE_LABEL = "✨ 販売中"

export function getNextActionLabel(product: Product): string {
  const firstPending = product.steps.find((s) => s.status !== "done")
  if (!firstPending) return ALL_DONE_LABEL
  const def = FLOW_STEPS.find((f) => f.id === firstPending.stepNumber)
  if (!def) return ""
  return `${def.icon} ${def.name}`
}
