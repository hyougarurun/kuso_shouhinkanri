import { beforeEach, describe, it, expect } from "vitest"
import {
  loadPresets,
  savePresets,
  addPreset,
  removePreset,
  updatePreset,
} from "@/lib/postCaption/presets"

beforeEach(() => {
  localStorage.clear()
})

describe("postCaption presets", () => {
  it("TC-PR-001: 初回ロード時にデフォルト4プリセット", () => {
    const p = loadPresets()
    expect(p).toHaveLength(4)
    expect(p.map((x) => x.name)).toEqual([
      "日記風",
      "独り言風",
      "ポエム風",
      "ツッコミ風",
    ])
    for (const preset of p) {
      expect(preset.id).toBeTruthy()
      expect(preset.body.length).toBeGreaterThan(0)
    }
  })

  it("TC-PR-002: savePresets で永続化、再 load で取れる", () => {
    const custom = [
      { id: "a", name: "カスタム1", body: "本文1" },
      { id: "b", name: "カスタム2", body: "本文2" },
    ]
    savePresets(custom)
    expect(loadPresets()).toEqual(custom)
  })

  it("TC-PR-003: addPreset で末尾追加、removePreset で削除", () => {
    const added = addPreset({ name: "独自", body: "独自本文" })
    expect(added.id).toBeTruthy()
    const after = loadPresets()
    expect(after).toHaveLength(5)
    expect(after[4]).toEqual(added)

    removePreset(added.id)
    const afterRemove = loadPresets()
    expect(afterRemove).toHaveLength(4)
    expect(afterRemove.find((p) => p.id === added.id)).toBeUndefined()
  })

  it("TC-PR-004: updatePreset で該当 1 件だけ更新（他は変わらない）", () => {
    const before = loadPresets()
    const target = before[0]
    updatePreset(target.id, { body: "書き換え後の本文" })
    const after = loadPresets()
    expect(after[0].body).toBe("書き換え後の本文")
    expect(after[0].name).toBe(target.name)
    // 他プリセットは元のまま
    expect(after[1]).toEqual(before[1])
    expect(after[2]).toEqual(before[2])
    expect(after[3]).toEqual(before[3])
  })

  it("TC-PR-005: 不正 JSON → デフォルト4プリセットにフォールバック", () => {
    localStorage.setItem("kuso:post-caption:presets", "not-json-at-all")
    const p = loadPresets()
    expect(p).toHaveLength(4)
    expect(p.map((x) => x.name)).toEqual([
      "日記風",
      "独り言風",
      "ポエム風",
      "ツッコミ風",
    ])
  })
})
