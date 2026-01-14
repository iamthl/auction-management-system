"use client"

import { useEffect, useState } from "react"
import { api, type Auction, type Lot } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, MapPin, Clock, TrendingUp, Search, X, Gavel } from "lucide-react"
import Link from "next/link"

export default function AuctionsPage() {
  const [upcomingAuctions, setUpcomingAuctions] = useState<Auction[]>([])
  const [completedAuctions, setCompletedAuctions] = useState<Auction[]>([])
  
  const [filteredUpcoming, setFilteredUpcoming] = useState<Auction[]>([])
  const [filteredCompleted, setFilteredCompleted] = useState<Auction[]>([])
  
  const [auctionResults, setAuctionResults] = useState<{ [key: number]: Lot[] }>({})

  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    loadAuctions()
  }, [])

  const loadAuctions = async () => {
    const upcoming = await api.getAuctions({ status: "Upcoming" })
    const completed = await api.getAuctions({ status: "Completed" })

    setUpcomingAuctions(upcoming)
    setCompletedAuctions(completed)
    
    setFilteredUpcoming(upcoming)
    setFilteredCompleted(completed)

    const resultsMap: { [key: number]: Lot[] } = {}
    for (const auction of completed) {
      const lots = await api.getLots({ auction_id: auction.id })
      resultsMap[auction.id] = lots.filter((l) => l.status === "Sold" || l.status === "Unsold")
    }
    setAuctionResults(resultsMap)
  }

  useEffect(() => {
    const applyFilters = (list: Auction[]) => {
        let result = list
        
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase()
            result = result.filter(a => 
                a.title.toLowerCase().includes(lowerQ) || 
                (a.theme && a.theme.toLowerCase().includes(lowerQ))
            )
        }
        
        if (locationFilter !== "all") {
            result = result.filter(a => a.location === locationFilter)
        }

        if (typeFilter !== "all") {
          result = result.filter(a => a.auction_type === typeFilter)
        }

        if (dateFrom) {
            result = result.filter(a => new Date(a.auction_date) >= new Date(dateFrom))
        }
        if (dateTo) {
            result = result.filter(a => new Date(a.auction_date) <= new Date(dateTo))
        }

        return result
    }

    setFilteredUpcoming(applyFilters(upcomingAuctions))
    setFilteredCompleted(applyFilters(completedAuctions))

  }, [searchQuery, locationFilter, typeFilter, dateFrom, dateTo, upcomingAuctions, completedAuctions])

  const calculateAuctionStats = (auctionId: number) => {
    const lots = auctionResults[auctionId] || []
    const sold = lots.filter((l) => l.status === "Sold")
    const totalHammer = sold.reduce((sum, lot) => sum + (lot.sold_price || 0), 0)
    const sellThrough = lots.length > 0 ? (sold.length / lots.length) * 100 : 0

    return { totalLots: lots.length, soldLots: sold.length, totalHammer, sellThrough }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setLocationFilter("all")
    setDateFrom("")
    setDateTo("")
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
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upcoming" className="text-muted-foreground">Upcoming Auctions</TabsTrigger>
            <TabsTrigger value="results" className="text-muted-foreground">Past Results</TabsTrigger>
          </TabsList>

        <div className="flex flex-col lg:flex-row items-end gap-8 mb-8 ">
            <div className="relative w-full lg:w-[780px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by title or theme" 
                    className="pl-9 bg-background" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                />
            </div>
            
            <div className="w-full lg:w-[180px]">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="bg-background">
                        <div className="flex items-center text-muted-foreground truncate">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{locationFilter === 'all' ? 'All Locations' : locationFilter}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="London">London</SelectItem>
                        <SelectItem value="Paris">Paris</SelectItem>
                        <SelectItem value="New York">New York</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full lg:w-[180px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-background">
                        <div className="flex items-center text-muted-foreground truncate">
                            <Gavel className="h-4 w-4 mr-2" />
                            <span>{typeFilter === 'all' ? 'All Types' : typeFilter}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Physical">Physical</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full lg:w-[230px]">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-background px-3">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className={`truncate ${!dateFrom ? "text-muted-foreground" : "text-foreground"}`}>
                                {dateFrom ? (dateTo ? `${dateFrom} - ${dateTo}` : `${dateFrom}...`) : "Date Range"}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4 space-y-4" align="end">
                        <div className="space-y-2">
                            <Label>From</Label>
                            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs h-8"
                            onClick={() => { setDateFrom(""); setDateTo(""); }}
                        >
                            Reset Dates
                        </Button>
                    </PopoverContent>
                 </Popover>
            </div>

            {(searchQuery || locationFilter !== "all" || dateFrom || dateTo) && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>

          <TabsContent value="upcoming">
            {filteredUpcoming.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                    No upcoming auctions found matching your criteria.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredUpcoming.map((auction) => (
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
            )}
          </TabsContent>

          <TabsContent value="results">
            {filteredCompleted.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                    No past results found matching your criteria.
                </div>
            ) : (
                <div className="space-y-8">
                {filteredCompleted.map((auction) => {
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
           )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}