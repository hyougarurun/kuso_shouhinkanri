import { describe, it, expect, beforeEach } from "vitest"
import {
  loadInputHistory,
  pushInputHistory,
  removeInputHistoryItem,
  clearInputHistory,
  HISTORY_MAX,
} from "@/lib/inputHistory"

beforeEach(() => {
  localStorage.clear()
})

describe("inputHistory", () => {
  it("TC-IH-001: 空キー → 空配列", () => {
    expect(loadInputHistory("any.key")).toEqual([])
  })

  it("TC-IH-002: push したら load で取れる（新しい順）", () => {
    pushInputHistory("color", "黒")
    pushInputHistory("color", "白")
    pushInputHistory("color", "ネイビー")
    expect(loadInputHistory("color")).toEqual(["ネイビー", "白", "黒"])
  })

  it("TC-IH-003: 同一値を再 push すると先頭に移動（重複排除）", () => {
    pushInputHistory("color", "黒")
    pushInputHistory("color", "白")
    pushInputHistory("color", "黒")
    expect(loadInputHistory("color")).toEqual(["黒", "白"])
  })

  it("TC-IH-004: 空文字 / 空白のみは push されない", () => {
    pushInputHistory("color", "")
    pushInputHistory("color", "   ")
    expect(loadInputHistory("color")).toEqual([])
  })

  it("TC-IH-005: 前後 trim される", () => {
    pushInputHistory("color", "  グレー  ")
    expect(loadInputHistory("color")).toEqual(["グレー"])
  })

  it("TC-IH-006: HISTORY_MAX 超過で古いものから押し出される", () => {
    for (let i = 0; i < HISTORY_MAX + 5; i++) {
      pushInputHistory("series", `S${i}`)
    }
    const list = loadInputHistory("series")
    expect(list.length).toBe(HISTORY_MAX)
    expect(list[0]).toBe(`S${HISTORY_MAX + 4}`)
    expect(list[HISTORY_MAX - 1]).toBe(`S5`) // 0-4 が押し出された
  })

  it("TC-IH-007: 異なるキーは独立保存", () => {
    pushInputHistory("color", "黒")
    pushInputHistory("series", "シリーズA")
    expect(loadInputHistory("color")).toEqual(["黒"])
    expect(loadInputHistory("series")).toEqual(["シリーズA"])
  })

  it("TC-IH-008: removeInputHistoryItem で個別削除", () => {
    pushInputHistory("color", "黒")
    pushInputHistory("color", "白")
    pushInputHistory("color", "ネイビー")
    removeInputHistoryItem("color", "白")
    expect(loadInputHistory("color")).toEqual(["ネイビー", "黒"])
  })

  it("TC-IH-009: clearInputHistory でキーごと削除", () => {
    pushInputHistory("color", "黒")
    pushInputHistory("series", "シリーズA")
    clearInputHistory("color")
    expect(loadInputHistory("color")).toEqual([])
    expect(loadInputHistory("series")).toEqual(["シリーズA"]) // 他キーには影響なし
  })

  it("TC-IH-010: 不正な JSON が入っていたら空配列フォールバック", () => {
    localStorage.setItem("kuso:input-history:broken", "not-json")
    expect(loadInputHistory("broken")).toEqual([])
  })
})
