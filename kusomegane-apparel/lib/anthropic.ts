import Anthropic from "@anthropic-ai/sdk"
import { ImageAnalysis, Product } from "@/types"

const MODEL = "claude-sonnet-4-20250514"

function getClient(): Anthropic {
  return new Anthropic()
}

export async function analyzeProductImage(
  base64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<ImageAnalysis> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `この商品合成画像（白背景）を分析してJSONのみ返答:
{"productType":"Tシャツ/パーカー/スウェット/ロンT/トートバッグ/キャップ/その他","bodyColor":"色名（日本語）","designElements":"デザイン要素の説明","processingHint":"刺繍/プリント/DTF/転写/その他","overallVibe":"全体の雰囲気（20字以内）"}`,
          },
        ],
      },
    ],
  })
  const block = response.content[0]
  const text = block.type === "text" ? block.text : ""
  return parseJsonObject<ImageAnalysis>(text)
}

export async function generateCaption(
  product: Partial<Product>,
  analysis: ImageAnalysis | null
): Promise<{ description: string; designDesc: string }> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system:
      "あなたはKUSOMEGANEブランドのEC担当者です。フレンドリー・ポップ・ファンと近い文体で書いてください。「〜です！」「〜してほしい！」調。JSONのみ返答。",
    messages: [
      {
        role: "user",
        content: `商品名: ${product.name ?? ""}
シリーズ: ${product.series ?? ""}
カラー: ${(product.colors ?? []).join("・")}
加工種別: ${product.processingType ?? ""}
受注生産: ${product.isMadeToOrder ? "あり（約3週間）" : "なし"}
画像解析: ${JSON.stringify(analysis ?? {})}

参考文体: ポチクソシリーズが、選べるようになりました！〜お揃いとかプレゼントとかでも楽しんでほしい！

{"description":"3〜5文のシリーズ説明+商品説明+購買促進文（プレゼント・お揃い需要にも触れる）","designDesc":"【商品情報】デザイン欄に入れる1文"}`,
      },
    ],
  })
  const block = response.content[0]
  const text = block.type === "text" ? block.text : ""
  return parseJsonObject<{ description: string; designDesc: string }>(text)
}

function parseJsonObject<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned) as T
}
