"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

function breadcrumb(pathname: string): string {
  if (pathname === "/") return "ホーム"
  if (pathname === "/products/new") return "ホーム / 新規商品登録"
  if (pathname.startsWith("/products/")) return "ホーム / 商品詳細"
  if (pathname.startsWith("/schedule")) return "販売スケジュール"
  if (pathname.startsWith("/estimate")) return "加工費推定ツール"
  if (pathname.startsWith("/base-models")) return "base モデル画像"
  return pathname
}

export function TopBar() {
  const pathname = usePathname() ?? "/"
  const showRegister = pathname === "/"

  return (
    <header className="h-12 border-b border-zinc-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="text-sm text-zinc-600">{breadcrumb(pathname)}</div>
      {showRegister && (
        <Link
          href="/products/new"
          className="rounded-md bg-brand-yellow text-black text-xs font-bold px-3 py-1.5 hover:brightness-95 transition"
        >
          + 新規商品登録
        </Link>
      )}
    </header>
  )
}
