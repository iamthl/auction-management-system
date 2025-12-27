import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/images/fotherbys-logo.png" alt="Fotherby's" className="h-10" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/catalogue" className="text-sm text-foreground hover:text-secondary transition-colors">
              Catalogue
            </Link>
            <Link href="/auctions" className="text-sm text-foreground hover:text-secondary transition-colors">
              Auctions
            </Link>
            <Link href="/about" className="text-sm text-foreground hover:text-secondary transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm text-foreground hover:text-secondary transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/client">Client Portal</Link>
            </Button>
            <Button asChild>
              <Link href="/admin">Staff Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
