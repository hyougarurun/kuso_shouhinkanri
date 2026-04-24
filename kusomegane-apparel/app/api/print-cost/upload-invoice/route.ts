import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseInvoicePdf } from "@/lib/print-cost/parser/parseInvoicePdf"

export const runtime = "nodejs"
export const maxDuration = 120

const RAW_DIR = resolve(
  process.cwd(),
  "..",
  "print-cost-estimator",
  "data",
  "raw"
)
const PARSED_DIR = resolve(
  process.cwd(),
  "..",
  "print-cost-estimator",
  "data",
  "parsed"
)

function safeFilename(name: string): string {
  // 拡張子保持、ディレクトリトラバーサル防止
  const base = name.replace(/[/\\]/g, "_").replace(/^\.+/, "")
  return base.length > 0 ? base : `invoice-${Date.now()}.pdf`
}

export async function POST(req: Request): Promise<Response> {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json(
      { error: "multipart/form-data で送信してください" },
      { status: 400 }
    )
  }
  const file = form.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "PDF ファイルを 'file' フィールドで送信してください" },
      { status: 400 }
    )
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: `PDF のみ対応しています (受信: ${file.type || "不明"})` },
      { status: 400 }
    )
  }

  const filename = safeFilename(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await mkdir(RAW_DIR, { recursive: true })
    await mkdir(PARSED_DIR, { recursive: true })
    await writeFile(resolve(RAW_DIR, filename), buffer)
  } catch (e) {
    return NextResponse.json(
      {
        error: `PDF 保存に失敗: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    )
  }

  let invoice
  try {
    invoice = await parseInvoicePdf({ buffer, filename })
  } catch (e) {
    return NextResponse.json(
      {
        error: `解析失敗: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    )
  }

  try {
    const jsonPath = resolve(PARSED_DIR, `${filename}.json`)
    await writeFile(jsonPath, JSON.stringify(invoice, null, 2), "utf-8")
    return NextResponse.json({
      ok: true,
      invoice,
      lineItemCount: invoice.lineItems.length,
      savedTo: jsonPath,
    })
  } catch (e) {
    return NextResponse.json(
      {
        error: `JSON 保存失敗: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    )
  }
}
