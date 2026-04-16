import type { Metadata } from "next"
import "./globals.css"

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
      <body className="min-h-full">{children}</body>
    </html>
  )
}
