"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { api, type Auction, type Lot } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Clock, Search, X, Filter, Save, FileText, Download, Pencil, Trash2, Archive, RefreshCcw, Lock, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge" 

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([])
  const [viewMode, setViewMode] = useState<"active" | "archived">("active")
  const [showForm, setShowForm] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null)
  const { toast } = useToast()
  
  const [catalogueAuction, setCatalogueAuction] = useState<Auction | null>(null)
  const [allLots, setAllLots] = useState<Lot[]>([]) 
  const [displayedLots, setDisplayedLots] = useState<Lot[]>([]) 
  const [selectedLotIds, setSelectedLotIds] = useState<number[]>([]) 
  const [lotSearchQuery, setLotSearchQuery] = useState("") 
  const [loadingLots, setLoadingLots] = useState(false)
  const [savingAssignments, setSavingAssignments] = useState(false)

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
  useEffect(() => { loadAuctions() }, [viewMode])

  useEffect(() => {
    let result = auctions
    
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase()
      result = result.filter(a => a.title.toLowerCase().includes(lowerQ) || (a.theme && a.theme.toLowerCase().includes(lowerQ)))
    }
    
    if (statusFilter !== "all") {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        result = result.filter(a => {
            const auctionDate = new Date(a.auction_date);
            const isCompleted = auctionDate < now;
            const derivedStatus = isCompleted ? "Completed" : "Upcoming";
            return derivedStatus === statusFilter;
        })
    }
    
    // 3. Location Filter
    if (locationFilter !== "all") result = result.filter(a => a.location === locationFilter)
    
    // 4. Date Filters
    if (dateFrom) result = result.filter(a => new Date(a.auction_date) >= new Date(dateFrom))
    if (dateTo) result = result.filter(a => new Date(a.auction_date) <= new Date(dateTo))
    
    setFilteredAuctions(result)
  }, [auctions, searchQuery, statusFilter, locationFilter, dateFrom, dateTo])

  
  const openCatalogueDialog = async (auction: Auction) => {
      setCatalogueAuction(auction)
      setLoadingLots(true)
      setLotSearchQuery("") 
      
      try {
          const fetchedLots = await api.getLots()
          
          fetchedLots.sort((a, b) => {
              const aIsThis = String(a.auction_id) === String(auction.id)
              const bIsThis = String(b.auction_id) === String(auction.id)
              const aIsOther = a.auction_id && !aIsThis
              const bIsOther = b.auction_id && !bIsThis

              if (aIsThis && !bIsThis) return -1
              if (!aIsThis && bIsThis) return 1
              if (!aIsOther && bIsOther) return -1
              if (aIsOther && !bIsOther) return 1
              return a.lot_reference.localeCompare(b.lot_reference)
          })

          setAllLots(fetchedLots)
          setDisplayedLots(fetchedLots)

          const currentIds = fetchedLots
            .filter(l => String(l.auction_id) === String(auction.id))
            .map(l => l.id)
          
          setSelectedLotIds(currentIds)

      } catch (e) {
          toast({ variant: "destructive", title: "Error", description: "Failed to load lots." })
      } finally {
          setLoadingLots(false)
      }
  }

  useEffect(() => {
      if (!catalogueAuction) return
      
      const lowerQ = lotSearchQuery.toLowerCase()
      const filtered = allLots.filter(l => 
          l.title.toLowerCase().includes(lowerQ) || 
          l.artist.toLowerCase().includes(lowerQ) ||
          l.lot_reference.toLowerCase().includes(lowerQ)
      )
      setDisplayedLots(filtered)
  }, [lotSearchQuery, allLots, catalogueAuction])

  const toggleLotSelection = (lotId: number) => {
      setSelectedLotIds(prev => 
          prev.includes(lotId) ? prev.filter(id => id !== lotId) : [...prev, lotId]
      )
  }

  const handleSaveAssignments = async () => {
      if (!catalogueAuction) return
      setSavingAssignments(true)
      try {
          const promises = allLots.map(lot => {
              const isSelected = selectedLotIds.includes(lot.id)
              const isCurrentlyAssignedToThis = String(lot.auction_id) === String(catalogueAuction.id)
              const isAssignedToOther = lot.auction_id && !isCurrentlyAssignedToThis

              if (isAssignedToOther) return Promise.resolve()

              if (isSelected && !isCurrentlyAssignedToThis) {
                  return api.assignLotToAuction(lot.id, catalogueAuction.id)
              }
              
              if (!isSelected && isCurrentlyAssignedToThis) {
                  return api.updateLot(lot.id, { auction_id: null } as any)
              }
              
              return Promise.resolve()
          })

          await Promise.all(promises)
          
          toast({ title: "Success", description: "Catalogue updated successfully." })
          
          openCatalogueDialog(catalogueAuction) 

      } catch (error) {
          toast({ variant: "destructive", title: "Save Failed", description: "Could not update assignments." })
      } finally {
          setSavingAssignments(false)
      }
  }

  const handlePrintCatalogue = async () => {
    if (!catalogueAuction) return
  
    
    setGeneratingPdf(catalogueAuction.id)
    try {
      const blob = await api.generateAuctionPDF(catalogueAuction.id) 
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Fotherby_${catalogueAuction.title.replace(/\s+/g, "_")}_Catalogue.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: "PDF Generated", description: "Based on saved assignments." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." })
    } finally {
      setGeneratingPdf(null)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { await api.createAuction(formData); setShowForm(false); setFormData({ title: "", location: "London", auction_date: "", start_time: "7:00pm", theme: "" }); loadAuctions(); toast({ title: "Auction created" }) } catch { toast({ variant: "destructive", title: "Error" }) } }
  const handleUpdateSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!editingAuction) return; try { await api.updateAuction(editingAuction.id, formData); setEditingAuction(null); loadAuctions(); toast({ title: "Auction updated" }) } catch { toast({ variant: "destructive", title: "Error" }) } }
  const startEditing = (auction: Auction) => { setEditingAuction(auction); setFormData({ title: auction.title, location: auction.location as any, auction_date: auction.auction_date, start_time: auction.start_time as any, theme: auction.theme || "" }) }
  const handleDelete = async (id: number) => { try { await api.deleteAuction(id); loadAuctions(); toast({ title: "Auction deleted" }) } catch (e: any) { toast({ variant: "destructive", title: "Cannot delete", description: e.message }) } }
  const handleArchive = async (id: number) => { try { await api.archiveAuction(id); loadAuctions(); toast({ title: "Auction archived" }) } catch { toast({ variant: "destructive", title: "Error" }) } }
  const handleRestore = async (id: number) => { try { await api.unarchiveAuction(id); loadAuctions(); toast({ title: "Auction restored" }) } catch { toast({ variant: "destructive", title: "Error" }) } }

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

      <Dialog open={!!editingAuction} onOpenChange={(open) => !open && setEditingAuction(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Auction</DialogTitle></DialogHeader><AuctionForm onSubmit={handleUpdateSubmit} submitLabel="Save Changes" /></DialogContent>
      </Dialog>

      {/* CATALOGUE DIALOG */}
      <Dialog open={!!catalogueAuction} onOpenChange={(open) => !open && setCatalogueAuction(null)}>
        <DialogContent className="max-w-[700px] h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Manage Catalogue</DialogTitle>
                <DialogDescription>Assign items to "{catalogueAuction?.title}". Save changes to update PDF.</DialogDescription>
            </DialogHeader>
            
            {/* Search Bar */}
            <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search lots to add..." 
                    className="pl-9"
                    value={lotSearchQuery}
                    onChange={(e) => setLotSearchQuery(e.target.value)}
                />
            </div>

            <div className="text-xs text-muted-foreground">
                    {selectedLotIds.length} / {allLots.length}
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md p-0">
                {loadingLots ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : displayedLots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No lots found.</div>
                ) : (
                    <div className="divide-y">
                        {displayedLots.map(lot => {
                            const isAssignedToThis = String(lot.auction_id) === String(catalogueAuction?.id)
                            const isAssignedToOther = lot.auction_id && !isAssignedToThis
                            const isDisabled = !!isAssignedToOther

                            return (
                            <div 
                                key={lot.id} 
                                className={`flex items-center space-x-3 p-3 transition-colors ${
                                    isAssignedToThis ? "bg-primary/5" : 
                                    isDisabled ? "bg-muted/40 opacity-60" : "hover:bg-muted/30"
                                }`}
                            >
                                <Checkbox 
                                    id={`lot-${lot.id}`} 
                                    checked={selectedLotIds.includes(lot.id)}
                                    disabled={isDisabled} 
                                    onCheckedChange={() => !isDisabled && toggleLotSelection(lot.id)}
                                />
                                <div className="flex-1 text-sm grid gap-0.5">
                                    <div className="flex justify-between items-center">
                                        <Label 
                                            htmlFor={`lot-${lot.id}`} 
                                            className={`font-medium ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                            {lot.title}
                                        </Label>
                                        
                                        {/* Status Badge */}
                                        {isAssignedToThis && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium flex items-center">
                                                In Catalogue
                                            </span>
                                        )}
                                        {isAssignedToOther && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium flex items-center">
                                                <Lock className="h-3 w-3 mr-1" />
                                                Other Auction
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{lot.lot_reference}</span>
                                        <span>•</span>
                                        <span>{lot.artist}</span>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>

            <DialogFooter className="flex sm:justify-between items-center mt-2 pt-2">
                <Button variant="outline" className="text-muted-foreground" onClick={() => setCatalogueAuction(null)}>Cancel</Button>

                <div className="flex gap-2 ">
                    <Button 
                        variant="default"
                        onClick={handleSaveAssignments}
                        disabled={savingAssignments}
                    >
                        {savingAssignments ? (
                            <> <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Saving... </>
                        ) : (
                            <> <Save className="mr-2 h-4 w-4" /> Save </>
                        )}
                    </Button>
                    <Button 
                        variant="outline"
                        className="text-muted-foreground"
                        onClick={handlePrintCatalogue} 
                        disabled={generatingPdf !== null}
                    >
                        {generatingPdf ? (
                            <> <Download className="mr-2 h-4 w-4 animate-spin" /> Generating... </>
                        ) : (
                            <> <FileText className="mr-2 h-4 w-4" /> Print PDF </>
                        )}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title or theme" className="pl-9 w-full bg-background" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
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
                    <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
            </Select>
        </div>
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

      {/* AUCTION LIST */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAuctions.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">
                No auctions match your filters.
            </div>
        ) : (
            filteredAuctions.map((auction) => {
                const isCompleted = new Date(auction.auction_date) < new Date();
                const displayStatus = isCompleted ? "Completed" : "Upcoming";
                const badgeVariant = isCompleted ? "secondary" : "default";

                return (
                <Card key={auction.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">{auction.auction_type}</Badge>
                        <Badge>Upcoming</Badge>
                      </div>
                      <CardTitle className="text-lg text-foreground">
                        {auction.title}
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
                            <div className="flex w-full gap-2"><Button variant="outline" size="sm" className="flex-1" onClick={() => startEditing(auction)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
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
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(auction.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>                        
                            </div>
                            <div className="flex w-full gap-2"><Button variant="outline" size="sm" className="flex-1" onClick={() => handleArchive(auction.id)}><Archive className="h-3 w-3 mr-1" /> Archive</Button><Button onClick={() => openCatalogueDialog(auction)} className="flex-1" variant="outline" size="sm"><FileText className="h-3 w-3 mr-1" /> Catalogue</Button></div>
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
            )})
        )}
      </div>
    </div>
  )
}