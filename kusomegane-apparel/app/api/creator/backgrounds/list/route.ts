import { NextResponse } from "next/server"
import { listBackgrounds } from "@/lib/supabase/creatorBackgrounds"

export async function GET(): Promise<Response> {
  try {
    const backgrounds = await listBackgrounds()
    return NextResponse.json({ backgrounds })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
