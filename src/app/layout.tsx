import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import Migration from "@/components/Migration"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Side by Side",
  description: "A collection of useful links and resources",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <AuthProvider>
          <Migration />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
