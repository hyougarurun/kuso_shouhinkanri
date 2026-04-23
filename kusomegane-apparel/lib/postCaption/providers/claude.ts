import Anthropic from "@anthropic-ai/sdk"
import type { ModelId } from "@/lib/postCaption/constants"

export type SupportedMediaType = "image/jpeg" | "image/png" | "image/webp"

export interface ClaudeGenerateInput {
  model: ModelId
  prompt: string
  image?: {
    base64: string
    mediaType: SupportedMediaType
  }
  maxTokens?: number
}

const SYSTEM_PROMPT =
  "あなたは KUSOMEGANE ブランド（眼鏡をかけた脱力系キャラクター）の SNS 投稿キャプションを書くライターです。添付イラストと指示に従って、自然な日本語のキャプション本文だけを出力してください。前置き・解説・マークダウン記号は不要です。"

export async function generateWithClaude(
  input: ClaudeGenerateInput
): Promise<string> {
  const client = new Anthropic()
  const content: Anthropic.Messages.ContentBlockParam[] = []

  if (input.image) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.image.mediaType,
        data: input.image.base64,
      },
    })
  }
  content.push({ type: "text", text: input.prompt })

  const response = await client.messages.create({
    model: input.model,
    max_tokens: input.maxTokens ?? 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  })

  const block = response.content[0]
  if (block?.type !== "text") {
    throw new Error("Claude から text 応答が返りませんでした")
  }
  return block.text.trim()
}
