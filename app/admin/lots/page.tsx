"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { api, type Auction, type Lot } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Upload, Lightbulb, Calendar, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LotsPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [assignAuctionId, setAssignAuctionId] = useState("")
  const [triageSuggestion, setTriageSuggestion] = useState<any>(null)
  const [commission, setCommission] = useState<any>(null)
  const [salePrice, setSalePrice] = useState("")
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    lot_number: "",
    artist: "",
    title: "",
    year: "",
    category: "Painting",
    subject: "Landscape",
    description: "",
    estimate_low: "",
    estimate_high: "",
    reserve_price: "",
    triage_status: "Physical" as "Physical" | "Online",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (formData.estimate_low && Number.parseFloat(formData.estimate_low) > 0) {
      api.getSuggestedTriage(Number.parseFloat(formData.estimate_low)).then(setTriageSuggestion)
    }
  }, [formData.estimate_low])

  useEffect(() => {
    if (salePrice && Number.parseFloat(salePrice) > 0) {
      api.calculateCommission(Number.parseFloat(salePrice)).then(setCommission)
    }
  }, [salePrice])

  const loadData = () => {
    Promise.all([api.getLots(), api.getAuctions()]).then(([lotsData, auctionsData]) => {
      setLots(lotsData)
      setAuctions(auctionsData)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newLot = await api.createLot({
        ...formData,
        estimate_low: Number.parseFloat(formData.estimate_low),
        estimate_high: Number.parseFloat(formData.estimate_high),
        reserve_price: Number.parseFloat(formData.reserve_price),
        year: formData.year ? Number.parseInt(formData.year) : undefined,
      } as any)

      // Upload images if provided
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          await api.uploadLotImage(newLot.id, imageFiles[i], i === 0)
        }
        toast({ title: "Lot created with images and thumbnails" })
      } else {
        toast({ title: "Lot created successfully" })
      }

      setShowForm(false)
      setFormData({
        lot_number: "",
        artist: "",
        title: "",
        year: "",
        category: "Painting",
        subject: "Landscape",
        description: "",
        estimate_low: "",
        estimate_high: "",
        reserve_price: "",
        triage_status: "Physical",
      })
      setImageFiles(null)
      loadData()
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to create lot" })
    }
  }

  const handleAssignAuction = async () => {
    if (selectedLot && assignAuctionId) {
      try {
        await api.assignLotToAuction(selectedLot.id, Number.parseInt(assignAuctionId))
        setSelectedLot(null)
        setAssignAuctionId("")
        loadData()
        toast({ title: "Lot assigned to auction" })
      } catch (error) {
        toast({ variant: "destructive", title: "Failed to assign lot" })
      }
    }
  }

  const handleImageUpload = async (lotId: number, files: FileList | null) => {
    if (!files) return
    try {
      for (let i = 0; i < files.length; i++) {
        await api.uploadLotImage(lotId, files[i], i === 0)
      }
      loadData()
      toast({ title: "Images uploaded with thumbnails generated" })
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to upload images" })
    }
  }

  const handleCompleteSale = async (lotId: number) => {
    if (!salePrice || Number.parseFloat(salePrice) <= 0) return
    try {
      await api.completeLotSale(lotId, Number.parseFloat(salePrice))
      setSalePrice("")
      setCommission(null)
      loadData()
      toast({ title: "Sale completed with commission calculated" })
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to complete sale" })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Lots Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage auction inventory</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Lot
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Lot</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lot Number (8 digits)</Label>
                  <Input
                    value={formData.lot_number}
                    onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                    placeholder="10000001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Artist</Label>
                  <Input
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    placeholder="David Hockney"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Painting">Painting</SelectItem>
                      <SelectItem value="Drawing">Drawing</SelectItem>
                      <SelectItem value="Sculpture">Sculpture</SelectItem>
                      <SelectItem value="Photography">Photography</SelectItem>
                      <SelectItem value="Carving">Carving</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Landscape">Landscape</SelectItem>
                      <SelectItem value="Seascape">Seascape</SelectItem>
                      <SelectItem value="Portrait">Portrait</SelectItem>
                      <SelectItem value="Figure">Figure</SelectItem>
                      <SelectItem value="Still Life">Still Life</SelectItem>
                      <SelectItem value="Nude">Nude</SelectItem>
                      <SelectItem value="Animal">Animal</SelectItem>
                      <SelectItem value="Abstract">Abstract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estimate Low (£)</Label>
                  <Input
                    type="number"
                    value={formData.estimate_low}
                    onChange={(e) => setFormData({ ...formData, estimate_low: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimate High (£)</Label>
                  <Input
                    type="number"
                    value={formData.estimate_high}
                    onChange={(e) => setFormData({ ...formData, estimate_high: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reserve Price (£)</Label>
                  <Input
                    type="number"
                    value={formData.reserve_price}
                    onChange={(e) => setFormData({ ...formData, reserve_price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Triage Status (Staff can override)</Label>
                  <Select
                    value={formData.triage_status}
                    onValueChange={(v) => setFormData({ ...formData, triage_status: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Physical">Physical (Premium)</SelectItem>
                      <SelectItem value="Online">Online (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                  {triageSuggestion && (
                    <Alert className="mt-2">
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Suggested: {triageSuggestion.suggested_triage}</strong>
                        <br />
                        <span className="text-xs">{triageSuggestion.reason}</span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Lot Images (Auto Thumbnail Generation)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload lot photos</p>
                      <p className="text-xs text-muted-foreground">
                        System will automatically create 300x300px thumbnails for list views
                      </p>
                    </div>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setImageFiles(e.target.files)}
                      className="max-w-xs mx-auto"
                    />
                    {imageFiles && imageFiles.length > 0 && (
                      <p className="text-sm text-green-600">
                        {imageFiles.length} image{imageFiles.length > 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Lot</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lots.map((lot) => (
          <Card key={lot.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{lot.artist}</CardTitle>
                  <p className="text-sm text-muted-foreground italic">{lot.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lot.lot_number}</p>
                </div>
                <Badge variant={lot.status === "Sold" ? "secondary" : "outline"}>{lot.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lot.images?.[0] && (
                  <div className="aspect-square bg-muted rounded overflow-hidden">
                    <img
                      src={lot.images[0].thumbnail_url || lot.images[0].image_url}
                      alt={lot.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimate:</span>
                    <span>
                      £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stream:</span>
                    <Badge variant="outline">{lot.triage_status}</Badge>
                  </div>
                  {lot.sold_price && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Sold:</span>
                      <span>£{lot.sold_price.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {lot.status === "Pending" && (
                  <div className="space-y-2">
                    <Label className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 p-2 border border-dashed rounded hover:bg-muted">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Upload Images (Auto Thumbnail)</span>
                      </div>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(lot.id, e.target.files)}
                      />
                    </Label>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full" onClick={() => setSelectedLot(lot)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Assign to Auction
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Lot to Auction</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select value={assignAuctionId} onValueChange={setAssignAuctionId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select auction..." />
                            </SelectTrigger>
                            <SelectContent>
                              {auctions
                                .filter((a) => a.status === "Upcoming")
                                .map((auction) => (
                                  <SelectItem key={auction.id} value={String(auction.id)}>
                                    {auction.title} - {new Date(auction.date).toLocaleDateString()} (
                                    {auction.auction_type})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={handleAssignAuction} className="w-full">
                            Assign Lot
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {lot.status === "Listed" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary" className="w-full">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Complete Sale
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Complete Sale (Auto Commission Calc)</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Hammer Price (£)</Label>
                          <Input
                            type="number"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                            placeholder="Enter final bid"
                          />
                        </div>

                        {commission && (
                          <Alert>
                            <AlertDescription className="space-y-1 text-sm">
                              <div className="flex justify-between font-medium">
                                <span>Hammer Price:</span>
                                <span>£{commission.hammer_price.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Buyer Premium (10%):</span>
                                <span>£{commission.buyers_premium.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span>Total Buyer Pays:</span>
                                <span>£{commission.total_buyer_pays.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span>Seller Receives:</span>
                                <span>£{commission.total_seller_receives.toLocaleString()}</span>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        <Button onClick={() => handleCompleteSale(lot.id)} className="w-full" disabled={!salePrice}>
                          Complete Sale
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
