import { describe, it, expect } from "vitest"
import { buildPrompt } from "@/lib/postCaption/buildPrompt"

describe("buildPrompt", () => {
  it("TC-PP-001: 基本構造 — 指示 + 状況 + 文体 + 文字数", () => {
    const result = buildPrompt({
      presetBody: "日記風に仕上げて",
      situation: ["朝寝坊", "雨"],
      targetLength: 500,
      tone: "tame",
    })
    expect(result).toContain("日記風に仕上げて")
    expect(result).toContain("- 朝寝坊")
    expect(result).toContain("- 雨")
    expect(result).toContain("500")
    expect(result).toContain("タメ口")
  })

  it("TC-PP-002: 状況が空配列なら画像から推測する指示が入る", () => {
    const result = buildPrompt({
      presetBody: "日記風に仕上げて",
      situation: [],
      targetLength: 500,
      tone: "tame",
    })
    expect(result).toMatch(/画像|イラスト/)
    expect(result).not.toContain("## 状況")
  })

  it("TC-PP-003: 文体 desu → です・ます調", () => {
    const result = buildPrompt({
      presetBody: "日記風に仕上げて",
      situation: ["朝寝坊"],
      targetLength: 500,
      tone: "desu",
    })
    expect(result).toContain("です・ます")
    expect(result).not.toContain("タメ口")
  })

  it("TC-PP-004: 文体 dearu → だ・である調", () => {
    const result = buildPrompt({
      presetBody: "日記風に仕上げて",
      situation: ["朝寝坊"],
      targetLength: 500,
      tone: "dearu",
    })
    expect(result).toContain("だ・である")
  })

  it("TC-PP-005: targetLength が反映される", () => {
    const result = buildPrompt({
      presetBody: "日記風に仕上げて",
      situation: ["朝寝坊"],
      targetLength: 800,
      tone: "tame",
    })
    expect(result).toContain("800")
  })

  it("TC-PP-006: 不正トーン → タメ口フォールバック（クラッシュしない）", () => {
    const result = buildPrompt({
      presetBody: "日記風に仕上げて",
      situation: ["朝寝坊"],
      targetLength: 500,
      tone: "invalid" as unknown as "tame",
    })
    expect(result).toContain("タメ口")
  })
})
