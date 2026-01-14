"use client"

import { useEffect, useState } from "react"
import { api, type Auction, type Lot } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Clock, TrendingUp, ArrowRight } from "lucide-react"
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

        <Tabs defaultValue="upcoming" className="w-full ">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming" className="text-muted-foreground">Upcoming Auctions</TabsTrigger>
            <TabsTrigger value="results" className="text-muted-foreground">Past Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAuctions.map((auction) => (
                <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{auction.auction_type}</Badge>
                      <Badge>Upcoming</Badge>
                    </div>
                    <CardTitle className="text-xl text-foreground">{auction.title}</CardTitle>
                    {auction.theme && <p className="text-sm text-muted-foreground mt-2">{auction.theme}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(auction.auction_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {auction.start_time}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {auction.location}
                    </div>
                    <Link href={`/auctions/${auction.id}`}>
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

                return (
                  <Card key={auction.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl text-foreground">{auction.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">{auction.theme}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(auction.auction_date).toLocaleDateString()} 
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {auction.location}
                            </span>
                            <Badge variant="outline">{auction.auction_type}</Badge>
                          </div>
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/40 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Lots</p>
                          <p className="text-2xl font-semibold text-foreground">{stats.totalLots}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sold</p>
                          <p className="text-2xl font-semibold text-foreground">{stats.soldLots}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sell-Through Rate</p>
                          <p className="text-2xl font-semibold flex items-center gap-1 text-foreground">
                            <TrendingUp className="h-5 w-5" />
                            {stats.sellThrough.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Hammer</p>
                          <p className="text-2xl font-semibold text-foreground">£{stats.totalHammer.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link href={`/auctions/${auction.id}`}>
                            <Button className="w-full sm:w-auto bg-transparant" variant="outline">
                                View Results 
                            </Button>
                        </Link>
                      </div>
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