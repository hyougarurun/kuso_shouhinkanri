import { getCharacter } from "@/lib/postCaption/characters"

export interface ComposeCaptionInput {
  title: string
  episode: number
  characterId: string
  body: string
  postNo: number
}

export const HASHTAGS = ["#KUSOMEGANE", "#ショートアニメ"] as const

export function composeCaption(input: ComposeCaptionInput): string {
  const character = getCharacter(input.characterId)
  if (!character) {
    throw new Error(`unknown character: ${input.characterId}`)
  }
  const trimmedBody = input.body.replace(/^\s+|\s+$/g, "")
  const trimmedBodyLines = trimmedBody
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")

  const headLine = `${input.title}#${input.episode}`

  return [
    headLine,
    "",
    character.titleLabel,
    trimmedBodyLines,
    "",
    `Post No.${input.postNo}`,
    ".",
    ...HASHTAGS,
  ].join("\n")
}
