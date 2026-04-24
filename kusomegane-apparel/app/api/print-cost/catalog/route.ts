import { NextResponse } from "next/server"
import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { extractCatalog } from "@/lib/print-cost/extractCatalog"
import type { ParsedInvoice } from "@/lib/print-cost/types"

export const runtime = "nodejs"

const PARSED_DIR = resolve(
  process.cwd(),
  "..",
  "print-cost-estimator",
  "data",
  "parsed"
)

function loadAllInvoices(): ParsedInvoice[] {
  try {
    const files = readdirSync(PARSED_DIR).filter((f) => f.endsWith(".json"))
    return files.map(
      (f) =>
        JSON.parse(readFileSync(resolve(PARSED_DIR, f), "utf-8")) as ParsedInvoice
    )
  } catch {
    return []
  }
}

export async function GET(): Promise<Response> {
  const invoices = loadAllInvoices()
  const catalog = extractCatalog(invoices)
  return NextResponse.json({
    catalog,
    meta: { invoices: invoices.length },
  })
}
