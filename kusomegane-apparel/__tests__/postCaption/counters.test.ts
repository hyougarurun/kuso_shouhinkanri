import { beforeEach, describe, it, expect } from "vitest"
import {
  getCounter,
  setCounter,
  bumpCounter,
} from "@/lib/postCaption/counters"

beforeEach(() => {
  localStorage.clear()
})

describe("postCaption counters", () => {
  it("TC-CT-001: 初期状態は null（未設定）", () => {
    expect(getCounter("episode")).toBeNull()
    expect(getCounter("postNo")).toBeNull()
  })

  it("TC-CT-002: setCounter / getCounter ラウンドトリップ", () => {
    setCounter("episode", 143)
    expect(getCounter("episode")).toBe(143)
  })

  it("TC-CT-003: episode と postNo は独立保存", () => {
    setCounter("episode", 143)
    expect(getCounter("postNo")).toBeNull()
    setCounter("postNo", 168)
    expect(getCounter("episode")).toBe(143)
    expect(getCounter("postNo")).toBe(168)
  })

  it("TC-CT-004: bumpCounter で +1 して新値を返す（永続化される）", () => {
    setCounter("episode", 143)
    expect(bumpCounter("episode")).toBe(144)
    expect(getCounter("episode")).toBe(144)
    expect(bumpCounter("episode")).toBe(145)
  })

  it("TC-CT-005: 未設定の bumpCounter は例外", () => {
    expect(() => bumpCounter("episode")).toThrow(/未設定/)
  })

  it("TC-CT-006: 不正値の setCounter は例外", () => {
    expect(() => setCounter("episode", -1)).toThrow()
    expect(() => setCounter("episode", 1.5)).toThrow()
    expect(() => setCounter("episode", Number.NaN)).toThrow()
    expect(() => setCounter("episode", Number.POSITIVE_INFINITY)).toThrow()
  })
})
