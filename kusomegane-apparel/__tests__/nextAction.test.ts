import { describe, it, expect } from "vitest"
import { getNextActionLabel } from "@/lib/nextAction"
import { makeProduct } from "./fixtures/product"
import { FlowStep } from "@/types"

describe("nextAction (lib/nextAction.ts)", () => {
  it("TC-NXT-001: 全未完了時、次のアクションは STEP 1「✏️ デザイン作成」を返す", () => {
    const p = makeProduct()
    const label = getNextActionLabel(p)
    expect(label).toBe("✏️ デザイン作成")
  })

  it("TC-NXT-002: STEP 1〜3 完了時、STEP 4 の名前を返す", () => {
    const steps: FlowStep[] = [
      { stepNumber: 1, status: "done", notes: "" },
      { stepNumber: 2, status: "done", notes: "" },
      { stepNumber: 3, status: "done", notes: "" },
      { stepNumber: 4, status: "pending", notes: "" },
      { stepNumber: 5, status: "pending", notes: "" },
      { stepNumber: 6, status: "pending", notes: "" },
      { stepNumber: 7, status: "pending", notes: "" },
      { stepNumber: 8, status: "pending", notes: "" },
    ]
    const p = makeProduct({ steps, currentStep: 4 })
    expect(getNextActionLabel(p)).toBe("📤 メーカー共有（サンプル依頼）")
  })

  it("TC-NXT-003: 全 8 ステップ完了時、「✨ 販売中」を返す", () => {
    const steps: FlowStep[] = Array.from({ length: 8 }, (_, i) => ({
      stepNumber: i + 1,
      status: "done" as const,
      notes: "",
    }))
    const p = makeProduct({ steps, currentStep: 8 })
    expect(getNextActionLabel(p)).toBe("✨ 販売中")
  })
})
