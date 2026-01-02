"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api, type Auction, type Lot } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Clock, Printer, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AuctionDetailPage() {
  const params = useParams()
  const auctionId = Number(params.id)

  const [auction, setAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    if (auctionId) {
      loadData()
    }
  }, [auctionId])

  const loadData = async () => {
    try {
      const [auctionData, lotsData] = await Promise.all([
        api.getAuction(auctionId),
        api.getLots({ auction_id: auctionId }) 
      ])
      setAuction(auctionData)
      setLots(lotsData)
    } catch (error) {
      console.error("Failed to load auction data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCatalogue = async () => {
    if (!auction) return

    try {
      setGeneratingPdf(true)
      const blob = await api.generateAuctionPDF(auction.id)
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Fotherby_${auction.title.replace(/\s+/g, "_")}_Catalogue.pdf`
      
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      alert("Failed to generate catalogue. Please try again.")
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="text-center py-12">Auction not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-muted-foreground">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="mb-6 pl-0">
          <Link href="/auctions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Auctions
          </Link>
        </Button>

        {/* Auction Details Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge>{auction.auction_type}</Badge>
              <Badge variant="outline">{auction.status}</Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              {auction.title}
            </h1>
            
            {auction.theme && (
              <p className="text-xl text-muted-foreground">{auction.theme}</p>
            )}

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(auction.auction_date).toLocaleDateString("en-GB", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric"
                })}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {auction.location}
              </div>
            </div>
          </div>

          {/* Print Catalogue Button */}
          <Button 
            size="lg" 
            onClick={handleDownloadCatalogue} 
            disabled={generatingPdf}
            className="shrink-0"
          >
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            {generatingPdf ? "Generating PDF..." : "Print Catalogue"}
          </Button>
        </div>

        {/* Lots List (Filtered for this auction) */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-semibold">
            Lots in this Auction ({lots.length})
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => (
              <Link key={lot.id} href={`/catalogue/${lot.id}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {lot.images?.[0] ? (
                      <img
                        src={lot.images[0].thumbnail_url || lot.images[0].image_url}
                        alt={lot.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="backdrop-blur-md bg-background/80 text-foreground hover:bg-background/90">
                        Lot {lot.lot_reference}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-foreground truncate">{lot.artist}</h3>
                      <p className="text-sm italic text-muted-foreground truncate">{lot.title}</p>
                      <div className="pt-3 border-t mt-2">
                        <p className="text-sm font-medium">
                          £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}