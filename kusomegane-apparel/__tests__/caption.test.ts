import { describe, it, expect } from "vitest"
import { buildFullCaption } from "@/lib/caption"
import { makeProduct } from "./fixtures/product"

describe("caption (lib/caption.ts → buildFullCaption)", () => {
  it("TC-CAP-001: 受注生産ON・送料無料ON のとき冒頭に2行の警告が出る", () => {
    // @critical
    const p = makeProduct({
      isMadeToOrder: true,
      freeShipping: true,
      colors: ["ブラック"],
      material: "綿100% 5.6oz",
      processingType: "DTF",
    })
    const text = buildFullCaption(p, "説明文です！", "デザイン説明")
    const lines = text.split("\n")
    expect(lines[0]).toBe("※※※※※【この商品は受注生産商品です】※※※※※")
    expect(lines[1]).toBe("※※※※※【この商品に送料はかかりません】※※※※※")
    expect(lines[2]).toBe("")
  })

  it("TC-CAP-002: 受注生産OFF・送料無料OFF のとき冒頭警告が出ない", () => {
    // @critical
    const p = makeProduct({
      isMadeToOrder: false,
      freeShipping: false,
      colors: ["ブラック"],
      processingType: "DTF",
    })
    const text = buildFullCaption(p, "desc", "design")
    expect(text).not.toContain("受注生産商品です")
    expect(text).not.toContain("送料はかかりません")
    expect(text.length).toBeGreaterThan(0)
  })

  it("TC-CAP-003: 【商品情報】ブロックにカラー・デザイン・素材が含まれる", () => {
    // @critical
    const p = makeProduct({
      colors: ["ブラック", "ホワイト"],
      material: "綿100% 5.6oz",
      processingType: "DTF",
      isMadeToOrder: false,
      freeShipping: false,
    })
    const text = buildFullCaption(p, "desc", "design-1文")
    expect(text).toContain("【商品情報】")
    expect(text).toContain("カラー：ブラック・ホワイト")
    expect(text).toContain("デザイン：design-1文")
    expect(text).toContain("素材：綿100% 5.6oz")
  })

  it("TC-CAP-004: 加工種別に「刺繍」を含むと「※デザインは刺繍加工です。」が追加される", () => {
    // @critical
    const p1 = makeProduct({ processingType: "刺繍", isMadeToOrder: false, freeShipping: false })
    const p2 = makeProduct({ processingType: "刺繍+DTF", isMadeToOrder: false, freeShipping: false })
    const p3 = makeProduct({ processingType: "DTF", isMadeToOrder: false, freeShipping: false })

    const t1 = buildFullCaption(p1, "d", "dd")
    const t2 = buildFullCaption(p2, "d", "dd")
    const t3 = buildFullCaption(p3, "d", "dd")

    expect(t1).toContain("※デザインは刺繍加工です。")
    expect(t2).toContain("※デザインは刺繍加工です。")
    expect(t3).not.toContain("※デザインは刺繍加工です。")
  })

  it("TC-CAP-005: 受注生産ON のとき【注意事項】ブロックが末尾に追加される", () => {
    // @critical
    const p = makeProduct({ isMadeToOrder: true, freeShipping: false, processingType: "DTF" })
    const text = buildFullCaption(p, "desc", "design")
    expect(text).toContain("【注意事項】")
    expect(text).toContain(
      "※受注生産商品になりますので、お届けまで約3週間程度いただいております。ご了承の上お買い求めください。"
    )
    expect(text).toContain("※生産状況によって早めにお届けになる場合もあります。")
    expect(text).toContain(
      "※ご注文商品の中で一番お時間のかかる商品に合わせて、発送スケジュールを組ませていただいております。"
    )
    expect(text).toContain(
      "※欠陥品を除いて返品、交換は受け付けておりませんのでご理解の程お願いいたします。"
    )
  })

  it("TC-CAP-006: 受注生産OFF のとき【注意事項】ブロックが出ない", () => {
    // @critical
    const p = makeProduct({ isMadeToOrder: false, freeShipping: false, processingType: "DTF" })
    const text = buildFullCaption(p, "desc", "design")
    expect(text).not.toContain("【注意事項】")
    expect(text).not.toContain("3週間程度")
  })
})
