"use client"

export function Chip({
  children,
  selected,
  onClick,
  size = "sm",
  colorDot,
}: {
  children: React.ReactNode
  selected: boolean
  onClick: () => void
  size?: "sm" | "md"
  colorDot?: string
}) {
  const base =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full font-medium border transition ${base} ${
        selected
          ? "bg-black text-white border-black"
          : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500"
      }`}
    >
      {colorDot && (
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0 border border-zinc-300"
          style={{ backgroundColor: colorDot }}
        />
      )}
      {children}
    </button>
  )
}
