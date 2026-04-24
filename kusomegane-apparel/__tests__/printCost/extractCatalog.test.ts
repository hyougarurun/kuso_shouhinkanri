import { describe, it, expect } from "vitest"
import { extractCatalog } from "@/lib/print-cost/extractCatalog"
import type { ParsedInvoice, InvoiceLineItem } from "@/lib/print-cost/types"

function bodyItem(overrides: Partial<InvoiceLineItem>): InvoiceLineItem {
  return {
    type: "body",
    raw: "",
    deliveryDate: "",
    deliveryNumber: "",
    unitPrice: 0,
    quantity: 0,
    subtotal: 0,
    bodyCode: "5001-01",
    bodyName: "Tシャツ",
    color: "ホワイト",
    ...overrides,
  }
}

function invoice(items: InvoiceLineItem[]): ParsedInvoice {
  return {
    sourceFile: "test.pdf",
    totalAmount: 0,
    taxAmount: 0,
    subtotal: 0,
    lineItems: items,
    parsedAt: "",
    parserVersion: "",
  }
}

describe("extractCatalog", () => {
  it("TC-CAT-001: 空配列 → 空カタログ", () => {
    expect(extractCatalog([])).toEqual({ bodyCodes: [], colors: [] })
  })

  it("TC-CAT-002: 同じ bodyCode は集約、sampleCount は出現数の合計", () => {
    const result = extractCatalog([
      invoice([
        bodyItem({ bodyCode: "5001-01" }),
        bodyItem({ bodyCode: "5001-01" }),
        bodyItem({ bodyCode: "5011-01", bodyName: "ロンT" }),
      ]),
      invoice([bodyItem({ bodyCode: "5001-01" })]),
    ])
    expect(result.bodyCodes).toHaveLength(2)
    const t5001 = result.bodyCodes.find((b) => b.code === "5001-01")
    expect(t5001?.sampleCount).toBe(3)
  })

  it("TC-CAT-003: bodyCode 同じで bodyName 複数 → 最頻採択", () => {
    const result = extractCatalog([
      invoice([
        bodyItem({ bodyCode: "5001-01", bodyName: "A" }),
        bodyItem({ bodyCode: "5001-01", bodyName: "A" }),
        bodyItem({ bodyCode: "5001-01", bodyName: "B" }),
      ]),
    ])
    expect(result.bodyCodes[0].name).toBe("A")
  })

  it("TC-CAT-004: color はユニーク、空とノイズ「カラー」単独を除外", () => {
    const result = extractCatalog([
      invoice([
        bodyItem({ color: "ホワイト" }),
        bodyItem({ color: "" }),
        bodyItem({ color: "カラー" }),
        bodyItem({ color: "ホワイト" }),
        bodyItem({ color: "ナチュラル・カラー" }),
      ]),
    ])
    expect(result.colors).toEqual(
      expect.arrayContaining(["ホワイト", "ナチュラル・カラー"])
    )
    expect(result.colors).not.toContain("カラー")
    expect(result.colors).not.toContain("")
    expect(result.colors).toHaveLength(2)
  })

  it("TC-CAT-005: bodyCodes は sampleCount desc → code asc でソート", () => {
    const result = extractCatalog([
      invoice([
        bodyItem({ bodyCode: "B" }),
        bodyItem({ bodyCode: "A" }),
        bodyItem({ bodyCode: "C" }),
        bodyItem({ bodyCode: "C" }),
      ]),
    ])
    expect(result.bodyCodes.map((b) => b.code)).toEqual(["C", "A", "B"])
  })
})
