import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import "./globals.css"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/route"

export const metadata: Metadata = {
  title: "LumaTab - Live Wallpaper Extension",
  description: "Beautiful live wallpapers for your browser with marketplace functionality",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <Providers session={session}>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
