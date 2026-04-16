export function ProgressBar({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex gap-0.5 w-full">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-sm ${
            i < done ? "bg-brand-yellow" : "bg-white/40"
          }`}
        />
      ))}
    </div>
  )
}
