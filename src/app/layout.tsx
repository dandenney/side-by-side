import type { Metadata, Viewport } from "next"
import { Inter, Bricolage_Grotesque } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import Migration from "@/components/Migration"
import { PageErrorBoundary } from "@/components/ErrorBoundaries"
import TabBar from "@/components/TabBar"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "Side by Side",
  description: "Our shared lists: groceries, recipes, places, and things worth sharing",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className="overscroll-none" lang="en">
      <body
        className={`${inter.variable} ${bricolage.variable} font-sans overscroll-none antialiased`}
        suppressHydrationWarning={true}
      >
        <PageErrorBoundary>
          <AuthProvider>
            <Migration />
            {children}
            <TabBar />
          </AuthProvider>
        </PageErrorBoundary>
      </body>
    </html>
  )
}
