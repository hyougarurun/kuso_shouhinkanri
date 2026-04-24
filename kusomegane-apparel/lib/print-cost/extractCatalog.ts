import type { ParsedInvoice } from "./types"

export interface BodyCodeEntry {
  code: string
  name: string
  sampleCount: number
}

export interface InvoiceCatalog {
  bodyCodes: BodyCodeEntry[]
  colors: string[]
}

const COLOR_NOISE = new Set<string>(["カラー"])

export function extractCatalog(invoices: ParsedInvoice[]): InvoiceCatalog {
  // bodyCode → { count, names: Map<name, count> }
  const codeMap = new Map<
    string,
    { count: number; names: Map<string, number> }
  >()
  const colorSet = new Set<string>()

  for (const inv of invoices) {
    for (const item of inv.lineItems) {
      if (item.type !== "body") continue
      const code = (item.bodyCode ?? "").trim()
      if (code) {
        const entry = codeMap.get(code) ?? {
          count: 0,
          names: new Map<string, number>(),
        }
        entry.count++
        const name = (item.bodyName ?? "").trim()
        if (name) entry.names.set(name, (entry.names.get(name) ?? 0) + 1)
        codeMap.set(code, entry)
      }
      const color = (item.color ?? "").trim()
      if (color && !COLOR_NOISE.has(color)) {
        colorSet.add(color)
      }
    }
  }

  const bodyCodes: BodyCodeEntry[] = Array.from(codeMap.entries())
    .map(([code, { count, names }]) => {
      let topName = ""
      let topCount = -1
      for (const [name, c] of names) {
        if (c > topCount) {
          topName = name
          topCount = c
        }
      }
      return { code, name: topName, sampleCount: count }
    })
    .sort((a, b) => {
      if (b.sampleCount !== a.sampleCount) return b.sampleCount - a.sampleCount
      return a.code.localeCompare(b.code)
    })

  const colors = Array.from(colorSet).sort((a, b) => a.localeCompare(b))

  return { bodyCodes, colors }
}
