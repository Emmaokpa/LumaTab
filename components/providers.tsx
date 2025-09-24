"use client"

import type React from "react"
import { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"

export function Providers({ children, session }: { children: React.ReactNode, session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
