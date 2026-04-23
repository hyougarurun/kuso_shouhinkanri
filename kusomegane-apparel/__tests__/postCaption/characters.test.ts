import { describe, it, expect } from "vitest"
import {
  CHARACTERS,
  getCharacter,
  type CharacterId,
} from "@/lib/postCaption/characters"

describe("characters", () => {
  it("TC-CH-001: CHARACTERS は 6 件で id がユニーク・必須フィールドが揃う", () => {
    expect(CHARACTERS).toHaveLength(6)
    const ids = CHARACTERS.map((c) => c.id)
    expect(new Set(ids).size).toBe(6)
    for (const c of CHARACTERS) {
      expect(c.id).toBeTruthy()
      expect(c.name).toBeTruthy()
      expect(c.titleLabel).toBeTruthy()
      expect(c.promptBody.length).toBeGreaterThan(0)
      expect(c.defaultLength).toBeGreaterThan(0)
    }
  })

  it("TC-CH-002: 期待される 6 種の id が全て存在", () => {
    const expectedIds: CharacterId[] = [
      "char-harimeganezumi",
      "char-kuso-mom",
      "char-kuso-dad",
      "char-sakura",
      "char-imouto",
      "char-ani",
    ]
    const actualIds = CHARACTERS.map((c) => c.id).sort()
    expect(actualIds).toEqual([...expectedIds].sort())
  })

  it("TC-CH-003: getCharacter で該当キャラ取得、不正 id は undefined", () => {
    expect(getCharacter("char-harimeganezumi")?.titleLabel).toBe(
      "【ハリメガネズミの日記】"
    )
    expect(getCharacter("char-ani")?.titleLabel).toBe("【兄のデコログ】")
    expect(getCharacter("missing" as CharacterId)).toBeUndefined()
  })
})
