export type Tone = "tame" | "desu" | "dearu"

export interface BuildPromptInput {
  presetBody: string
  situation: string[]
  targetLength: number
  tone: Tone
}

const TONE_LABEL: Record<Tone, string> = {
  tame: "タメ口（フレンドリーに語りかける感じ）",
  desu: "です・ます調",
  dearu: "だ・である調",
}

export function buildPrompt(input: BuildPromptInput): string {
  const toneLabel = TONE_LABEL[input.tone] ?? TONE_LABEL.tame
  const lines: string[] = []
  lines.push(input.presetBody)
  lines.push("")
  if (input.situation.length > 0) {
    lines.push("## 状況")
    for (const s of input.situation) {
      lines.push(`- ${s}`)
    }
    lines.push("")
  } else {
    lines.push("状況メモは提供されていません。画像（イラスト）から読み取れる情報だけで書いてください。")
    lines.push("")
  }
  lines.push(`## 条件`)
  lines.push(`- 文字数: ${input.targetLength}字程度`)
  lines.push(`- 文体: ${toneLabel}`)
  return lines.join("\n")
}
