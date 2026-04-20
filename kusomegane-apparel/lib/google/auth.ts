import { google } from "googleapis"
import type { OAuth2Client } from "google-auth-library"

const CLIENT_ID_ENV = "GOOGLE_CLIENT_ID"
const CLIENT_SECRET_ENV = "GOOGLE_CLIENT_SECRET"
const REFRESH_TOKEN_ENV = "GOOGLE_REFRESH_TOKEN"

/**
 * サーバーサイド用の Google OAuth2 クライアントを生成する。
 * refresh_token を使った自動再認証モード。
 */
export function createOAuth2Client(): OAuth2Client {
  const clientId = process.env[CLIENT_ID_ENV]
  const clientSecret = process.env[CLIENT_SECRET_ENV]
  const refreshToken = process.env[REFRESH_TOKEN_ENV]

  if (!clientId) throw new Error(`${CLIENT_ID_ENV} が未設定です`)
  if (!clientSecret) throw new Error(`${CLIENT_SECRET_ENV} が未設定です`)
  if (!refreshToken) throw new Error(`${REFRESH_TOKEN_ENV} が未設定です`)

  const client = new google.auth.OAuth2(clientId, clientSecret)
  client.setCredentials({ refresh_token: refreshToken })
  return client
}
