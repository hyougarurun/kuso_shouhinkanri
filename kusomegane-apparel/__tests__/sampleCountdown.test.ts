import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { computeSampleCountdown } from "@/lib/sampleCountdown"

describe("sampleCountdown (lib/sampleCountdown.ts)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-16T00:00:00.000Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("TC-CDN-001: 残日数 4 日以上は color が 'normal'", () => {
    const r = computeSampleCountdown("2026-04-30")
    expect(r).not.toBeNull()
    expect(r!.daysLeft).toBe(14)
    expect(r!.color).toBe("normal")
  })

  it("TC-CDN-002: 残日数 1〜3 日は color が 'yellow'", () => {
    const r3 = computeSampleCountdown("2026-04-19")
    const r1 = computeSampleCountdown("2026-04-17")
    expect(r3!.daysLeft).toBe(3)
    expect(r3!.color).toBe("yellow")
    expect(r1!.daysLeft).toBe(1)
    expect(r1!.color).toBe("yellow")
  })

  it("TC-CDN-003: 残日数 0 日以下は color が 'red'", () => {
    const r0 = computeSampleCountdown("2026-04-16")
    const rNeg = computeSampleCountdown("2026-04-15")
    expect(r0!.daysLeft).toBe(0)
    expect(r0!.color).toBe("red")
    expect(rNeg!.daysLeft).toBe(-1)
    expect(rNeg!.color).toBe("red")
  })

  it("TC-CDN-004: sampleArrivalDate 未設定時は null を返す", () => {
    expect(computeSampleCountdown(undefined)).toBeNull()
    expect(computeSampleCountdown("")).toBeNull()
    expect(() => computeSampleCountdown(undefined)).not.toThrow()
  })
})
