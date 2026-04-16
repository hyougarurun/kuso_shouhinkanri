import { SampleCountdown as SampleCountdownData } from "@/types"

const COLOR_CLASS = {
  red: "text-red-600 font-bold",
  yellow: "text-amber-600 font-bold",
  normal: "text-zinc-600",
} as const

export function SampleCountdownLabel({
  data,
}: {
  data: SampleCountdownData | null
}) {
  if (!data) return null
  const { daysLeft, color } = data
  let text: string
  if (daysLeft > 0) text = `サンプル あと${daysLeft}日`
  else if (daysLeft === 0) text = "サンプル 本日到着予定"
  else text = `サンプル ${Math.abs(daysLeft)}日超過`
  return <span className={`text-[11px] ${COLOR_CLASS[color]}`}>{text}</span>
}
