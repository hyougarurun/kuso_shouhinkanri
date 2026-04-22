export default function Loading() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <div className="h-24 w-full bg-zinc-100 rounded animate-pulse" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-100 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-60 w-full bg-zinc-100 rounded animate-pulse" />
      </div>
      <div className="h-96 w-full bg-zinc-100 rounded animate-pulse" />
    </div>
  )
}
