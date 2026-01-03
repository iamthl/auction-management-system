"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { api, type Auction, type Lot } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert" 
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Plus, Calendar, Pencil, Trash2, Archive, RefreshCcw, X, Lightbulb } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LotsPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [viewMode, setViewMode] = useState<"active" | "archived">("active")
  const [showForm, setShowForm] = useState(false)
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  
  // Edit & Delete State
  const [editingLot, setEditingLot] = useState<Lot | null>(null)
  
  const [assignAuctionId, setAssignAuctionId] = useState("")
  const [triageSuggestion, setTriageSuggestion] = useState<any>(null)
  const [commission, setCommission] = useState<any>(null)
  const [salePrice, setSalePrice] = useState("")
  
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])

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
  }, [viewMode])

  useEffect(() => {
    const timer = setTimeout(() => {
        const val = parseFloat(formData.estimate_low)
        if (!isNaN(val) && val > 0) {
            api.getSuggestedTriage(val).then(setTriageSuggestion).catch(() => {})
        }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.estimate_low])

  useEffect(() => {
    const timer = setTimeout(() => {
        const val = parseFloat(salePrice)
        if (!isNaN(val) && val > 0) {
            api.calculateCommission(val).then(setCommission).catch(() => {})
        }
    }, 500)

    return () => clearTimeout(timer)
  }, [salePrice])

  const loadData = () => {
    Promise.all([
        api.getLots({ archived_only: viewMode === "archived" }), 
        api.getAuctions()
    ]).then(([lotsData, auctionsData]) => {
      setLots(lotsData)
      setAuctions(auctionsData)
    })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      
      setImageFiles(prev => [...prev, ...newFiles])
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file))
      setPreviewImages(prev => [...prev, ...newPreviews])
      
      e.target.value = ""
    }
  }

  const removePreviewImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index])
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newLot = await api.createLot({
        ...formData,
        lot_reference: formData.lot_number,
        estimate_low: Number.parseFloat(formData.estimate_low),
        estimate_high: Number.parseFloat(formData.estimate_high),
        reserve_price: Number.parseFloat(formData.reserve_price),
        year_of_production: formData.year ? Number.parseInt(formData.year) : undefined,
      } as any)

      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          await api.uploadLotImage(newLot.id, imageFiles[i], i === 0)
        }
      }
      
      toast({ title: "Lot created successfully" })
      setShowForm(false)
      resetForm()
      loadData()
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to create lot" })
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLot) return
    try {
        await api.updateLot(editingLot.id, {
            ...formData,
            lot_reference: formData.lot_number,
            estimate_low: Number.parseFloat(formData.estimate_low),
            estimate_high: Number.parseFloat(formData.estimate_high),
            reserve_price: Number.parseFloat(formData.reserve_price),
            year_of_production: formData.year ? Number.parseInt(formData.year) : undefined,
        } as any)
        
        if (imageFiles.length > 0) {
            for (let i = 0; i < imageFiles.length; i++) {
                await api.uploadLotImage(editingLot.id, imageFiles[i], false)
            }
        }
        
        setEditingLot(null)
        loadData()
        toast({ title: "Lot updated successfully" })
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to update lot" })
    }
  }

  const resetForm = () => {
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
      setImageFiles([])
      setPreviewImages([])
  }

  const startEditing = (lot: Lot) => {
      setEditingLot(lot)
      setFormData({
        lot_number: lot.lot_reference,
        artist: lot.artist,
        title: lot.title,
        year: lot.year_of_production?.toString() || "",
        category: lot.category,
        subject: "Landscape", 
        description: lot.description || "",
        estimate_low: lot.estimate_low.toString(),
        estimate_high: lot.estimate_high.toString(),
        reserve_price: lot.reserve_price.toString(),
        triage_status: lot.triage_status,
      })
      setImageFiles([])
      setPreviewImages([])
  }

  const handleDelete = async (id: number) => {
      try {
          await api.deleteLot(id)
          loadData()
          toast({ title: "Lot deleted" })
      } catch (error) {
          toast({ variant: "destructive", title: "Failed to delete lot" })
      }
  }
  
  const handleDeleteImage = async (imageId: number) => {
      try {
          await api.deleteLotImage(imageId)
          if (editingLot) {
              setEditingLot({
                  ...editingLot,
                  images: editingLot.images.filter(img => img.id !== imageId)
              })
          }
          loadData() 
          toast({ title: "Image deleted" })
      } catch (error) {
          toast({ variant: "destructive", title: "Failed to delete image" })
      }
  }

  const handleArchive = async (id: number) => {
      try {
          await api.archiveLot(id)
          loadData()
          toast({ title: "Lot archived" })
      } catch (error) {
          toast({ variant: "destructive", title: "Failed to archive lot" })
      }
  }

  const handleRestore = async (id: number) => {
    try {
        await api.unarchiveLot(id)
        loadData()
        toast({ title: "Lot restored", description: "Lot moved back to pending list." })
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to restore lot" })
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

  const handleCompleteSale = async (lotId: number) => {
    if (!salePrice || Number.parseFloat(salePrice) <= 0) return
    try {
      await api.completeLotSale(lotId, Number.parseFloat(salePrice))
      setSalePrice("")
      setCommission(null)
      loadData()
      toast({ title: "Sale completed" })
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to complete sale" })
    }
  }

  const renderFormContent = (submitLabel: string) => (    
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Lot Number</Label>
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
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>Triage Status</Label>
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
          <Label>Images</Label>
          
          {/* Upload Input */}
          <div className="flex items-center gap-2 mb-3">
             <Input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageSelect}
             />
          </div>
          
          {/* Existing Images + New Previews */}
          {( (editingLot?.images && editingLot.images.length > 0) || previewImages.length > 0 ) && (
            <div className="grid grid-cols-5 gap-2 border p-2 rounded bg-muted/10">
                {editingLot?.images?.map(img => (
                   <div key={img.id} className="relative group aspect-square bg-background rounded overflow-hidden border shadow-sm">
                     <img 
                        src={img.thumbnail_url || img.image_url} 
                        className="w-full h-full object-cover" 
                        alt="lot"
                     />
                     <button 
                        type="button" 
                        onClick={() => handleDeleteImage(img.id)} 
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete existing image"
                     >
                       <X className="h-3 w-3" />
                     </button>
                     {/* <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] text-center py-0.5">Existing</div> */}
                   </div>
                ))}

                {previewImages.map((src, index) => (
                  <div key={`new-${index}`} className="relative group aspect-square bg-background rounded overflow-hidden border shadow-sm">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                        type="button" 
                        onClick={() => removePreviewImage(index)} 
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove upload"
                     >
                       <X className="h-3 w-3" />
                     </button>
                     {/* <div className="absolute bottom-0 w-full bg-blue-600/70 text-white text-[10px] text-center py-0.5">New</div> */}
                  </div>
                ))}
            </div>
          )}
          {!editingLot?.images?.length && previewImages.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No images selected.</p>
          )}
        </div>

      </div>
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={() => editingLot ? setEditingLot(null) : setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Lots Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage lot items</p>
        </div>
        {viewMode === "active" && (
            <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Lot
            </Button>
        )}
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
        <TabsList>
            <TabsTrigger value="active" className="text-muted-foreground">Active</TabsTrigger>
            <TabsTrigger value="archived" className="text-muted-foreground">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create New Lot</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit}>
                {renderFormContent("Create Lot")}
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingLot} onOpenChange={(open) => !open && setEditingLot(null)}>
        <DialogContent className="sm:max-w-[1000px] w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Lot</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-1">
              <form onSubmit={handleUpdateSubmit}>
                {renderFormContent("Save Changes")}
              </form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lots.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
                No {viewMode} lots found.
            </div>
        )}
        {lots.map((lot) => (
          <Card key={lot.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{lot.artist}</CardTitle>
                  <p className="text-sm text-muted-foreground italic">{lot.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lot.lot_reference}</p>
                </div>
                <Badge variant={lot.status === "Sold" ? "secondary" : "outline"}>{lot.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
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
                    <span>£{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stream:</span>
                    <Badge variant="outline">{lot.triage_status}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t pt-4">
               
               {viewMode === "active" ? (
                   <>
                    <div className="flex w-full gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => startEditing(lot)}>
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" className="flex-1">
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete this lot. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(lot.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    
                    <div className="flex w-full gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleArchive(lot.id)}>
                      <Archive className="h-3 w-3 mr-1" /> Archive
                        </Button>
                        {lot.status === "Pending" && (
                            <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedLot(lot)}>
                                <Calendar className="h-4 w-4 mr-2" /> Auction
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Assign Auction</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                <Select value={assignAuctionId} onValueChange={setAssignAuctionId}>
                                    <SelectTrigger><SelectValue placeholder="Select auction..." /></SelectTrigger>
                                    <SelectContent>
                                    {auctions.filter((a) => a.status === "Upcoming").map((auction) => (
                                        <SelectItem key={auction.id} value={String(auction.id)}>{auction.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAssignAuction} className="w-full">Assign</Button>
                                </div>
                            </DialogContent>
                            </Dialog>
                        )}
                    </div>
                   </>
               ) : (
                    <div className="flex w-full gap-2">
                       <Button variant="outline" size="sm" className="flex-1" onClick={() => handleRestore(lot.id)}>
                           <RefreshCcw className="h-3 w-3 mr-1" /> Restore
                       </Button>
                       <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="flex-1">
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently remove this lot from the database.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(lot.id)}>Delete Permanently</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
               )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}