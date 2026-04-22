export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-40 bg-zinc-200 rounded animate-pulse" />
      <div className="h-3 w-80 bg-zinc-100 rounded animate-pulse" />
      <div className="flex gap-2 overflow-x-auto pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[160px] h-[200px] rounded-lg bg-zinc-100 animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
