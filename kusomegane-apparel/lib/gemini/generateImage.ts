/**
 * Gemini 2.5 Flash Image (a.k.a Nano Banana) クライアント。
 *
 * 用途: 既存画像 + テキスト指示 → 編集後画像 を生成する。
 * 公式 SDK は使わず fetch 直叩き（依存追加不要、Edge Runtime 互換）。
 *
 * 参考:
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *   key=API_KEY (URL クエリ) または x-goog-api-key ヘッダ
 *   body: { contents: [{ parts: [{ text }, { inlineData: { mimeType, data: <base64> } }] }] }
 *   response: candidates[0].content.parts[*].inlineData.data に base64 画像
 *
 * 価格 (2026-04 時点):
 *   - Gemini 2.5 Flash Image (Preview): 約 $0.039/枚（output token 課金、1290px max）
 */

const ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models"
const DEFAULT_MODEL = "gemini-2.5-flash-image"
const KEY_ENV = "GEMINI_API_KEY"

export interface GenerateImageInput {
  /** 編集元画像のバイナリ */
  sourceImage: ArrayBuffer | Buffer
  /** 編集元画像の MIME（image/png 等） */
  sourceMimeType: string
  /**
   * 追加参照画像（任意）。合成/差分指定 等で 2 枚目以降を渡す用途。
   * 順序はプロンプト内での参照順（Image 1=sourceImage, Image 2=extraImages[0], ...）。
   */
  extraImages?: Array<{
    buffer: ArrayBuffer | Buffer
    mimeType: string
  }>
  /** 編集指示プロンプト */
  prompt: string
  /** 上書き用モデル名（既定: gemini-2.5-flash-image） */
  model?: string
}

export interface GenerateImageResult {
  /** 生成画像の base64 データ */
  base64: string
  /** 生成画像の MIME（image/png 等） */
  mimeType: string
  /** 使用モデル名 */
  model: string
  /** 補足テキスト（モデルが返した text part があれば） */
  text?: string
}

function bufferToBase64(buf: ArrayBuffer | Buffer): string {
  if (Buffer.isBuffer(buf)) return buf.toString("base64")
  return Buffer.from(new Uint8Array(buf)).toString("base64")
}

export async function generateImage(
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  const apiKey = process.env[KEY_ENV]
  if (!apiKey) {
    throw new Error(
      `${KEY_ENV} が未設定です。.env.local に追加してください（取得: https://aistudio.google.com/apikey）`,
    )
  }

  const model = input.model ?? DEFAULT_MODEL
  const url = `${ENDPOINT_BASE}/${model}:generateContent`

  const requestParts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [
    { text: input.prompt },
    {
      inlineData: {
        mimeType: input.sourceMimeType,
        data: bufferToBase64(input.sourceImage),
      },
    },
  ]
  for (const extra of input.extraImages ?? []) {
    requestParts.push({
      inlineData: {
        mimeType: extra.mimeType,
        data: bufferToBase64(extra.buffer),
      },
    })
  }

  const body = {
    contents: [{ parts: requestParts }],
    generationConfig: {
      // 画像生成モデルは responseModalities で IMAGE を要求する
      responseModalities: ["IMAGE"],
    },
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 500)}`)
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string
          inlineData?: { mimeType?: string; data?: string }
        }>
      }
    }>
  }

  const parts = json.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p) => p.inlineData?.data)
  if (!imagePart?.inlineData?.data) {
    throw new Error(
      `Gemini レスポンスに画像が含まれていません: ${JSON.stringify(json).slice(0, 300)}`,
    )
  }

  const textPart = parts.find((p) => typeof p.text === "string")

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
    model,
    text: textPart?.text,
  }
}

export type CompositeLocation =
  | "front-center"
  | "front-left-chest"
  | "back-center"
  | "sleeve"
export type CompositeSize = "small" | "medium" | "large"

/**
 * 合成画像生成用プロンプトを組み立てる。
 * Image 1 = base（モデル着用画像）、Image 2 = デザインアートワーク。
 */
export function buildCompositePrompt(opts: {
  location: CompositeLocation
  size: CompositeSize
  additionalPrompt?: string
}): string {
  const locLabels: Record<CompositeLocation, string> = {
    "front-center": "center of the front/chest area",
    "front-left-chest": "left chest (small wappen-style placement)",
    "back-center": "center of the back panel (large print area)",
    sleeve: "upper sleeve",
  }
  const sizeLabels: Record<CompositeSize, string> = {
    small: "small (wappen / pocket-logo scale, about 8-10 cm wide)",
    medium: "medium (typical chest graphic scale, about 20-25 cm wide)",
    large: "large (full back-print scale, about 35-40 cm wide)",
  }

  const base = [
    `Image 1 is a photograph of a person wearing a garment.`,
    `Image 2 is a graphic artwork (logo / print design) to be applied onto the garment in Image 1.`,
    ``,
    `Task: produce a single photorealistic image where the artwork from Image 2 is printed on the garment in Image 1 at the ${locLabels[opts.location]}, at ${sizeLabels[opts.size]} scale.`,
    ``,
    `CRITICAL requirements:`,
    `- Preserve EVERYTHING else from Image 1 exactly: the same person (face, hair, body, pose, hands), the same background, the same lighting direction and color temperature, the same camera angle and framing, and the same garment (shape, color, material, wrinkles).`,
    `- Apply the artwork so it FOLLOWS the garment's fabric: match cloth wrinkles, shadows, and perspective so the print looks naturally printed, not pasted on top.`,
    `- Keep the artwork's proportions, colors, typography and shapes from Image 2 as faithfully as possible. Do NOT redraw, restyle, or reinterpret the artwork.`,
    `- If the artwork has a transparent background, only the visible shapes should appear on the garment (no white rectangle).`,
    `- Output a single high-resolution photorealistic image with the same aspect ratio as Image 1.`,
  ].join("\n")

  return opts.additionalPrompt
    ? `${base}\n\nAdditional notes: ${opts.additionalPrompt}`
    : base
}

/**
 * ガーメント変更用のプロンプトを組み立てる。
 * 既存画像の人物・背景・デザインを保ちつつ、服種だけを差し替える。
 */
export function buildGarmentSwapPrompt(targetGarment: string): string {
  const labels: Record<string, string> = {
    tshirt: "short-sleeve T-shirt",
    longsleeve: "long-sleeve crewneck T-shirt",
    crewneck: "crewneck pullover sweatshirt",
    hoodie: "pullover hoodie with drawstring hood and front kangaroo pocket",
  }
  const targetLabel = labels[targetGarment] ?? targetGarment
  return [
    `Edit the input photograph: change ONLY the garment the model is wearing to a ${targetLabel}.`,
    `Strictly preserve EVERYTHING ELSE: the same person (face, hair, body, pose), the same background, the same lighting, the same camera angle, and crucially THE EXACT SAME PRINT DESIGN, LOGO, GRAPHIC, AND TEXT on the garment.`,
    `The print/logo/graphic must be identical in shape, color, position, and scale — only the garment shape (sleeves, hem, collar) should differ to match a ${targetLabel}.`,
    `Match the original garment's color and texture as closely as possible.`,
    `Output a single high-resolution photorealistic image, same aspect ratio as the input.`,
  ].join(" ")
}
