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

/**
 * 毎回コンテキストを「ゼロから始めた」扱いで生成するためのプロンプト分岐子。
 * - 乱数の nonce を入れることで、プロンプトハッシュが変わる（プロキシキャッシュ対策）
 * - モデルに「前回の傾向に引きずられず自由に構図・ポーズ・アクセサリーを変えてよい」と明示
 *
 * Gemini API 自体は stateless（サーバ側に履歴は残らない）が、
 * 同一プロンプト + 同一画像を与えると潜在空間の同じ地点に落ちがちなので、
 * これで毎回の探索起点をずらす。
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
    { text: input.prompt + buildFreshContextSalt() },
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
      // 温度を高めにして、同じ入力でも毎回違うサンプリング経路を取るようにする。
      // 上げすぎるとプリントが歪むリスクがあるので 1.1 程度に抑える。
      temperature: 1.1,
      topP: 0.95,
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

export type VariationMode = "conservative" | "balanced" | "creative"

/**
 * ガーメント変更プロンプト。
 * variationMode で「人物・ポーズ・背景をどれだけ保持するか」の自由度を切替える。
 *
 * - conservative: 元の写真から服種だけ差し替え（人物/ポーズ/背景すべて保持）
 * - balanced: プリントと服色は完全保持、顔・ポーズ・背景は自然な範囲で変えて OK
 * - creative: プリントと服種だけ保持、モデル・ポーズ・構図・背景は大胆にリアレンジ
 *
 * 共通で絶対保持: **プリント/ロゴ/グラフィック/テキストのデザイン**
 * （k2 運用: 顔変わる OK、ポーズ柔軟に変えたい、デザインは保持必須）
 */
export function buildGarmentSwapPrompt(
  targetGarment: string,
  variationMode: VariationMode = "balanced",
): string {
  const labels: Record<string, string> = {
    tshirt: "short-sleeve T-shirt",
    longsleeve: "long-sleeve crewneck T-shirt",
    crewneck: "crewneck pullover sweatshirt",
    hoodie: "pullover hoodie with drawstring hood and front kangaroo pocket",
  }
  const targetLabel = labels[targetGarment] ?? targetGarment

  const header = `Generate a new apparel lookbook photograph based on the input image. The new photograph shows a young Japanese model wearing a ${targetLabel}.`

  const preserveDesign = [
    `ABSOLUTELY PRESERVE the garment's print/logo/graphic/text design from the input, identical in shape, colors, typography, proportions, and composition.`,
    `Do NOT redraw, restyle, or reinterpret the print artwork. Only the garment's silhouette (sleeves, hem, collar) should change to match a ${targetLabel}.`,
    `Also keep the garment's base color close to the original.`,
  ].join(" ")

  const flexibility: Record<VariationMode, string> = {
    conservative: [
      `Keep the SAME person (face, hair, body, hands), the SAME pose, the SAME background, the SAME lighting, the SAME camera angle.`,
    ].join(" "),
    balanced: [
      `The model can be a DIFFERENT Japanese person of similar age (20s) — face, hair, and exact body do NOT need to match the input.`,
      `The pose may change naturally (standing, hands in pockets, slight lean, looking at camera, etc.) as long as the garment is fully visible.`,
      `Background can be a similar solid-color studio backdrop (any pleasing color).`,
      `Lighting should remain flat, even, professional studio lighting.`,
    ].join(" "),
    creative: [
      `Freely reimagine the scene: the model can be a different young Japanese person, different pose, different framing (front-facing / three-quarter / back-turn / sitting / walking), different camera angle, different solid or simple background.`,
      `Feel free to introduce natural variation — make it look like a fresh lookbook shot, not a copy of the input.`,
      `Keep it photorealistic and professional; avoid abstract or fantasy backgrounds.`,
    ].join(" "),
  }

  return [
    header,
    preserveDesign,
    flexibility[variationMode],
    `Output a single high-resolution photorealistic fashion e-commerce photograph, same aspect ratio as the input.`,
  ].join("\n\n")
}
