import { Product } from "@/types"

export function buildFullCaption(
  product: Partial<Product>,
  description: string,
  designDesc: string
): string {
  const lines: string[] = []

  if (product.isMadeToOrder)
    lines.push("※※※※※【この商品は受注生産商品です】※※※※※")
  if (product.freeShipping)
    lines.push("※※※※※【この商品に送料はかかりません】※※※※※")
  if (lines.length) lines.push("")

  lines.push(description)
  lines.push("")
  lines.push("【商品情報】")
  lines.push(`カラー：${(product.colors ?? []).join("・")}`)
  lines.push(`デザイン：${designDesc}`)
  lines.push(`素材：${product.material ?? ""}`)

  if (product.processingType?.includes("刺繍"))
    lines.push("※デザインは刺繍加工です。")

  if (product.isMadeToOrder) {
    lines.push("")
    lines.push("【注意事項】")
    lines.push(
      "※受注生産商品になりますので、お届けまで約3週間程度いただいております。ご了承の上お買い求めください。"
    )
    lines.push("※生産状況によって早めにお届けになる場合もあります。")
    lines.push(
      "※ご注文商品の中で一番お時間のかかる商品に合わせて、発送スケジュールを組ませていただいております。"
    )
    lines.push(
      "※欠陥品を除いて返品、交換は受け付けておりませんのでご理解の程お願いいたします。"
    )
  }

  return lines.join("\n")
}
