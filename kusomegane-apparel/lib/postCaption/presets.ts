export interface Preset {
  id: string
  name: string
  body: string
}

const STORAGE_KEY = "kuso:post-caption:presets"

const DEFAULT_PRESETS: Preset[] = [
  {
    id: "default-diary",
    name: "日記風",
    body: "添付のイラストの状況を、面白おかしく日記風に仕上げてください。",
  },
  {
    id: "default-monologue",
    name: "独り言風",
    body: "添付のイラストの人物の心の声を、独り言風に綴ってください。",
  },
  {
    id: "default-poem",
    name: "ポエム風",
    body: "添付のイラストから感じる情景を、短いポエム風に綴ってください。",
  },
  {
    id: "default-tsukkomi",
    name: "ツッコミ風",
    body: "添付のイラストの状況を、関西弁のツッコミ風に実況してください。",
  },
]

export function loadPresets(): Preset[] {
  if (typeof localStorage === "undefined") {
    return DEFAULT_PRESETS.map((p) => ({ ...p }))
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_PRESETS.map((p) => ({ ...p }))
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_PRESETS.map((p) => ({ ...p }))
    return parsed as Preset[]
  } catch {
    return DEFAULT_PRESETS.map((p) => ({ ...p }))
  }
}

export function savePresets(presets: Preset[]): void {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function addPreset(preset: Omit<Preset, "id">): Preset {
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const newPreset: Preset = { id, ...preset }
  const list = loadPresets()
  list.push(newPreset)
  savePresets(list)
  return newPreset
}

export function removePreset(id: string): void {
  const list = loadPresets().filter((p) => p.id !== id)
  savePresets(list)
}

export function updatePreset(
  id: string,
  patch: Partial<Omit<Preset, "id">>
): void {
  const list = loadPresets().map((p) => (p.id === id ? { ...p, ...patch } : p))
  savePresets(list)
}
