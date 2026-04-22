import { Product } from "@/types"
import { STORAGE_KEYS } from "@/constants"

/**
 * 商品データ永続層。
 *
 * 設計:
 * - 主保存先: IndexedDB（`kuso-products` DB、`products` オブジェクトストア）
 *   100 商品 × gallery サムネ = ~20MB+ を想定して LocalStorage から脱却。
 * - メモリキャッシュ: ページ初期化時に IndexedDB → memCache にロードし、以降 sync で読める。
 *   書き込みは memCache 即反映 + IndexedDB fire-and-forget。
 * - draft（登録ウィザード途中保存）は小さいので LocalStorage のまま。
 *
 * 移行: 既存 LocalStorage の products を初回 hydrate で IndexedDB に吸い上げる。
 * 吸い上げ後も LocalStorage は即削除せず一旦残す（ロールバック用、後続で掃除予定）。
 */

const DB_NAME = "kuso-products"
const DB_VERSION = 1
const STORE = "products"

// ─── IndexedDB primitives ──────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined"
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGetAll(): Promise<Product[]> {
  if (!isBrowser()) return []
  try {
    const db = await openDB()
    return await new Promise<Product[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly")
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () =>
        resolve(Array.isArray(req.result) ? (req.result as Product[]) : [])
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

async function idbPut(product: Product): Promise<void> {
  if (!isBrowser()) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).put(product)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // 失敗しても memCache は更新済みなので致命的ではない
  }
}

async function idbPutAll(products: Product[]): Promise<void> {
  if (!isBrowser()) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      const store = tx.objectStore(STORE)
      for (const p of products) store.put(p)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // noop
  }
}

async function idbDelete(id: string): Promise<void> {
  if (!isBrowser()) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // noop
  }
}

async function idbClear(): Promise<void> {
  if (!isBrowser()) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // noop
  }
}

// ─── Memory cache ───────────────────────────────────────────────────

let memCache: Product[] = []
let hydrated = false
let hydrating: Promise<void> | null = null

/** ページ初回アクセス時に呼び出す。2 回目以降は即 resolve。 */
export async function hydrateStorage(): Promise<void> {
  if (hydrated) return
  if (hydrating) return hydrating
  hydrating = (async () => {
    // 1) IndexedDB から読み込み
    const fromIdb = await idbGetAll()
    if (fromIdb.length > 0) {
      // createdAt 降順 / 無ければ id 降順で並べておく
      memCache = [...fromIdb].sort((a, b) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
      )
      hydrated = true
      return
    }
    // 2) 空なら LocalStorage から一度だけ移行
    if (isBrowser()) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            memCache = parsed
            await idbPutAll(parsed)
            // LocalStorage は残したまま（ロールバック用）。次回以降は IndexedDB 優先
          }
        }
      } catch {
        // ignore
      }
    }
    hydrated = true
  })()
  await hydrating
}

// ─── Public API (同期) ──────────────────────────────────────────────

export const storage = {
  /**
   * 同期的に全商品を返す。hydrateStorage() が完了していない場合は空配列。
   * ページ側で await hydrateStorage() → setProducts(storage.getProducts()) の順で呼ぶ。
   */
  getProducts: (): Product[] => memCache,

  saveProducts: (products: Product[]): void => {
    memCache = [...products]
    void idbPutAll(products)
  },

  upsertProduct: (product: Product): void => {
    const updated: Product = {
      ...product,
      updatedAt: new Date().toISOString(),
    }
    const idx = memCache.findIndex((p) => p.id === product.id)
    if (idx >= 0) {
      memCache = memCache.map((p, i) => (i === idx ? updated : p))
    } else {
      memCache = [updated, ...memCache]
    }
    void idbPut(updated)
  },

  deleteProduct: (id: string): void => {
    memCache = memCache.filter((p) => p.id !== id)
    void idbDelete(id)
  },

  // 全消去（開発用途）
  clearAll: async (): Promise<void> => {
    memCache = []
    await idbClear()
  },

  // ─── draft（登録ウィザード途中保存）は LocalStorage のまま ───
  getDraft: (): Partial<Product> | null => {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DRAFT)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
        return null
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
