/**
 * フリーテキスト入力の履歴ストア。
 * LocalStorage に keyed list で保存し、SuggestiveInput 等から参照する。
 *
 * 設計:
 * - キーごとに独立したリスト（例: "baseModel.garmentColor"）
 * - 新しい順、重複は先頭に集約
 * - 上限超過で末尾から押し出し
 * - SSR / 非ブラウザ環境では noop（typeof window === "undefined"）
 */

const STORAGE_PREFIX = "kuso:input-history:"
export const HISTORY_MAX = 30

function fullKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

export function loadInputHistory(key: string): string[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(fullKey(key))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === "string")
  } catch {
    return []
  }
}

function saveInputHistory(key: string, list: string[]): void {
  if (!isBrowser()) return
  localStorage.setItem(fullKey(key), JSON.stringify(list))
}

export function pushInputHistory(key: string, value: string): void {
  const trimmed = value.trim()
  if (trimmed === "") return
  const current = loadInputHistory(key)
  const deduped = current.filter((v) => v !== trimmed)
  const next = [trimmed, ...deduped].slice(0, HISTORY_MAX)
  saveInputHistory(key, next)
}

export function removeInputHistoryItem(key: string, value: string): void {
  const current = loadInputHistory(key)
  const next = current.filter((v) => v !== value)
  saveInputHistory(key, next)
}

export function clearInputHistory(key: string): void {
  if (!isBrowser()) return
  localStorage.removeItem(fullKey(key))
}
