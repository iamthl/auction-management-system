"use client"

import { useEffect, useState } from "react"
import { api, type Auction, type Lot } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function AuctionsPage() {
  const [upcomingAuctions, setUpcomingAuctions] = useState<Auction[]>([])
  const [completedAuctions, setCompletedAuctions] = useState<Auction[]>([])
  const [auctionResults, setAuctionResults] = useState<{ [key: number]: Lot[] }>({})

  useEffect(() => {
    loadAuctions()
  }, [])

  const loadAuctions = async () => {
    const upcoming = await api.getAuctions({ status: "Upcoming" })
    const completed = await api.getAuctions({ status: "Completed" })

    setUpcomingAuctions(upcoming)
    setCompletedAuctions(completed)

    const resultsMap: { [key: number]: Lot[] } = {}
    for (const auction of completed) {
      const lots = await api.getLots({ auction_id: auction.id })
      resultsMap[auction.id] = lots.filter((l) => l.status === "Sold" || l.status === "Unsold")
    }
    setAuctionResults(resultsMap)
  }

  const calculateAuctionStats = (auctionId: number) => {
    const lots = auctionResults[auctionId] || []
    const sold = lots.filter((l) => l.status === "Sold")
    const totalHammer = sold.reduce((sum, lot) => sum + (lot.sold_price || 0), 0)
    const sellThrough = lots.length > 0 ? (sold.length / lots.length) * 100 : 0

    return { totalLots: lots.length, soldLots: sold.length, totalHammer, sellThrough }
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Auction Events</h1>
          <p className="text-lg text-muted-foreground">View upcoming auctions and past results</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Auctions</TabsTrigger>
            <TabsTrigger value="results">Past Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAuctions.map((auction) => (
                <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge>{auction.auction_type}</Badge>
                      <Badge variant="outline">Upcoming</Badge>
                    </div>
                    <CardTitle className="text-xl font-serif">{auction.title}</CardTitle>
                    {auction.theme && <p className="text-sm text-muted-foreground mt-2">{auction.theme}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(auction.date).toLocaleDateString("en-GB", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {auction.start_time}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {auction.location}
                    </div>
                    <Link href={`/catalogue?auction_id=${auction.id}`}>
                      <Button variant="outline" className="w-full mt-4 bg-transparent">
                        View Catalogue
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-8">
            <div className="space-y-8">
              {completedAuctions.map((auction) => {
                const stats = calculateAuctionStats(auction.id)
                const lots = auctionResults[auction.id] || []

                return (
                  <Card key={auction.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl font-serif">{auction.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">{auction.theme}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(auction.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {auction.location}
                            </span>
                            <Badge variant="outline">{auction.auction_type}</Badge>
                          </div>
                        </div>
                        <Badge variant="secondary">Concluded</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Lots</p>
                          <p className="text-2xl font-semibold">{stats.totalLots}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sold</p>
                          <p className="text-2xl font-semibold text-green-600">{stats.soldLots}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sell-Through Rate</p>
                          <p className="text-2xl font-semibold flex items-center gap-1">
                            <TrendingUp className="h-5 w-5" />
                            {stats.sellThrough.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Hammer</p>
                          <p className="text-2xl font-semibold">£{stats.totalHammer.toLocaleString()}</p>
                        </div>
                      </div>

                      {lots.filter((l) => l.status === "Sold").length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Notable Sales</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {lots
                              .filter((l) => l.status === "Sold")
                              .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
                              .slice(0, 6)
                              .map((lot) => (
                                <div key={lot.id} className="p-4 border rounded-lg">
                                  <p className="font-semibold text-sm">{lot.artist}</p>
                                  <p className="text-sm text-muted-foreground italic">{lot.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{lot.lot_number}</p>
                                  <div className="mt-2 pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">Hammer Price</p>
                                    <p className="text-lg font-semibold text-green-600">
                                      £{lot.sold_price?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Est. £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
