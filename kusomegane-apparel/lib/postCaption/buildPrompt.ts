import { getCharacter } from "@/lib/postCaption/characters"

export interface BuildPromptInput {
  characterId: string
  situation: string[]
  targetLength?: number
}

export function buildPrompt(input: BuildPromptInput): string {
  const character = getCharacter(input.characterId)
  if (!character) {
    throw new Error(`unknown character: ${input.characterId}`)
  }
  const length = input.targetLength ?? character.defaultLength

  const lines: string[] = []
  lines.push(character.promptBody)
  lines.push("")

  if (input.situation.length > 0) {
    lines.push("## 状況メモ")
    for (const s of input.situation) {
      lines.push(`- ${s}`)
    }
    lines.push("")
  } else {
    lines.push(
      "状況メモはありません。画像（イラスト）から読み取れる情報だけで書いてください。"
    )
    lines.push("")
  }

  lines.push("## 出力ルール")
  lines.push("- 本文のみを返してください（タイトル・ハッシュタグ・Post No. は不要）")
  lines.push(`- 文字数: ${length} 字程度`)

  return lines.join("\n")
}
