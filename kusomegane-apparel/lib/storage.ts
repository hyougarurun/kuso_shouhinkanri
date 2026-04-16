import { Product } from "@/types"
import { STORAGE_KEYS } from "@/constants"

export const storage = {
  getProducts: (): Product[] => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  saveProducts: (products: Product[]): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  },

  upsertProduct: (product: Product): void => {
    const products = storage.getProducts()
    const idx = products.findIndex((p) => p.id === product.id)
    const updated: Product = { ...product, updatedAt: new Date().toISOString() }
    if (idx >= 0) products[idx] = updated
    else products.unshift(updated)
    storage.saveProducts(products)
  },

  deleteProduct: (id: string): void => {
    storage.saveProducts(storage.getProducts().filter((p) => p.id !== id))
  },

  getDraft: (): Partial<Product> | null => {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DRAFT)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null
      return parsed as Partial<Product>
    } catch {
      return null
    }
  },

  saveDraft: (draft: Partial<Product>): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft))
  },

  clearDraft: (): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEYS.DRAFT)
  },
}
