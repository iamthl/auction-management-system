"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { api, type Auction } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    location: "London" as "London" | "Paris" | "New York",
    auction_date: "",
    start_time: "7:00pm" as "9:30am" | "2:00pm" | "7:00pm",
    theme: "",
  })

  const loadAuctions = () => {
    api.getAuctions().then(setAuctions)
  }

  useEffect(() => {
    loadAuctions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createAuction(formData)
      setShowForm(false)
      setFormData({ title: "", location: "London", auction_date: "", start_time: "7:00pm", theme: "" })
      loadAuctions()
      toast({
        title: "Auction created",
        description: "The auction has been successfully created.",
      })
    } catch (error) {
      console.error("Failed to create auction:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create auction. Please try again.",
      })
    }
  }

  const handleGeneratePdf = async (auctionId: number, auctionTitle: string) => {
    setGeneratingPdf(auctionId)
    try {
      const response = await fetch(`http://localhost:8000/api/auctions/${auctionId}/generate-pdf`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to generate PDF")

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${auctionTitle.replace(/\s+/g, "_")}_Catalogue.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "PDF Generated",
        description: "The auction catalogue PDF has been downloaded.",
      })
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
      })
    } finally {
      setGeneratingPdf(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Auctions</h1>
          <p className="text-muted-foreground mt-1">Manage auction events</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Auction
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Auction</CardTitle>
            <CardDescription>Set up a new auction event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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

              <div className="flex gap-2">
                <Button type="submit">Create Auction</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {auctions.map((auction) => (
          <Card key={auction.id}>
            <CardHeader>
              <CardTitle className="text-lg">{auction.title}</CardTitle>
              <CardDescription>{auction.theme}</CardDescription>
            </CardHeader>
            <CardContent>
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

              <Button
                onClick={() => handleGeneratePdf(auction.id, auction.title)}
                className="w-full mt-4"
                variant="outline"
                disabled={generatingPdf === auction.id}
              >
                {generatingPdf === auction.id ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Catalogue PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
