import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BuTools - Bless Unleashed PC Helper",
  description: "Tools and calculators for Bless Unleashed PC",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-center" richColors closeButton theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  )
}
