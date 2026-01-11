"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { api, type Auction } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Clock, Search, X, Filter } from "lucide-react"

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, FileText, Download, Pencil, Trash2, Archive, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([])
  const [viewMode, setViewMode] = useState<"active" | "archived">("active")
  const [showForm, setShowForm] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null)
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") 
  const [locationFilter, setLocationFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [editingAuction, setEditingAuction] = useState<Auction | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    location: "London" as "London" | "Paris" | "New York",
    auction_date: "",
    start_time: "7:00pm" as "9:30am" | "2:00pm" | "7:00pm",
    theme: "",
  })

  const loadAuctions = () => {
    api.getAuctions({ archived_only: viewMode === "archived" }).then((data) => {
        setAuctions(data)
        setFilteredAuctions(data)
    })
  }
  useEffect(() => {
    loadAuctions()
  }, [viewMode])

  useEffect(() => {
    let result = auctions

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase()
      result = result.filter(a => 
        a.title.toLowerCase().includes(lowerQ) || 
        (a.theme && a.theme.toLowerCase().includes(lowerQ))
      )
    }

    if (statusFilter !== "all") {
      result = result.filter(a => a.status === statusFilter)
    }

    if (locationFilter !== "all") {
      result = result.filter(a => a.location === locationFilter)
    }

    if (dateFrom) {
      result = result.filter(a => new Date(a.auction_date) >= new Date(dateFrom))
    }
    if (dateTo) {
      result = result.filter(a => new Date(a.auction_date) <= new Date(dateTo))
    }

    setFilteredAuctions(result)
  }, [auctions, searchQuery, statusFilter, locationFilter, dateFrom, dateTo])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createAuction(formData)
      setShowForm(false)
      setFormData({ title: "", location: "London", auction_date: "", start_time: "7:00pm", theme: "" })
      loadAuctions()
      toast({ title: "Auction created", description: "The auction has been successfully created." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create auction." })
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAuction) return
    try {
      await api.updateAuction(editingAuction.id, formData)
      setEditingAuction(null)
      loadAuctions()
      toast({ title: "Auction updated", description: "Changes saved successfully." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update auction." })
    }
  }

  const startEditing = (auction: Auction) => {
    setEditingAuction(auction)
    setFormData({
      title: auction.title,
      location: auction.location as any,
      auction_date: auction.auction_date,
      start_time: auction.start_time as any,
      theme: auction.theme || "",
    })
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAuction(id)
      loadAuctions()
      toast({ title: "Auction deleted", description: "The auction has been removed." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Cannot delete", description: error.message || "Failed to delete auction." })
    }
  }

  const handleArchive = async (id: number) => {
    try {
      await api.archiveAuction(id)
      loadAuctions()
      toast({ title: "Auction archived" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to archive auction." })
    }
  }

  const handleRestore = async (id: number) => {
    try {
      await api.unarchiveAuction(id)
      loadAuctions()
      toast({ title: "Auction restored", description: "Moved back to active list." })
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to restore auction." })
    }
  }

  const handleGeneratePdf = async (auctionId: number, auctionTitle: string) => {
    setGeneratingPdf(auctionId)
    try {
      const blob = await api.generateAuctionPDF(auctionId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Fotherby_${auctionTitle.replace(/\s+/g, "_")}_Catalogue.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: "PDF Generated" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." })
    } finally {
      setGeneratingPdf(null)
    }
  }

  const AuctionForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void, submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4 text-muted-foreground">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Auction Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="21st Century English Paintings"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Select
            value={formData.location}
            onValueChange={(value) => setFormData({ ...formData, location: value as any })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="London">London</SelectItem>
              <SelectItem value="Paris">Paris</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Auction Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.auction_date}
            onChange={(e) => setFormData({ ...formData, auction_date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Start Time</Label>
          <Select
            value={formData.start_time}
            onValueChange={(value) => setFormData({ ...formData, start_time: value as any })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="9:30am">9:30am</SelectItem>
              <SelectItem value="2:00pm">2:00pm</SelectItem>
              <SelectItem value="7:00pm">7:00pm</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="theme">Theme (Optional)</Label>
          <Input
            id="theme"
            value={formData.theme}
            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
            placeholder="Contemporary British Art"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => editingAuction ? setEditingAuction(null) : setShowForm(false)}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Auctions Management</h1>
          <p className="text-muted-foreground mt-1">Manage auction events</p>
        </div>
        {viewMode === "active" && (
            <Button onClick={() => {
                setFormData({ title: "", location: "London", auction_date: "", start_time: "7:00pm", theme: "" })
                setShowForm(!showForm)
            }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Auction
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
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-foreground">Create New Auction</CardTitle>
            <CardDescription>Set up a new auction event</CardDescription>
          </CardHeader>
          <CardContent>
            <AuctionForm onSubmit={handleCreateSubmit} submitLabel="Create Auction" />
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAuction} onOpenChange={(open) => !open && setEditingAuction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Auction</DialogTitle>
            <DialogDescription>Modify auction details.</DialogDescription>
          </DialogHeader>
          <AuctionForm onSubmit={handleUpdateSubmit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* --- UPDATED FILTER BAR --- */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        
        {/* Search - Grows to fill space */}
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search title or theme..." 
                className="pl-9 w-full bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* Status - Fixed Width */}
        <div className="w-full md:w-[160px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                    <div className="flex items-center text-muted-foreground">
                        <Filter className="h-4 w-4 mr-2" />
                        <span className="truncate text-muted-foreground">
                            {statusFilter === 'all' ? 'All Status' : statusFilter}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Past">Past</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Location - Fixed Width */}
        <div className="w-full md:w-[160px]">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="bg-background">
                <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate text-muted-foreground">
                        {locationFilter === 'all' ? 'All Locations' : locationFilter}
                    </span>
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

        {/* Date Range - Fixed Width */}
        <div className="w-full md:w-[150px]">
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-[150px] justify-start text-left font-normal bg-background px-3">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className={`truncate ${!dateFrom ? "text-muted-foreground" : "text-foreground"}`}>
                            {dateFrom ? (
                                dateTo ? `${dateFrom} - ${dateTo}` : `${dateFrom}...`
                            ) : (
                                "Pick dates"
                            )}
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
      </div>

      {/* AUCTION LIST GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAuctions.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">
                No auctions match your filters.
            </div>
        ) : (
            filteredAuctions.map((auction) => (
            <Card key={auction.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-start text-foreground">
                      <span>{auction.title}</span>
                  </CardTitle>
                  <CardDescription>{auction.theme}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{auction.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{new Date(auction.auction_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{auction.start_time}</span>
                    </div>
                </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-0">
                {viewMode === "active" ? (
                    <>
                        <div className="flex w-full gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => startEditing(auction)}>
                                <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="flex-1">
                                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the auction "{auction.title}". This cannot be undone. 
                                            Note: You cannot delete auctions that have lots assigned.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(auction.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="flex w-full gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleArchive(auction.id)}>
                                <Archive className="h-3 w-3 mr-1" /> Archive
                            </Button>

                            <Button
                                onClick={() => handleGeneratePdf(auction.id, auction.title)}
                                className="flex-1"
                                variant="outline"
                                size="sm"
                                disabled={generatingPdf === auction.id}
                            >
                                {generatingPdf === auction.id ? (
                                <Download className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                <FileText className="h-3 w-3 mr-1" />
                                )}
                                Catalogue
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex w-full gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleRestore(auction.id)}>
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
                                            This will permanently remove this auction from the database.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(auction.id)}>Delete Permanently</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                    </div>
                )}
                </CardFooter>
            </Card>
            ))
        )}
      </div>
    </div>
  )
}