export type ModelId =
  | "claude-haiku-4-5-20251001"
  | "claude-sonnet-4-6"
  | "claude-opus-4-7"
  | "gpt-4o"
  | "gemini-2.5-flash"

export interface ModelOption {
  id: ModelId
  label: string
  provider: "claude" | "openai" | "gemini"
  hint: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5（推奨・最速）",
    provider: "claude",
    hint: "3件並列・量を回すのに最適",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6（バランス）",
    provider: "claude",
    hint: "品質重視時",
  },
  {
    id: "claude-opus-4-7",
    label: "Claude Opus 4.7（最高品質・高コスト）",
    provider: "claude",
    hint: "コスト高。ここぞの時に",
  },
  {
    id: "gpt-4o",
    label: "OpenAI gpt-4o（比較用）",
    provider: "openai",
    hint: "Phase C6 で対応",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash（比較用）",
    provider: "gemini",
    hint: "Phase C6 で対応",
  },
]

export const DEFAULT_MODEL_ID: ModelId = "claude-haiku-4-5-20251001"

export const LENGTH_PRESETS = [200, 500, 800] as const
export const LENGTH_MIN = 100
export const LENGTH_MAX = 1200
export const DEFAULT_LENGTH = 500

export const TONE_OPTIONS = [
  { value: "tame", label: "タメ口" },
  { value: "desu", label: "です・ます調" },
  { value: "dearu", label: "だ・である調" },
] as const

export const DEFAULT_TONE = "tame"
