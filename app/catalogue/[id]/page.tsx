"use client"

import { useEffect, useState, useRef } from "react"
import { api, type Lot } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Ruler, Frame, ArrowLeft, Weight, Palette, Image as ImageIcon, Box, Gavel, User, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/app/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi 
} from "@/components/ui/carousel"
import { useParams, notFound } from "next/navigation"

export default function LotDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [lot, setLot] = useState<Lot | null>(null)
  const [loading, setLoading] = useState(true)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  
  // Bidding states
  const [bidAmount, setBidAmount] = useState("")
  const [highestBid, setHighestBid] = useState<number>(0)
  const [userHighestBid, setUserHighestBid] = useState<number | null>(null)
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [isOutbid, setIsOutbid] = useState(false)
  
  const lastBidderId = useRef<number | null>(null)

  useEffect(() => {
    if (params.id) {
      loadLotData()
      // Poll for new bids every 5 seconds
      const interval = setInterval(pollBids, 5000)
      return () => clearInterval(interval)
    }
  }, [params.id, user])

  const loadLotData = () => {
    api.getLot(Number(params.id))
       .then((data) => {
           setLot(data)
           pollBids()
           setLoading(false)
       })
       .catch(() => setLoading(false))
  }

  const pollBids = () => {
    if (!params.id) return
    
    api.getLotBids(Number(params.id)).then(bids => {
      if (bids.length > 0) {
        const currentMax = Math.max(...bids.map((b: any) => b.bid_amount))
        const latestBid = bids.reduce((prev: any, curr: any) => (prev.bid_amount > curr.bid_amount) ? prev : curr)
        
        // Track current user's personal highest bid
        if (user) {
          const userBids = bids.filter((b: any) => b.client_id === user.id)
          if (userBids.length > 0) {
            setUserHighestBid(Math.max(...userBids.map((b: any) => b.bid_amount)))
          }
        }

        // Logic: Outbid alert if highest increased and it's not the current user
        if (currentMax > highestBid && user && latestBid.client_id !== user.id && highestBid !== 0) {
            setIsOutbid(true)
        } else if (latestBid.client_id === user?.id) {
            setIsOutbid(false)
        }

        setHighestBid(currentMax)
        lastBidderId.current = latestBid.client_id
      }
    }).catch(() => {})
  }

  const handlePlaceBid = async () => {
    const amount = Number(bidAmount)
    if (!amount || amount <= highestBid) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Bid", 
        description: `Bid must be higher than £${highestBid.toLocaleString()}` 
      })
      return
    }

    setIsPlacingBid(true)
    try {
      await api.placeBid(lot!.id, amount)
      toast({ title: "Success", description: "Your bid has been placed." })
      setBidAmount("")
      setIsOutbid(false)
      pollBids() 
    } catch (error: any) {
      toast({ variant: "destructive", title: "Bid Failed", description: error.message })
    } finally {
      setIsPlacingBid(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  if (!lot || lot.status === "Archived") {
    notFound()
    return null
  }

  const mediaItems = lot.images?.length
    ? lot.images
    : [{ image_url: `/placeholder.svg?height=800&width=800&query=fine+art+${lot.artist}`, is_primary: true, media_type: 'image' }]

  const isSold = lot.status === "Sold"
  const isUnsold = lot.status === "Unsold"

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
          <div className="space-y-4">
             <Carousel setApi={setCarouselApi} className="w-full max-w-xl mx-auto">
                <CarouselContent>
                    {mediaItems.map((item, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                                <div className="aspect-square bg-muted rounded-sm overflow-hidden flex items-center justify-center">
                                    {item.media_type === 'video' || (typeof item.image_url === 'string' && item.image_url.endsWith('.mp4')) ? (
                                        <video src={item.image_url} controls className="w-full h-full object-contain" />
                                    ) : (
                                        <img src={item.image_url} alt={lot.title} className="w-full h-full object-contain" />
                                    )}
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {mediaItems.length > 1 && <CarouselPrevious className="left-2" />}
                {mediaItems.length > 1 && <CarouselNext className="right-2" />}
             </Carousel>
             
             {mediaItems.length > 1 && (
                 <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                     {mediaItems.map((item, idx) => (
                         <button 
                            key={idx} 
                            onClick={() => carouselApi?.scrollTo(idx)}
                            className="h-16 w-16 flex-shrink-0 rounded overflow-hidden border hover:border-primary transition-colors"
                         >
                             {item.media_type === 'video' || (typeof item.image_url === 'string' && item.image_url.endsWith('.mp4')) ? (
                                 <div className="w-full h-full bg-black flex items-center justify-center text-white text-[10px]">Video</div>
                             ) : (
                                 <img src={item.thumbnail_url || item.image_url} className="w-full h-full object-cover" alt="" />
                             )}
                         </button>
                     ))}
                 </div>
             )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{lot.lot_reference}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">{lot.artist}</h1>
              <p className="text-xl italic text-muted-foreground mb-4">{lot.title}</p>
              {lot.year_of_production && <p className="text-lg text-muted-foreground">{lot.year_of_production}</p>}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{lot.triage_status}</Badge>
              <Badge variant="secondary">{lot.category}</Badge>
              {lot.subject && <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">{lot.subject}</Badge>}
            </div>

            <div className="spazce-y-3 py-6 border-y border-border">
              {(lot.height || lot.width || lot.depth) && (
                <div className="flex items-start gap-3">
                  <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dimensions</p>
                    <p className="text-sm text-muted-foreground">
                        {lot.height ? `${lot.height}cm (H)` : ''} 
                        {lot.width ? ` x ${lot.width}cm (L)` : ''} 
                        {lot.depth ? ` x ${lot.depth}cm (W)` : ''}
                    </p>
                  </div>
                </div>
              )}

              {lot.medium && (
                <div className="flex items-start gap-3">
                  {lot.category === 'Photography' ? <ImageIcon className="h-5 w-5 mt-0.5" /> : <Palette className="h-5 w-5 mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {lot.category === 'Photography' ? "Image Type" : "Medium"}
                    </p>
                    <p className="text-sm text-muted-foreground">{lot.medium}</p>
                  </div>
                </div>
              )}

              {lot.material && (
                <div className="flex items-start gap-3">
                  <Box className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Material</p>
                    <p className="text-sm text-muted-foreground">{lot.material}</p>
                  </div>
                </div>
              )}

              {lot.weight && (
                <div className="flex items-start gap-3">
                  <Weight className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Weight</p>
                    <p className="text-sm text-muted-foreground">{lot.weight} kg</p>
                  </div>
                </div>
              )}

              {(lot.is_framed !== undefined && lot.is_framed !== null) && ["Painting", "Drawing"].includes(lot.category) && (
                <div className="flex items-start gap-3">
                  <Frame className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Framing</p>
                    <p className="text-sm text-muted-foreground">{lot.is_framed ? "Framed" : "Unframed"}</p>
                  </div>
                </div>
              )}
            </div>

            {lot.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{lot.description}</p>
              </div>
            )}

            <div className="bg-white border rounded-sm p-6">
              {isSold ? (
                  <div className="space-y-1">
                      <p className="text-sm text-muted-foreground mb-1">Hammer Price</p>
                      <p className="text-2xl font-serif font-bold text-foreground">
                          £{lot.sold_price?.toLocaleString()}
                      </p>
                      <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Estimate:</span>
                          <span className="text-sm font-medium text-muted-foreground">
                              £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
                          </span>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimate</p>
                      <p className="text-2xl font-serif font-bold text-foreground">
                        £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
                      </p>
                    </div>
                    {highestBid > 0 && (
                      <div className="pt-3 border-t flex items-center justify-between text-foreground">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Gavel className="h-4 w-4" /> Current Highest Bid:
                        </span>
                        <span className="text-lg font-bold">£{highestBid.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
              )}
            </div>

            {lot.auction_title && (
              <div className="space-y-3 p-6 bg-muted/50 rounded-sm">
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

            {/* USER'S PERSONAL BID STATUS */}
            {user && userHighestBid && (
              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-sm">
                <span className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" /> Your Highest Bid:
                </span>
                <span className="text-lg font-semibold text-foreground">£{userHighestBid.toLocaleString()}</span>
              </div>
            )}

            {/* OUTBID NOTIFICATION */}
            {isOutbid && user && (
              <Alert variant="destructive" className="animate-pulse border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>You've been outbid!</AlertTitle>
                <AlertDescription>
                  The highest bid is now £{highestBid.toLocaleString()}. Increase your bid to win this lot.
                </AlertDescription>
              </Alert>
            )}

            {/* BIDDING INPUT */}
            {!isSold && !isUnsold && (
              <div className="space-y-4">
                {user ? (
                  <div className="flex flex-col gap-3 p-4 border rounded-sm bg-background shadow-sm">
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder={`Min bid £${(highestBid || lot.estimate_low).toLocaleString()}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handlePlaceBid} disabled={isPlacingBid || !bidAmount}>
                        {isPlacingBid ? "Placing..." : "Place Bid"}
                      </Button>
                    </div>
                    {lastBidderId.current === user.id && !isOutbid && (
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 justify-center py-2 rounded">
                            ✓ You are currently the highest bidder
                        </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3 pt-4">
                    <Button size="lg" className="flex-1" asChild>
                      <Link href="/login">Register to Bid</Link>
                    </Button>
                    <Button size="lg" variant="outline" className="flex-1 bg-transparent">
                      Enquire
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}