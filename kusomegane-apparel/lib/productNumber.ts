import { storage } from "@/lib/storage"
import { INITIAL_MAX_PRODUCT_NUMBER } from "@/constants"

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
