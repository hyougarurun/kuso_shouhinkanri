export default function Loading() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-5 w-32 bg-zinc-200 rounded animate-pulse" />
          <div className="h-3 w-56 bg-zinc-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-7 w-24 bg-zinc-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-zinc-100 animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
