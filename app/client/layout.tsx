import type React from "react"
import { Playfair_Display, Inter } from "next/font/google"
import Link from "next/link"
import { Home, Tag, Gavel, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"

const playfair = Playfair_Display({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen bg-background ${inter.className}`}>
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            <div className="flex items-center gap-8">
              <Link href="/client" className="flex items-center gap-3">
                <img src="/images/fotherbys-logo.png" alt="Fotherby's" className="h-8" />
                <span className={`text-xl font-semibold ${playfair.className}`}>Client Portal</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/client"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/client/sell"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Tag className="h-4 w-4" />
                  Sell Item
                </Link>
                <Link
                  href="/catalogue"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Gavel className="h-4 w-4" />
                  Browse Catalogue
                </Link>
              </div>
            </div>

            {/* Right Side: User Actions */}
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Public Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}