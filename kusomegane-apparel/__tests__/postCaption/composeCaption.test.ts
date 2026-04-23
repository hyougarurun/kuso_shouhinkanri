import { describe, it, expect } from "vitest"
import { composeCaption } from "@/lib/postCaption/composeCaption"

describe("composeCaption", () => {
  it("TC-CC-001: 完成形フォーマット全要素が含まれる（ハリメガネズミ実例）", () => {
    const result = composeCaption({
      title: "ダメージジーンズ病院で回復させメガネ",
      episode: 143,
      characterId: "char-harimeganezumi",
      body: "今日は父の病院受付の手伝い。",
      postNo: 168,
    })
    expect(result).toBe(
      [
        "ダメージジーンズ病院で回復させメガネ#143",
        "",
        "【ハリメガネズミの日記】",
        "今日は父の病院受付の手伝い。",
        "",
        "Post No.168",
        ".",
        "#KUSOMEGANE",
        "#ショートアニメ",
      ].join("\n")
    )
  })

  it("TC-CC-002: titleLabel はキャラから取得（クソメガネ母）", () => {
    const result = composeCaption({
      title: "祈祷",
      episode: 12,
      characterId: "char-kuso-mom",
      body: "本文",
      postNo: 20,
    })
    expect(result).toContain("【クソメガネ母の日記】")
  })

  it("TC-CC-003: 兄（titleLabel が「日記」でない）でも正しく組み立てる", () => {
    const result = composeCaption({
      title: "卍",
      episode: 5,
      characterId: "char-ani",
      body: "ヨロシク卍",
      postNo: 9,
    })
    expect(result).toContain("【兄のデコログ】")
  })

  it("TC-CC-004: body の前後改行・空白は trim される（中の改行は保持）", () => {
    const result = composeCaption({
      title: "テスト",
      episode: 1,
      characterId: "char-harimeganezumi",
      body: "\n\n  本文一行目\n本文二行目  \n\n",
      postNo: 1,
    })
    expect(result).toContain("本文一行目\n本文二行目")
    expect(result).not.toContain("本文二行目  ")
    expect(result).not.toContain("\n\n本文一行目")
  })

  it("TC-CC-005: 末尾は固定で `Post No.{n}\\n.\\n#KUSOMEGANE\\n#ショートアニメ`", () => {
    const result = composeCaption({
      title: "テスト",
      episode: 1,
      characterId: "char-harimeganezumi",
      body: "本文",
      postNo: 999,
    })
    expect(result).toMatch(/Post No\.\d+\n\.\n#KUSOMEGANE\n#ショートアニメ$/)
  })

  it("TC-CC-006: 不正 characterId は例外", () => {
    expect(() =>
      composeCaption({
        title: "x",
        episode: 1,
        characterId: "char-unknown",
        body: "本文",
        postNo: 1,
      })
    ).toThrow(/unknown character/i)
  })

  it("TC-CC-007: title が空文字でも例外を投げず、1 行目は #{episode} のみ", () => {
    const result = composeCaption({
      title: "",
      episode: 1,
      characterId: "char-harimeganezumi",
      body: "ほげ",
      postNo: 1,
    })
    const firstLine = result.split("\n")[0]
    expect(firstLine).toBe("#1")
  })
})
