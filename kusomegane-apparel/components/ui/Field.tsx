export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-bold text-zinc-700 mb-1">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
        {hint && <span className="text-zinc-400 font-normal ml-2">{hint}</span>}
      </div>
      {children}
    </label>
  )
}
