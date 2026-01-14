"use client"

import { useEffect, useState, useCallback } from "react"
import { api, type Lot, type Auction } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import { Search, Calendar, MapPin, Tag, Filter, Gavel, Palette, X } from "lucide-react"

export default function CataloguePage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([]) 
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [auctionIdFilter, setAuctionIdFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
    const [priceRange, setPriceRange] = useState([0, 1000000]) 
  const [maxPriceLimit, setMaxPriceLimit] = useState(1000000)
  
  const [loading, setLoading] = useState(true)

  const subjects = [
    "Abstract", "Landscape", "Portrait", "Still Life", "Nude", 
    "Animal", "Figure", "Seascape"
  ]

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setLocationFilter("all")
    setCategoryFilter("all")
    setAuctionIdFilter("all")
    setSubjectFilter("all")
    setPriceRange([0, maxPriceLimit])
  }

  useEffect(() => {
    const initData = async () => {
        try {
            const [cats, aucs, allLots] = await Promise.all([
                api.getCategories(),
                api.getAuctions({ status: "Upcoming" }),
                api.searchCatalogue({})
            ])
            setCategories(cats)
            setAuctions(aucs)

            if (allLots.length > 0) {
              const highest = Math.max(...allLots.map(l => l.estimate_low))
              const ceiling = Math.ceil(highest / 10000) * 10000 // Round up to nearest 10k
              setMaxPriceLimit(ceiling)
              setPriceRange([0, ceiling])
            }
        } catch (e) {
            console.error("Failed to load initial data", e)
        }
    }
    initData()
  }, [])

  const loadCatalogue = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      
      if (searchQuery) params.q = searchQuery
      if (locationFilter !== "all") params.location = locationFilter
      if (categoryFilter !== "all") params.category = categoryFilter
      
      if (auctionIdFilter !== "all") params.auction_id = auctionIdFilter
      if (subjectFilter !== "all") params.subject = subjectFilter
      
      params.min_estimate = priceRange[0]
      params.max_estimate = priceRange[1]

      const data = await api.searchCatalogue(params)
      setLots(data)
    } catch (error) {
      console.error("Failed to load catalogue:", error)
    } finally {
      setLoading(false)
    }
  }, [
    searchQuery, locationFilter, categoryFilter, 
    auctionIdFilter, subjectFilter, priceRange
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
        loadCatalogue()
    }, 500) 
    return () => clearTimeout(timer)
  }, [loadCatalogue])

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">Auction Catalogue</h1>
          <p className="text-lg text-muted-foreground">Browse our curated collection of fine art and luxury items</p>
        </div>

        <div className="mb-4 space-y-4">
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

          <div className="flex flex-col lg:flex-row gap-4 items-end ">
            
            <div className="flex-1 w-full">
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
            </div>

            <div className="flex-1 w-full">
                <Select value={auctionIdFilter} onValueChange={setAuctionIdFilter}>
                <SelectTrigger>
                    <Gavel className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select Auction" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Auctions</SelectItem>
                    {auctions.map((auc) => (
                        <SelectItem key={auc.id} value={String(auc.id)}>
                            {auc.title}
                        </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className="flex-1 w-full">
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

            <div className="flex-1 w-full">
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                    <Palette className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((s) => (
                    <SelectItem key={s} value={s}>
                        {s}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className=" w-full md:w-[270px] space-y-3">
                 <Slider 
                    value={priceRange} 
                    max={maxPriceLimit} 
                    step={1000} 
                    onValueChange={setPriceRange} 
                    className="py-2"
                 />
                  <div className="flex justify-between text-xs text-muted-foreground">
                     <span>Price Range</span>
                     <span>{formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}</span>
                 </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearFilters}
                className="shrink-0"
                title="Clear Filters"
            >
                <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 text-sm text-muted-foreground mt-4">
            <span>
              Found {lots.length} item{lots.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading catalogue...</div>
        ) : lots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No items found matching your criteria</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => (
              <Link key={lot.id} href={`/catalogue/${lot.id}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {lot.images?.[0] ? (
                      <img
                        src={lot.images[0].thumbnail_url || lot.images[0].image_url}
                        alt={lot.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">{lot.lot_reference}</p>
                        <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {lot.category}
                            </Badge>
                            {lot.subject && lot.subject !== "" && (
                                <Badge variant="outline" className="text-xs bg-background/50 border-foreground/20">
                                    {lot.subject}
                                </Badge>
                            )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg text-foreground truncate">{lot.artist}</h3>
                      <p className="text-sm italic text-muted-foreground truncate">{lot.title}</p>
                      
                      <div className="pt-3 border-t border-border space-y-1 mt-auto">
                        {lot.auction_date && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(lot.auction_date).toLocaleDateString()}
                            </p>
                        )}
                        <p className="text-sm font-medium text-foreground mt-2">
                          Estimate: {formatCurrency(lot.estimate_low)} - {formatCurrency(lot.estimate_high)}
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