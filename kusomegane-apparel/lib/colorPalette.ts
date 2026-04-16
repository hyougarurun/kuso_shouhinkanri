export interface ColorStyle {
  bg: string
  fg: string
}

const PALETTE: Record<string, ColorStyle> = {
  ブラック: { bg: "#1f1f1f", fg: "#ffffff" },
  ホワイト: { bg: "#f5f5f5", fg: "#111111" },
  ネイビー: { bg: "#1e3a8a", fg: "#ffffff" },
  グレー: { bg: "#9ca3af", fg: "#111111" },
  ミックスグレー: { bg: "#6b7280", fg: "#ffffff" },
  ピンク: { bg: "#f9a8d4", fg: "#111111" },
  アッシュ: { bg: "#d1d5db", fg: "#111111" },
  マリンブルー: { bg: "#1e40af", fg: "#ffffff" },
  キャメル: { bg: "#b45309", fg: "#ffffff" },
  ロイヤルブルー: { bg: "#1d4ed8", fg: "#ffffff" },
  アシッドブルー: { bg: "#0ea5e9", fg: "#ffffff" },
  アイビーグリーン: { bg: "#166534", fg: "#ffffff" },
  ヘイジーブラック: { bg: "#374151", fg: "#ffffff" },
  バニラホワイト: { bg: "#fef3c7", fg: "#111111" },
  ナチュラル: { bg: "#e7d8b1", fg: "#111111" },
}

const FALLBACK: ColorStyle = { bg: "#e5e7eb", fg: "#111111" }

export function getColorStyle(colorName: string | undefined): ColorStyle {
  if (!colorName) return FALLBACK
  return PALETTE[colorName] ?? FALLBACK
}
