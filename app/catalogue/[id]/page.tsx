"use client"

import { useEffect, useState } from "react"
import { api, type Lot } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Ruler, Frame, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function LotDetailPage() {
  const params = useParams()
  const [lot, setLot] = useState<Lot | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (params.id) {
      api.getLot(Number(params.id)).then(setLot)
    }
  }, [params.id])

  if (!lot) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  const images = lot.images?.length
    ? lot.images
    : [{ image_url: `/placeholder.svg?height=800&width=800&query=fine+art+${lot.artist}`, is_primary: true }]

  return (
    <div className="min-h-screen bg-background ">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-muted-foreground">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/catalogue">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalogue
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-sm overflow-hidden">
              <img
                src={images[selectedImage].image_url || "/placeholder.svg"}
                alt={lot.title}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square bg-muted rounded-sm overflow-hidden border-2 ${
                      selectedImage === idx ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{lot.lot_reference}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">{lot.artist}</h1>
              <p className="text-xl italic text-muted-foreground mb-4">{lot.title}</p>
              {lot.year_of_production && <p className="text-lg text-muted-foreground">{lot.year_of_production}</p>}
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">{lot.triage_status}</Badge>
              {/* <Badge>{lot.status}</Badge> */}
            </div>

            {/* Specifications */}
            <div className="space-y-3 py-6 border-y border-border">
              {lot.dimensions && (
                <div className="flex items-start gap-3">
                  <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dimensions</p>
                    <p className="text-sm text-muted-foreground">{lot.dimensions}</p>
                  </div>
                </div>
              )}
              {lot.framing_details && (
                <div className="flex items-start gap-3">
                  <Frame className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Framing</p>
                    <p className="text-sm text-muted-foreground">{lot.framing_details}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {lot.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{lot.description}</p>
              </div>
            )}

            {/* Estimate */}
            <div className="bg-muted/50 rounded-sm p-6">
              <p className="text-sm text-muted-foreground mb-1">Estimate</p>
              <p className="text-2xl font-serif font-bold text-foreground">
                £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
              </p>
            </div>

            {/* Auction Details */}
            {lot.auction_title && (
              <div className="space-y-3 p-6 border border-border rounded-sm">
                <h3 className="font-semibold text-foreground">{lot.auction_title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(lot.auction_date!).toLocaleDateString("en-GB", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {lot.location} • {lot.start_time}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button size="lg" className="flex-1" disabled>
                Register to Bid
              </Button>
              <Button size="lg" variant="outline" className="flex-1 bg-transparent">
                Enquire
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Live bidding available soon. Contact us to register your interest.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
