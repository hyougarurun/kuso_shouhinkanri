export type CounterKind = "episode" | "postNo"

const KEYS: Record<CounterKind, string> = {
  episode: "kuso:post-caption:counter:episode",
  postNo: "kuso:post-caption:counter:postNo",
}

function isValidPositiveInt(n: number): boolean {
  return Number.isInteger(n) && Number.isFinite(n) && n >= 0
}

export function getCounter(kind: CounterKind): number | null {
  if (typeof localStorage === "undefined") return null
  const raw = localStorage.getItem(KEYS[kind])
  if (raw === null) return null
  const n = Number(raw)
  return Number.isInteger(n) ? n : null
}

export function setCounter(kind: CounterKind, value: number): void {
  if (!isValidPositiveInt(value)) {
    throw new Error(
      `invalid counter value: ${value} (must be non-negative integer)`
    )
  }
  if (typeof localStorage === "undefined") return
  localStorage.setItem(KEYS[kind], String(value))
}

export function bumpCounter(kind: CounterKind): number {
  const current = getCounter(kind)
  if (current === null) {
    throw new Error(
      `counter ${kind} は未設定です。先に setCounter で初期値を入れてください。`
    )
  }
  const next = current + 1
  setCounter(kind, next)
  return next
}
