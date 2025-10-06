import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Toaster } from "react-hot-toast"
import "./globals.css"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { FloatingActionButton } from "@/components/ui/floating-action-button"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <AnimatedBackground />
        <div className="relative z-10">{children}</div>
        <FloatingActionButton />
        <Toaster />
      </body>
    </html>
  )
}
