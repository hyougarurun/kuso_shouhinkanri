import { describe, it, expect } from "vitest"
import { makeProduct } from "./fixtures/product"
import { buildProductInfoText, dataUrlToUint8Array } from "@/lib/exportZip"

describe("buildProductInfoText", () => {
  it("全フィールドが埋まった商品の情報テキストを生成する", () => {
    const product = makeProduct({
      name: "テスト商品",
      productNumber: "59",
      series: "テストシリーズ",
      colors: ["ブラック", "ホワイト"],
      sizes: ["S", "M", "L"],
      processingType: "DTF",
      processingInstruction: "前面にプリント",
      bodyModelNumber: "5001-01",
      material: "綿100% 5.6oz",
      isMadeToOrder: true,
      freeShipping: true,
      notes: "テスト備考",
    })

    const text = buildProductInfoText(product)

    expect(text).toContain("商品名: テスト商品")
    expect(text).toContain("商品番号: 59")
    expect(text).toContain("シリーズ: テストシリーズ")
    expect(text).toContain("カラー: ブラック・ホワイト")
    expect(text).toContain("サイズ: S/M/L")
    expect(text).toContain("加工種別: DTF")
    expect(text).toContain("加工指示: 前面にプリント")
    expect(text).toContain("ボディ型番: 5001-01")
    expect(text).toContain("素材: 綿100% 5.6oz")
    expect(text).toContain("受注生産: あり")
    expect(text).toContain("送料無料: あり")
    expect(text).toContain("備考: テスト備考")
  })

  it("受注生産なし・送料有料の場合", () => {
    const product = makeProduct({
      isMadeToOrder: false,
      freeShipping: false,
      notes: "",
    })

    const text = buildProductInfoText(product)

    expect(text).toContain("受注生産: なし")
    expect(text).toContain("送料無料: なし")
    expect(text).toContain("備考: ")
  })
})

describe("dataUrlToUint8Array", () => {
  it("data URL から Uint8Array に変換する", () => {
    // "Hello" の base64
    const dataUrl = "data:image/png;base64,SGVsbG8="
    const result = dataUrlToUint8Array(dataUrl)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(5)
    // "Hello" = [72, 101, 108, 108, 111]
    expect(result[0]).toBe(72)
    expect(result[1]).toBe(101)
    expect(result[4]).toBe(111)
  })

  it("空のbase64データを処理できる", () => {
    const dataUrl = "data:image/png;base64,"
    const result = dataUrlToUint8Array(dataUrl)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })
})
