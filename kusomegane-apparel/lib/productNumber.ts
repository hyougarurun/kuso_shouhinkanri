import { storage } from "@/lib/storage"
import { INITIAL_MAX_PRODUCT_NUMBER } from "@/constants"
import type { Product } from "@/types"

export function findConflictingProduct(
  candidate: string,
  selfId: string | null,
  products: Product[]
): Product | null {
  const trimmed = candidate.trim()
  if (trimmed.length === 0) return null
  for (const p of products) {
    if (p.id === selfId) continue
    if (p.productNumber === trimmed) return p
  }
  return null
}

export function getNextBaseNumber(): number {
  const products = storage.getProducts()
  let max = INITIAL_MAX_PRODUCT_NUMBER
  for (const p of products) {
    const base = typeof p.baseProductNumber === "number"
      ? p.baseProductNumber
      : parseInt(String(p.productNumber).split("-")[0], 10)
    if (!isNaN(base) && base > max) max = base
  }
  return max + 1
}

export function assignProductNumbers(base: number, colors: string[]): string[] {
  if (colors.length <= 1) return [`${base}`]
  return colors.map((_, i) => `${base}-${i + 1}`)
}
