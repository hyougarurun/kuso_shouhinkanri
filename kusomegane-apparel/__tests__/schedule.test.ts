import { describe, it, expect } from "vitest"
import {
  addMonth,
  formatMonth,
  generateMonthLabels,
  moveMonth,
  productsForMonth,
  removeMonth,
  unassignedProducts,
} from "@/lib/schedule"
import { makeProduct } from "./fixtures/product"

describe("formatMonth", () => {
  it("1 桁月は 0 埋めされる", () => {
    expect(formatMonth(2026, 4)).toBe("2026-04")
    expect(formatMonth(2026, 12)).toBe("2026-12")
  })
})

describe("generateMonthLabels", () => {
  it("baseDate を含む月から 12 ヶ月分を返す（年跨ぎ含む）", () => {
    const base = new Date(2026, 3, 15) // 2026-04
    const months = generateMonthLabels(base)
    expect(months).toHaveLength(12)
    expect(months[0].value).toBe("2026-04")
    expect(months[0].label).toBe("2026/04")
    expect(months[8].value).toBe("2026-12")
    expect(months[9].value).toBe("2027-01")
    expect(months[11].value).toBe("2027-03")
  })
})

describe("addMonth / removeMonth", () => {
  it("addMonth は重複を排除してソート済み配列を返す", () => {
    const p = makeProduct({ plannedMonths: ["2026-05"] })
    const p2 = addMonth(p, "2026-04")
    expect(p2.plannedMonths).toEqual(["2026-04", "2026-05"])
    const p3 = addMonth(p2, "2026-04")
    expect(p3.plannedMonths).toEqual(["2026-04", "2026-05"])
  })

  it("removeMonth は該当月を除去、空になれば undefined", () => {
    const p = makeProduct({ plannedMonths: ["2026-04", "2026-05"] })
    const p2 = removeMonth(p, "2026-04")
    expect(p2.plannedMonths).toEqual(["2026-05"])
    const p3 = removeMonth(p2, "2026-05")
    expect(p3.plannedMonths).toBeUndefined()
  })
})

describe("moveMonth", () => {
  it("from === to なら変化なし", () => {
    const p = makeProduct({ plannedMonths: ["2026-04"] })
    const p2 = moveMonth(p, "2026-04", "2026-04")
    expect(p2).toBe(p)
  })

  it("from → to に移動（from 削除 + to 追加）", () => {
    const p = makeProduct({ plannedMonths: ["2026-04", "2026-05"] })
    const p2 = moveMonth(p, "2026-04", "2026-07")
    expect(p2.plannedMonths).toEqual(["2026-05", "2026-07"])
  })

  it("from が null なら未定 → to へ追加のみ", () => {
    const p = makeProduct()
    const p2 = moveMonth(p, null, "2026-05")
    expect(p2.plannedMonths).toEqual(["2026-05"])
  })

  it("to が null なら from から削除のみ（未定に戻す）", () => {
    const p = makeProduct({ plannedMonths: ["2026-05"] })
    const p2 = moveMonth(p, "2026-05", null)
    expect(p2.plannedMonths).toBeUndefined()
  })
})

describe("productsForMonth / unassignedProducts", () => {
  const products = [
    makeProduct({ id: "a", plannedMonths: ["2026-04", "2026-05"] }),
    makeProduct({ id: "b", plannedMonths: ["2026-05"] }),
    makeProduct({ id: "c" }),
    makeProduct({ id: "d", plannedMonths: [] }),
  ]

  it("productsForMonth: 該当月を含む商品を返す（重複可）", () => {
    expect(productsForMonth(products, "2026-04").map((p) => p.id)).toEqual([
      "a",
    ])
    expect(productsForMonth(products, "2026-05").map((p) => p.id)).toEqual([
      "a",
      "b",
    ])
    expect(productsForMonth(products, "2026-06")).toEqual([])
  })

  it("unassignedProducts: plannedMonths が空 or undefined の商品", () => {
    const ids = unassignedProducts(products).map((p) => p.id)
    expect(ids).toEqual(["c", "d"])
  })
})
