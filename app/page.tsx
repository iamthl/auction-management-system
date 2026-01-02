import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/public-header"
import { Calendar, MapPin, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
        <div className="absolute inset-0 bg-[url('/luxury-art-gallery.png')] bg-cover bg-center opacity-10" />
        <div className="relative text-center space-y-6 px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground tracking-tight text-balance">
            {"Fine Art & Luxury Auctions"}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Connecting collectors with exceptional works since 1961
          </p>
          <div className="flex gap-4 justify-center pt-4 text-muted-foreground">
            <Button size="lg" asChild>
              <Link href="/catalogue">
                View Catalogue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auctions">Upcoming Auctions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">Our Locations</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { city: "London", address: "Bond Street, Mayfair", image: "historic+london+building" },
              { city: "Paris", address: "8th Arrondissement", image: "parisian+architecture" },
              { city: "New York", address: "Upper East Side", image: "manhattan+gallery" },
            ].map((location) => (
              <div
                key={location.city}
                className="group relative overflow-hidden rounded-sm bg-card border border-border hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <img
                    src={`/.jpg?height=400&width=600&query=${location.image}`}
                    alt={location.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-serif font-bold mb-2 text-foreground">{location.city}</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {location.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Coming Soon
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground text-balance">
             Online Bidding
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Join our auctions from anywhere in the world. Real-time bidding platform launching this spring.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/images/fotherbys-logo.png" alt="Fotherby's" className="h-10 mb-4" />
              <p className="text-sm text-muted-foreground">Established 1961</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/catalogue" className="hover:text-foreground transition-colors">
                    Catalogue
                  </Link>
                </li>
                <li>
                  <Link href="/auctions" className="hover:text-foreground transition-colors">
                    Auctions
                  </Link>
                </li>
                <li>
                  <Link href="/sell" className="hover:text-foreground transition-colors">
                    Sell with Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 Fotherby&apos;s Auction Houses. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
