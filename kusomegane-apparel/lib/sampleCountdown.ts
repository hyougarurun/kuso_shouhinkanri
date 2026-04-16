import { CountdownColor, SampleCountdown } from "@/types"

const MS_PER_DAY = 24 * 60 * 60 * 1000

function colorFor(daysLeft: number): CountdownColor {
  if (daysLeft <= 0) return "red"
  if (daysLeft <= 3) return "yellow"
  return "normal"
}

export function computeSampleCountdown(
  sampleArrivalDate: string | undefined | null
): SampleCountdown | null {
  if (!sampleArrivalDate) return null
  const target = new Date(sampleArrivalDate)
  if (isNaN(target.getTime())) return null

  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate())
  const daysLeft = Math.round((targetUtc - todayUtc) / MS_PER_DAY)

  return { daysLeft, color: colorFor(daysLeft) }
}
