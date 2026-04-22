export default function Loading() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1 h-96 bg-zinc-100 rounded-lg animate-pulse" />
      <div className="col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
