/**
 * OpenAI Image Edit API クライアント（gpt-image-2 等）。
 *
 * 用途: 既存画像 + テキスト指示 → 編集後画像 を生成する。
 * 公式 SDK は使わず fetch + FormData 直叩き（依存追加不要）。
 *
 * エンドポイント: POST https://api.openai.com/v1/images/edits
 * Auth: Bearer $OPENAI_API_KEY
 *
 * 参考:
 *   https://developers.openai.com/api/docs/guides/image-generation
 *   https://developers.openai.com/api/docs/models/gpt-image-2
 *
 * 価格 (gpt-image-2, 2026-04 時点):
 *   - Low:    $0.005–0.006 / image
 *   - Medium: $0.041–0.053 / image
 *   - High:   $0.165–0.211 / image
 *   （size でやや変動。入力トークン代が別途かかる）
 *
 * 注意: gpt-image-2 はサーバ側で常に高忠実度で入力画像を処理するため、
 * input_fidelity パラメータは不要。
 */

const ENDPOINT = "https://api.openai.com/v1/images/edits"
const KEY_ENV = "OPENAI_API_KEY"

export type OpenAIImageQuality = "low" | "medium" | "high" | "auto"
export type OpenAIImageSize =
  | "1024x1024"
  | "1024x1536"
  | "1536x1024"
  | "auto"

export interface OpenAIGenerateImageInput {
  sourceImage: ArrayBuffer | Buffer
  sourceMimeType: string
  prompt: string
  /** 既定 "gpt-image-2"。失敗時は "gpt-image-1.5" 等に切替可能 */
  model?: string
  quality?: OpenAIImageQuality
  size?: OpenAIImageSize
}

export interface OpenAIGenerateImageResult {
  base64: string
  mimeType: string
  model: string
  quality: OpenAIImageQuality
  size: OpenAIImageSize
}

/**
 * 毎回コンテキストを「ゼロから始めた」扱いで生成するためのプロンプト分岐子。
 * Gemini クライアントと同じ思想（nonce + フリー変化指示）。
 */
function buildFreshContextSalt(): string {
  const nonce =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return [
    ``,
    `---`,
    `[Generation context: start completely fresh. This is an INDEPENDENT generation,`,
    `do NOT base accessories, pose, camera angle, background details, or composition`,
    `on any prior output. Freely pick a different pose, different accessories (or none),`,
    `different framing, different lighting mood, and different micro-details — while`,
    `strictly obeying the preservation constraints stated above.`,
    `Variation nonce: ${nonce}]`,
  ].join("\n")
}

function toArrayBuffer(buf: ArrayBuffer | Buffer): ArrayBuffer {
  if (Buffer.isBuffer(buf)) {
    // Buffer は共有 ArrayBuffer を参照している可能性があるためコピーして独立 ArrayBuffer に
    const copy = new ArrayBuffer(buf.byteLength)
    new Uint8Array(copy).set(buf)
    return copy
  }
  return buf
}

function filenameForMime(mime: string): string {
  if (mime === "image/png") return "source.png"
  if (mime === "image/jpeg") return "source.jpg"
  if (mime === "image/webp") return "source.webp"
  return "source.png"
}

export async function generateImage(
  input: OpenAIGenerateImageInput,
): Promise<OpenAIGenerateImageResult> {
  const apiKey = process.env[KEY_ENV]
  if (!apiKey) {
    throw new Error(
      `${KEY_ENV} が未設定です。.env.local に追加してください（取得: https://platform.openai.com/api-keys）`,
    )
  }

  const model = input.model ?? "gpt-image-2"
  const quality = input.quality ?? "medium"
  // base モデルはスクエア投入が主なので既定もスクエアに揃える。
  // High だけ 2:3 で返って縦長化する問題の対策（1024x1536 → 1024x1024）。
  const size = input.size ?? "1024x1024"

  const form = new FormData()
  form.append("model", model)
  form.append(
    "image",
    new Blob([toArrayBuffer(input.sourceImage)], {
      type: input.sourceMimeType,
    }),
    filenameForMime(input.sourceMimeType),
  )
  form.append("prompt", input.prompt + buildFreshContextSalt())
  form.append("size", size)
  form.append("quality", quality)
  form.append("n", "1")

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(
      `OpenAI Images API ${res.status}: ${errText.slice(0, 600)}`,
    )
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>
  }

  const first = json.data?.[0]
  if (!first) {
    throw new Error(
      `OpenAI レスポンスに data が含まれていません: ${JSON.stringify(json).slice(0, 300)}`,
    )
  }

  let base64 = first.b64_json
  if (!base64 && first.url) {
    // URL レスポンスの場合はダウンロードして base64 化（現行 gpt-image-2 は b64_json 返却想定だが念のため）
    const imgRes = await fetch(first.url)
    if (!imgRes.ok) {
      throw new Error(`生成画像ダウンロード失敗: ${imgRes.status}`)
    }
    const buf = new Uint8Array(await imgRes.arrayBuffer())
    base64 = Buffer.from(buf).toString("base64")
  }

  if (!base64) {
    throw new Error("OpenAI レスポンスに画像データが含まれていません")
  }

  return {
    base64,
    // gpt-image-2 の既定は PNG
    mimeType: "image/png",
    model,
    quality,
    size,
  }
}
