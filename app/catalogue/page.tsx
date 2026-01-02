"use client"

import { useEffect, useState } from "react"
import { api, type Lot } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Search, Calendar, MapPin, Tag } from "lucide-react"

export default function CataloguePage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [auctionTypeFilter, setAuctionTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    loadCatalogue()
  }, [searchQuery, locationFilter, auctionTypeFilter, categoryFilter])

  const loadCatalogue = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (searchQuery) params.q = searchQuery
      if (locationFilter !== "all") params.location = locationFilter
      if (auctionTypeFilter !== "all") params.auction_type = auctionTypeFilter
      if (categoryFilter !== "all") params.category = categoryFilter

      const data = await api.searchCatalogue(params)
      setLots(data)
    } catch (error) {
      console.error("Failed to load catalogue:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">Auction Catalogue</h1>
          <p className="text-lg text-muted-foreground">Browse our curated collection of fine art and luxury items</p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by artist, title, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="London">London</SelectItem>
                <SelectItem value="Paris">Paris</SelectItem>
                <SelectItem value="New York">New York</SelectItem>
              </SelectContent>
            </Select>

            <Select value={auctionTypeFilter} onValueChange={setAuctionTypeFilter}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Auction Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Physical">Physical Auctions</SelectItem>
                <SelectItem value="Online">Online Auctions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>
              Found {lots.length} item{lots.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Catalogue Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading catalogue...</div>
        ) : lots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No items found matching your criteria</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => (
              <Link key={lot.id} href={`/catalogue/${lot.id}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {lot.images?.[0] ? (
                      <img
                        src={lot.images[0].thumbnail_url || lot.images[0].image_url}
                        alt={lot.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={`/ceholder-svg-height-400.jpg?height=400&width=400`}
                          alt={lot.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge>{lot.triage_status}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{lot.lot_reference}</p>
                        <Badge variant="secondary" className="text-xs">
                          {lot.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">{lot.artist}</h3>
                      <p className="text-sm italic text-muted-foreground">{lot.title}</p>
                      {lot.year_of_production && (
                        <p className="text-sm text-muted-foreground">{lot.year_of_production}</p>
                      )}

                      {lot.auction_title && (
                        <div className="pt-3 border-t border-border space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(lot.auction_date!).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lot.location}
                          </p>
                        </div>
                      )}

                      <div className="pt-3">
                        <p className="text-sm font-medium text-foreground">
                          Estimate: £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
