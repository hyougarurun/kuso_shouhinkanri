"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/", label: "商品管理", match: (p: string) => p === "/" || p.startsWith("/products") },
  { href: "/schedule", label: "スケジュール", match: (p: string) => p.startsWith("/schedule") },
  { href: "/estimate", label: "加工費推定", match: (p: string) => p.startsWith("/estimate") },
  { href: "/base-models", label: "モデル画像", match: (p: string) => p.startsWith("/base-models") },
  { href: "/animator", label: "アニメーター", match: (p: string) => p.startsWith("/animator") },
  { href: "/creator/backgrounds", label: "背景生成", match: (p: string) => p.startsWith("/creator/backgrounds") },
]

export function Sidebar() {
  const pathname = usePathname() ?? ""

  return (
    <aside className="w-[220px] shrink-0 border-r border-zinc-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="h-12 border-b border-zinc-200 flex items-center px-4">
        <span className="font-bold text-sm tracking-[0.15em]">KUSOMEGANE</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "block px-3 py-2 rounded-md text-sm transition " +
                (active
                  ? "bg-brand-yellow text-black font-bold"
                  : "text-zinc-700 hover:bg-zinc-50")
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-zinc-200 text-[11px] text-zinc-400">
        v0.1 PoC
      </div>
    </aside>
  )
}
