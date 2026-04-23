const BULLET_PREFIX = /^[-・*]\s*/

export function parseSituation(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(BULLET_PREFIX, "").trim())
    .filter((line) => line.length > 0)
}
