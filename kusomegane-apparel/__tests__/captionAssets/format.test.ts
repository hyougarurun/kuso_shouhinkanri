import { describe, it, expect } from "vitest"
import {
  deriveLabel,
  listCategories,
  groupByCategory,
} from "@/lib/captionAssets/format"
import type { CaptionAsset } from "@/types"

function asset(partial: Partial<CaptionAsset>): CaptionAsset {
  return {
    id: partial.id ?? "asset_x",
    label: partial.label ?? "L",
    body: partial.body ?? "B",
    category: partial.category ?? "",
    createdAt: partial.createdAt ?? "2026-04-24T00:00:00Z",
    updatedAt: partial.updatedAt ?? "2026-04-24T00:00:00Z",
  }
}

describe("captionAssets format", () => {
  it("TC-AS-001: deriveLabel — explicit が非空ならそのまま返す", () => {
    expect(deriveLabel("本文ABCDE", "期間限定")).toBe("期間限定")
  })

  it("TC-AS-002: deriveLabel — explicit が空なら body 先頭 20 文字", () => {
    const body = "あいうえお".repeat(5) // 25 文字
    expect(deriveLabel(body, "")).toBe("あいうえお".repeat(4))
  })

  it("TC-AS-003: deriveLabel — explicit が空白のみなら body から自動生成", () => {
    expect(deriveLabel("本文", "  　 ")).toBe("本文")
  })

  it("TC-AS-004: deriveLabel — body の前後改行・空白は除いて先頭から取る", () => {
    expect(deriveLabel("\n\n  ABCDE\n  ", "")).toBe("ABCDE")
  })

  it("TC-AS-005: deriveLabel — body も空白のみなら (無題)", () => {
    expect(deriveLabel("   \n  ", "")).toBe("(無題)")
  })

  it("TC-AS-006: listCategories — ユニーク・空除外・出現順保持", () => {
    const list: CaptionAsset[] = [
      asset({ id: "1", category: "販売条件" }),
      asset({ id: "2", category: "" }),
      asset({ id: "3", category: "配送" }),
      asset({ id: "4", category: "販売条件" }),
    ]
    expect(listCategories(list)).toEqual(["販売条件", "配送"])
  })

  it("TC-AS-007: groupByCategory — 未分類グループが末尾", () => {
    const list: CaptionAsset[] = [
      asset({ id: "a", category: "" }),
      asset({ id: "b", category: "販売条件" }),
      asset({ id: "c", category: "配送" }),
    ]
    const grouped = groupByCategory(list)
    expect(grouped.at(-1)?.category).toBe("")
  })

  it("TC-AS-008: groupByCategory — 各グループ内で入力順を保持", () => {
    const list: CaptionAsset[] = [
      asset({ id: "1", category: "販売条件", updatedAt: "2026-04-24T03:00:00Z" }),
      asset({ id: "2", category: "販売条件", updatedAt: "2026-04-24T01:00:00Z" }),
      asset({ id: "3", category: "販売条件", updatedAt: "2026-04-24T02:00:00Z" }),
    ]
    const grouped = groupByCategory(list)
    expect(grouped[0].items.map((x) => x.id)).toEqual(["1", "2", "3"])
  })
})
