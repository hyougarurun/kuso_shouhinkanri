import { Product } from "@/types"

export type ProductStatus = "not_started" | "in_progress" | "done"
export type FilterValue = "all" | "in_progress" | "done"

export function getProductStatus(product: Product): ProductStatus {
  const done = product.steps.filter((s) => s.status === "done").length
  if (done === 0) return "not_started"
  if (done === product.steps.length) return "done"
  return "in_progress"
}

export function getProgress(product: Product): { done: number; total: number } {
  const total = product.steps.length
  const done = product.steps.filter((s) => s.status === "done").length
  return { done, total }
}

export function summarize(products: Product[]): {
  total: number
  inProgress: number
  done: number
} {
  let inProgress = 0
  let done = 0
  for (const p of products) {
    const status = getProductStatus(p)
    if (status === "done") done++
    else if (status === "in_progress") inProgress++
  }
  return { total: products.length, inProgress, done }
}

export function filterProducts(products: Product[], filter: FilterValue): Product[] {
  if (filter === "all") return products
  if (filter === "done") {
    return products.filter((p) => getProductStatus(p) === "done")
  }
  // in_progress: 対応中 + 未着手（"done 以外"）をまとめて「対応中」扱い
  return products.filter((p) => getProductStatus(p) !== "done")
}

export const STATUS_LABEL: Record<ProductStatus, string> = {
  not_started: "未着手",
  in_progress: "対応中",
  done: "完了",
}
