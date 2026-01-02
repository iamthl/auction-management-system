"use client"

import Link from "next/link"
import { Search, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"

export function PublicHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between text-muted-foreground">
          <Link href="/" className="flex items-center">
            <img src="/images/fotherbys-logo.png" alt="Fotherby's" className="h-10" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/catalogue" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Catalogue
            </Link>
            <Link href="/auctions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Auctions
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                Hello, {user.name}
              </span>
              
              {user.is_staff ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">Admin Dashboard</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/client">My Account</Link>
                </Button>
              )}
              
              <Button variant="ghost" size="icon" onClick={logout} title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
        
        </div>
      </div>
    </header>
  )
}
