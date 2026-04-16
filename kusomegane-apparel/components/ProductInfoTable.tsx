import { Product } from "@/types"

export function ProductInfoTable({ product }: { product: Product }) {
  const rows: [string, React.ReactNode][] = [
    ["商品番号", product.productNumber],
    ["カラー", product.colors.join("・") || "-"],
    ["サイズ", product.sizes.join("/") || "-"],
    ["商品種別", product.productType || "-"],
    ["加工種別", product.processingType || "-"],
    ["加工指示", product.processingInstruction || "-"],
    ["ボディ型番", product.bodyModelNumber || "-"],
    ["素材", product.material || "-"],
    ["受注生産", product.isMadeToOrder ? "あり" : "なし"],
    ["送料無料", product.freeShipping ? "あり" : "なし"],
    ["備考", product.notes || "-"],
  ]
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full text-[12px]">
        <tbody>
          {rows.map(([k, v]) => (
            <tr
              key={k}
              className="border-b border-zinc-100 last:border-b-0 align-top"
            >
              <th className="bg-zinc-50 text-zinc-500 font-medium text-left px-3 py-2 w-28">
                {k}
              </th>
              <td className="px-3 py-2 text-zinc-900 whitespace-pre-wrap break-words">
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
