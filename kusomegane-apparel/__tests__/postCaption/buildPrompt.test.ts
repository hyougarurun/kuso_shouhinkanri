import { describe, it, expect } from "vitest"
import { buildPrompt } from "@/lib/postCaption/buildPrompt"

describe("buildPrompt", () => {
  it("TC-PP-001: 基本構造 — promptBody + 状況メモ + 文字数 + 「本文のみ」指示", () => {
    const result = buildPrompt({
      characterId: "char-harimeganezumi",
      situation: ["朝寝坊", "雨"],
      targetLength: 450,
    })
    expect(result).toMatch(/おもしろおかしく日記風に説明/)
    expect(result).toContain("## 状況メモ")
    expect(result).toContain("- 朝寝坊")
    expect(result).toContain("- 雨")
    expect(result).toContain("450")
    expect(result).toContain("本文のみ")
  })

  it("TC-PP-002: 状況メモが空配列なら「画像から読み取って」指示が入る", () => {
    const result = buildPrompt({
      characterId: "char-harimeganezumi",
      situation: [],
      targetLength: 450,
    })
    expect(result).not.toContain("## 状況メモ")
    expect(result).toMatch(/画像|イラスト/)
  })

  it("TC-PP-003: キャラごとに異なる promptBody が反映される", () => {
    const mom = buildPrompt({
      characterId: "char-kuso-mom",
      situation: [],
      targetLength: 450,
    })
    expect(mom).toContain("スピリチュアル")
    expect(mom).toContain("お母さん")

    const imouto = buildPrompt({
      characterId: "char-imouto",
      situation: [],
      targetLength: 450,
    })
    expect(imouto).toContain("ひらがな")

    const ani = buildPrompt({
      characterId: "char-ani",
      situation: [],
      targetLength: 120,
    })
    expect(ani).toContain("ヤンキー")
    expect(ani).toContain("卍")
  })

  it("TC-PP-004: targetLength を省略するとキャラの defaultLength が使われる", () => {
    const result = buildPrompt({
      characterId: "char-ani",
      situation: [],
    })
    expect(result).toContain("120")
  })

  it("TC-PP-005: 不正 characterId は例外", () => {
    expect(() =>
      buildPrompt({
        characterId: "char-unknown",
        situation: [],
        targetLength: 400,
      })
    ).toThrow(/unknown character/i)
  })
})
