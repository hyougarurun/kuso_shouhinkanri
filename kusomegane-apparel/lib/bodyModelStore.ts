import { STORAGE_KEYS } from "@/constants"
import { DEFAULT_BODY_MODELS, BodyModelEntry } from "@/constants/bodyModels"

function getCustomModels(): BodyModelEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BODY_MODELS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCustomModels(models: BodyModelEntry[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.BODY_MODELS, JSON.stringify(models))
}

export function getBodyModels(): BodyModelEntry[] {
  const custom = getCustomModels()
  const merged = [...DEFAULT_BODY_MODELS]
  for (const c of custom) {
    const idx = merged.findIndex((m) => m.model === c.model)
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], material: c.material }
    } else {
      merged.push(c)
    }
  }
  return merged
}

export function addBodyModel(model: string, material: string): void {
  const custom = getCustomModels()
  custom.push({ model, material, isDefault: false })
  saveCustomModels(custom)
}

export function updateBodyModel(model: string, material: string): void {
  const custom = getCustomModels()
  const idx = custom.findIndex((m) => m.model === model)
  if (idx >= 0) {
    custom[idx] = { ...custom[idx], material }
  } else {
    custom.push({ model, material, isDefault: false })
  }
  saveCustomModels(custom)
}

export function deleteBodyModel(model: string): void {
  const isDefault = DEFAULT_BODY_MODELS.some((d) => d.model === model)
  if (isDefault) return
  const custom = getCustomModels().filter((m) => m.model !== model)
  saveCustomModels(custom)
}

export function getMaterialForModel(model: string): string | undefined {
  const all = getBodyModels()
  return all.find((m) => m.model === model)?.material
}
