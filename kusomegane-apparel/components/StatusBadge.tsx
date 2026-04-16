import { ProductStatus, STATUS_LABEL } from "@/lib/productStatus"

const STYLES: Record<ProductStatus, string> = {
  not_started: "bg-zinc-200 text-zinc-700",
  in_progress: "bg-brand-yellow text-black",
  done: "bg-step-done text-white",
}

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
