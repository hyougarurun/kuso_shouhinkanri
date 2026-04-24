import type { CaptionAsset } from "@/types"

const LABEL_MAX = 20

export function deriveLabel(body: string, explicitLabel?: string): string {
  if (explicitLabel && explicitLabel.replace(/\s|　/g, "").length > 0) {
    return explicitLabel.trim()
  }
  const cleaned = body.replace(/^[\s　]+|[\s　]+$/g, "")
  if (cleaned.length === 0) return "(無題)"
  return [...cleaned].slice(0, LABEL_MAX).join("")
}

export function listCategories(assets: CaptionAsset[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const a of assets) {
    const c = a.category
    if (c && !seen.has(c)) {
      seen.add(c)
      out.push(c)
    }
  }
  return out
}

export interface CategoryGroup {
  category: string
  items: CaptionAsset[]
}

export function groupByCategory(assets: CaptionAsset[]): CategoryGroup[] {
  const map = new Map<string, CaptionAsset[]>()
  const order: string[] = []
  for (const a of assets) {
    const key = a.category
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key)!.push(a)
  }
  const named = order.filter((c) => c !== "")
  const result: CategoryGroup[] = named.map((c) => ({
    category: c,
    items: map.get(c)!,
  }))
  if (map.has("")) {
    result.push({ category: "", items: map.get("")! })
  }
  return result
}
