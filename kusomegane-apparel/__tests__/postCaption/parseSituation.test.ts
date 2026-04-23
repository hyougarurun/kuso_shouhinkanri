import { describe, it, expect } from "vitest"
import { parseSituation } from "@/lib/postCaption/parseSituation"

describe("parseSituation", () => {
  it("TC-PS-001: 改行区切りで項目化", () => {
    expect(parseSituation("朝寝坊\nコーヒー切れてた\n雨")).toEqual([
      "朝寝坊",
      "コーヒー切れてた",
      "雨",
    ])
  })

  it("TC-PS-002: 行頭 -/・/* は除去", () => {
    expect(parseSituation("- 朝寝坊\n・コーヒー切れてた\n* 雨")).toEqual([
      "朝寝坊",
      "コーヒー切れてた",
      "雨",
    ])
  })

  it("TC-PS-003: 空行は除外", () => {
    expect(parseSituation("朝寝坊\n\n\n雨")).toEqual(["朝寝坊", "雨"])
  })

  it("TC-PS-004: 前後 trim（全角スペース含む）", () => {
    expect(parseSituation("  朝寝坊　\n　雨　")).toEqual(["朝寝坊", "雨"])
  })

  it("TC-PS-005: 空入力 → 空配列", () => {
    expect(parseSituation("")).toEqual([])
    expect(parseSituation("   ")).toEqual([])
    expect(parseSituation("\n\n")).toEqual([])
  })
})
