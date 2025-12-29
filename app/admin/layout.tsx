import type React from "react"
import { Playfair_Display, Inter } from "next/font/google"
import Link from "next/link"
import { Home, Package, Calendar, Users, Calculator } from "lucide-react"

const playfair = Playfair_Display({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-3">
                <img src="/images/fotherbys-logo.png" alt="Fotherby's" className="h-8" />
                <span className={`text-xl font-semibold ${playfair.className}`}>Admin Panel</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/auctions"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Auctions
                </Link>
                <Link
                  href="/admin/lots"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Package className="h-4 w-4" />
                  Lots
                </Link>
                <Link
                  href="/admin/clients"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Clients
                </Link>
                <Link
                  href="/admin/commission"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Calculator className="h-4 w-4" />
                  Commission
                </Link>
              </div>
            </div>

            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View Public Site
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
