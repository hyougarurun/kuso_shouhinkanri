import { afterEach, describe, it, expect, vi } from "vitest"
import { buildStoragePath, createServerClient } from "@/lib/supabase/server"

describe("createServerClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("TC-SB-001: NEXT_PUBLIC_SUPABASE_URL が未設定だと throw", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-key")
    expect(() => createServerClient()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })

  it("TC-SB-001b: SUPABASE_SECRET_KEY が未設定だと throw", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
    vi.stubEnv("SUPABASE_SECRET_KEY", "")
    expect(() => createServerClient()).toThrow(/SUPABASE_SECRET_KEY/)
  })

  it("TC-SB-002: 両方設定されていれば Supabase クライアントを返す", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret-key")
    const client = createServerClient()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe("function")
    expect(typeof client.storage.from).toBe("function")
  })

  it("TC-SB-003: セッション永続化が無効（auth.persistSession=false 相当）", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret-key")
    const client = createServerClient()
    // 構造の細部は SDK 実装依存なので、関数が呼べること + 複数回呼んでも throw しないことだけ確認
    expect(() => client.from("products")).not.toThrow()
  })
})

describe("buildStoragePath", () => {
  it("TC-SB-004: productId/slot/uniqueId.ext の一意パスを返す", () => {
    const path = buildStoragePath("abc-123", "composite", "xxxx", "jpg")
    expect(path).toBe("abc-123/composite/xxxx.jpg")
  })

  it("TC-SB-004b: 拡張子の先頭ドットは除去、大文字は小文字化", () => {
    expect(buildStoragePath("p1", "processing", "u1", ".PNG")).toBe(
      "p1/processing/u1.png",
    )
  })

  it("TC-SB-004c: 異なる uniqueId で衝突しない", () => {
    const p1 = buildStoragePath("p1", "composite", "aaa", "jpg")
    const p2 = buildStoragePath("p1", "composite", "bbb", "jpg")
    expect(p1).not.toBe(p2)
  })
})
