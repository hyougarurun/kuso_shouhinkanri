import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database, ImageSlotDB } from "./database.types"

const URL_ENV = "NEXT_PUBLIC_SUPABASE_URL"
const SECRET_ENV = "SUPABASE_SECRET_KEY"

/**
 * Server-side Supabase client（SERVICE_ROLE_KEY 相当の Secret キー経由）。
 * セッション管理は不要なので auth 系オプションを無効化。
 */
export function createServerClient(): SupabaseClient<Database> {
  const url = process.env[URL_ENV]
  const key = process.env[SECRET_ENV]
  if (!url) {
    throw new Error(`${URL_ENV} が未設定です（.env.local を確認してください）`)
  }
  if (!key) {
    throw new Error(`${SECRET_ENV} が未設定です（.env.local を確認してください）`)
  }
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Supabase Storage 上のファイルパスを `<productId>/<slot>/<uniqueId>.<ext>` で組み立てる。
 * uniqueId は UUID 等呼び出し側で一意性担保すること（衝突防止）。
 */
export function buildStoragePath(
  productId: string,
  slot: ImageSlotDB,
  uniqueId: string,
  extension: string,
): string {
  const safeExt = extension.replace(/^\./, "").toLowerCase()
  return `${productId}/${slot}/${uniqueId}.${safeExt}`
}
