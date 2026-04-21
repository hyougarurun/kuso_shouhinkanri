/**
 * Supabase Signed URL のセッションキャッシュ。
 *
 * list API は Signed URL を TTL 2h で発行する。
 * ページ遷移や再フィルタの度に全件再発行するのは無駄なので、
 * storagePath → { url, expiresAt } の map を sessionStorage に保持。
 *
 * 画質を落とさない、壊さない：
 * - キャッシュは URL 文字列のみ（画像バイナリは触らない）
 * - TTL を API 発行 TTL より少し短く（90 分）して保守的に
 * - 期限切れは呼び出し側で判定
 */

const STORAGE_KEY = "kuso:signed-url-cache:v1"
const CACHE_TTL_MS = 90 * 60 * 1000 // 90 min

type CacheEntry = { url: string; expiresAt: number }
type Cache = Record<string, CacheEntry>

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined"
}

function loadCache(): Cache {
  if (!isBrowser()) return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return {}
    return parsed as Cache
  } catch {
    return {}
  }
}

function saveCache(cache: Cache): void {
  if (!isBrowser()) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // sessionStorage quota exceeded 等は無視（キャッシュはベストエフォート）
  }
}

/** storagePath → 有効な Signed URL を返す。期限切れ/未登録なら undefined */
export function getCachedSignedUrl(storagePath: string): string | undefined {
  const cache = loadCache()
  const entry = cache[storagePath]
  if (!entry) return undefined
  if (Date.now() >= entry.expiresAt) return undefined
  return entry.url
}

/** storagePath → signed URL を登録 */
export function putCachedSignedUrl(storagePath: string, url: string): void {
  if (!url) return
  const cache = loadCache()
  cache[storagePath] = { url, expiresAt: Date.now() + CACHE_TTL_MS }
  saveCache(cache)
}

/**
 * API レスポンスのモデル配列を受け取り、signedUrl をキャッシュに保存する。
 * 新規取得した URL だけが保存対象（既存エントリは上書きで更新）。
 */
export function ingestSignedUrls(
  models: Array<{ storagePath: string; signedUrl: string }>,
): void {
  if (!isBrowser()) return
  const cache = loadCache()
  const now = Date.now()
  for (const m of models) {
    if (!m.signedUrl) continue
    cache[m.storagePath] = {
      url: m.signedUrl,
      expiresAt: now + CACHE_TTL_MS,
    }
  }
  saveCache(cache)
}
