import { Product } from "@/types"

/**
 * "YYYY-MM" 形式の月ラベルを返す（1 始まり）
 */
export function formatMonth(year: number, month1to12: number): string {
  return `${year}-${String(month1to12).padStart(2, "0")}`
}

/**
 * baseDate を含む月から 12 ヶ月分のラベル（value = "YYYY-MM"、label = "YYYY/MM"）
 */
export function generateMonthLabels(
  baseDate: Date = new Date(),
): { value: string; label: string }[] {
  const baseYear = baseDate.getFullYear()
  const baseMonth = baseDate.getMonth()
  const result: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(baseYear, baseMonth + i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    result.push({
      value: formatMonth(y, m),
      label: `${y}/${String(m).padStart(2, "0")}`,
    })
  }
  return result
}

/** product.plannedMonths に月を追加（重複しない、ソート済み） */
export function addMonth(product: Product, month: string): Product {
  const set = new Set(product.plannedMonths ?? [])
  set.add(month)
  const sorted = Array.from(set).sort()
  return { ...product, plannedMonths: sorted }
}

/** product.plannedMonths から月を削除（空なら undefined） */
export function removeMonth(product: Product, month: string): Product {
  const filtered = (product.plannedMonths ?? []).filter((m) => m !== month)
  return {
    ...product,
    plannedMonths: filtered.length > 0 ? filtered : undefined,
  }
}

/** from から削除して to に追加（from === to なら変化なし） */
export function moveMonth(
  product: Product,
  from: string | null,
  to: string | null,
): Product {
  if (from === to) return product
  let next = product
  if (from) next = removeMonth(next, from)
  if (to) next = addMonth(next, to)
  return next
}

/** 指定月に割り当てられた商品 */
export function productsForMonth(
  products: Product[],
  month: string,
): Product[] {
  return products.filter((p) => (p.plannedMonths ?? []).includes(month))
}

/** どの月にも割り当てられていない商品 */
export function unassignedProducts(products: Product[]): Product[] {
  return products.filter(
    (p) => !p.plannedMonths || p.plannedMonths.length === 0,
  )
}
