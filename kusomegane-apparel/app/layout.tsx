import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/Sidebar"
import { TopBar } from "@/components/TopBar"

export const metadata: Metadata = {
  title: "KUSOMEGANE 商品管理",
  description: "KUSOMEGANE アパレル商品の発売フローを管理する社内ツール",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 mx-auto w-full max-w-[1440px] px-8 py-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
