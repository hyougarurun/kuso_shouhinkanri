import { describe, it, expect } from "vitest"
import { STORAGE_KEYS } from "@/constants"
import { DEFAULT_BODY_MODELS } from "@/constants/bodyModels"

describe("bodyModelStore (lib/bodyModelStore.ts)", () => {
  // lazy import so each test gets fresh localStorage
  async function getStore() {
    return await import("@/lib/bodyModelStore")
  }

  it("TC-BMS-001: getBodyModels はデフォルト型番を全て含む", async () => {
    const { getBodyModels } = await getStore()
    const models = getBodyModels()
    expect(models.length).toBeGreaterThanOrEqual(DEFAULT_BODY_MODELS.length)
    for (const d of DEFAULT_BODY_MODELS) {
      const found = models.find((m) => m.model === d.model)
      expect(found).toBeDefined()
      expect(found!.material).toBe(d.material)
    }
  })

  it("TC-BMS-002: addBodyModel でカスタム型番を追加できる", async () => {
    const { getBodyModels, addBodyModel } = await getStore()
    addBodyModel("CUSTOM-01", "ポリエステル100%")
    const models = getBodyModels()
    const custom = models.find((m) => m.model === "CUSTOM-01")
    expect(custom).toBeDefined()
    expect(custom!.material).toBe("ポリエステル100%")
    expect(custom!.isDefault).toBe(false)
  })

  it("TC-BMS-003: addBodyModel はLocalStorageに永続化される", async () => {
    const { addBodyModel } = await getStore()
    addBodyModel("CUSTOM-02", "ナイロン")
    const raw = localStorage.getItem(STORAGE_KEYS.BODY_MODELS)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ model: "CUSTOM-02", material: "ナイロン" }),
      ])
    )
  })

  it("TC-BMS-004: updateBodyModel でデフォルト型番の素材を変更できる", async () => {
    const { getBodyModels, updateBodyModel } = await getStore()
    updateBodyModel("5001-01", "ポリ混紡")
    const models = getBodyModels()
    const updated = models.find((m) => m.model === "5001-01")
    expect(updated).toBeDefined()
    expect(updated!.material).toBe("ポリ混紡")
  })

  it("TC-BMS-005: deleteBodyModel でカスタム型番を削除できる", async () => {
    const { getBodyModels, addBodyModel, deleteBodyModel } = await getStore()
    addBodyModel("DEL-01", "テスト素材")
    expect(getBodyModels().find((m) => m.model === "DEL-01")).toBeDefined()
    deleteBodyModel("DEL-01")
    expect(getBodyModels().find((m) => m.model === "DEL-01")).toBeUndefined()
  })

  it("TC-BMS-006: deleteBodyModel でデフォルト型番は削除できない", async () => {
    const { getBodyModels, deleteBodyModel } = await getStore()
    deleteBodyModel("5001-01")
    const models = getBodyModels()
    expect(models.find((m) => m.model === "5001-01")).toBeDefined()
  })

  it("TC-BMS-007: getMaterialForModel でマッピング済み型番の素材を取得できる", async () => {
    const { getMaterialForModel } = await getStore()
    expect(getMaterialForModel("5001-01")).toBe("綿100% 5.6oz")
    expect(getMaterialForModel("1490-01")).toBe("コットン")
  })

  it("TC-BMS-008: getMaterialForModel で未登録型番は undefined を返す", async () => {
    const { getMaterialForModel } = await getStore()
    expect(getMaterialForModel("UNKNOWN-99")).toBeUndefined()
  })
})
