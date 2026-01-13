"use client"

import { PublicHeader } from "@/components/public-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Globe, Gavel, Users } from "lucide-react"

export default function AboutPage() {
  const team = [
    { name: "Max Fotherby", role: "Fotherby's Owner & Writer", image: "/placeholder-user.jpg" }, 
    { name: "James Sterling", role: "Senior Specialist, Fine Art", image: "/placeholder-user.jpg" },
    { name: "Sarah Chen", role: "Head of Asian Art", image: "/placeholder-user.jpg" },
    { name: "Marcus Thorne", role: "Operations Director", image: "/placeholder-user.jpg" },
  ]

  const values = [
    { 
      icon: <ShieldCheck className="h-8 w-8 text-primary" />, 
      title: "Integrity & Trust", 
      desc: "We adhere to the highest standards of transparency and ethics in every transaction." 
    },
    { 
      icon: <Globe className="h-8 w-8 text-primary" />, 
      title: "Global Reach", 
      desc: "Connecting buyers and sellers from over 50 countries through our advanced digital platforms." 
    },
    { 
      icon: <Gavel className="h-8 w-8 text-primary" />, 
      title: "Expert Curation", 
      desc: "Every item is rigorously vetted and researched by our in-house specialists." 
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <div className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Badge variant="outline" className="mb-4">Since 1985</Badge>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
            Curating the Extraordinary
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fotherby has been at the forefront of the global art market for over four decades, 
            bridging the gap between historic tradition and modern innovation.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-24">
        
        {/* Our Story */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Founded in London by Eleanor Fotherby, our auction house began as a small gallery 
                specializing in 19th-century European paintings. Driven by a passion for discovery 
                and a commitment to scholarship, we quickly expanded into a full-service auction house.
              </p>
              <p>
                Today, Fotherby is recognized globally for its expertise in Fine Art, Antiques, 
                and Luxury Collectibles. We have embraced digital transformation, offering seamless 
                online bidding experiences while maintaining the theatre and excitement of the physical saleroom.
              </p>
            </div>
          </div>
          <div className="aspect-video bg-muted rounded-xl overflow-hidden relative shadow-xl">
             <div className="absolute inset-0 bg-[url('/auction-house.webp')] flex items-center justify-center bg-muted/50">
             </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div>
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Why Choose Fotherby</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((val, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-8 space-y-4">
                  <div className="flex justify-center mb-4">{val.icon}</div>
                  <h3 className="font-semibold text-xl">{val.title}</h3>
                  <p className="text-muted-foreground text-sm">{val.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Grid */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">Meet Our Specialists</h2>
            <p className="text-muted-foreground">The experts dedicated to bringing you the finest collections.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <div key={i} className="group text-center space-y-3">
                <div className="aspect-square rounded-full overflow-hidden mx-auto w-40 h-40 bg-muted relative mb-4 ring-4 ring-muted/20 group-hover:ring-primary/20 transition-all">
                   <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                      <Users className="h-10 w-10" />
                   </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-sm text-primary font-medium">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}