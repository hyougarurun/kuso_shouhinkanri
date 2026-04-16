export function Summary({
  total,
  inProgress,
  done,
}: {
  total: number
  inProgress: number
  done: number
}) {
  const items = [
    { label: "総商品数", value: total, color: "text-zinc-900" },
    { label: "対応中", value: inProgress, color: "text-amber-600" },
    { label: "完了", value: done, color: "text-green-600" },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="bg-white rounded-lg px-3 py-2 text-center shadow-sm"
        >
          <div className="text-[10px] text-zinc-500">{it.label}</div>
          <div className={`text-2xl font-bold ${it.color}`}>{it.value}</div>
        </div>
      ))}
    </div>
  )
}
