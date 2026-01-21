"use client"

import { useEffect, useState } from "react"
import { api, type Lot } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { useAuth } from "@/app/context/auth-context"
import { PublicHeader } from "@/components/public-header"

export default function ClientSellPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const [formData, setFormData] = useState({
    artist: "",
    title: "",
    category: "Painting",
    subcategory: "",
    description: "",
    estimate_low: "",
    estimate_high: "",
    reserve_price: "",
    year: "",
    subject: "Landscape",
    provenance: "",
    is_authenticated: false,
    client_signature: "",
    client_signed_date: new Date().toISOString().split('T')[0],
    medium: "",
    material: "",
    height: "",
    width: "",
    depth: "",
    lot_reference: `SUB-${Date.now()}`, 
    triage_status: "Physical",
    weight: "",
    is_framed: false,
  })

  const isArt2D = ["Drawing", "Painting"].includes(formData.category)
  const isPhoto = formData.category === "Photography"
  const is3D = ["Sculpture", "Carving"].includes(formData.category)

  // Auth check
  if (!user) return <div className="p-8">Please login.</div>

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.client_signature) {
        toast({ variant: "destructive", title: "Signature Required", description: "Please sign the agreement." })
        return
    }

    try {
      // 3. PAYLOAD DEFINED INSIDE HANDLER
      const cleanNum = (val: string) => (val === "" ? undefined : Number(val));

      const payload = {
        ...formData,
        estimate_low: Number(formData.estimate_low),
        estimate_high: Number(formData.estimate_high),
        reserve_price: Number(formData.reserve_price),
        year_of_production: formData.year ? Number(formData.year) : undefined,
        height: cleanNum(formData.height),
        width: cleanNum(formData.width),
        depth: cleanNum(formData.depth),
        weight: cleanNum(formData.weight),
        status: "Submitted"
      }

      const newLot = await api.createLot(payload as any)

      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          await api.uploadLotImage(newLot.id, imageFiles[i], i === 0)
        }
      }

      toast({ title: "Item Submitted", description: "Your item has been sent for expert review." })
      
      // Reset form
      setFormData(prev => ({ ...prev, artist: "", title: "", description: "" }))
      setImageFiles([])
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Agreement Form</h1>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Artist</Label>
                <Input value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Painting">Painting</SelectItem>
                    <SelectItem value="Drawing">Drawing</SelectItem>
                    <SelectItem value="Photography">Photography</SelectItem>
                    <SelectItem value="Sculpture">Sculpture</SelectItem>
                    <SelectItem value="Carving">Carving</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                    <Label>Subcategory</Label>
                    <Input 
                        placeholder="e.g. Abstract, Portrait, Bronze" 
                        value={formData.subcategory} 
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} 
                    />
                    {/* <p className="text-[10px] text-muted-foreground">Type to create or edit subcategory.</p> */}
              </div>

              {isArt2D && (
                <div className="space-y-2">
                    <Label>Medium</Label>
                    <Input 
                        placeholder="e.g. Oil, Acrylic, Pencil"
                        value={formData.medium} 
                        onChange={(e) => setFormData({ ...formData, medium: e.target.value })} 
                    />
                </div>
            )}
            {isPhoto && (
                <div className="space-y-2">
                    <Label>Image Type</Label>
                    <Select value={formData.medium} onValueChange={(v) => setFormData({ ...formData, medium: v })}>
                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Black and White">Black and White</SelectItem>
                            <SelectItem value="Colour">Colour</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            {is3D && (
                <div className="space-y-2">
                    <Label>Material</Label>
                    <Input 
                        placeholder="e.g. Bronze, Oak"
                        value={formData.material} 
                        onChange={(e) => setFormData({ ...formData, material: e.target.value })} 
                    />
                </div>
            )}

            <div className="col-span-2 grid grid-cols-3 gap-4 border p-3 rounded-md bg-muted/20">
                <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" step="0.1" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Length (cm)</Label>
                    <Input type="number" step="0.1" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })} />
                </div>
                {is3D && (
                    <div className="space-y-2">
                        <Label>Width (cm)</Label>
                        <Input type="number" step="0.1" value={formData.depth} onChange={(e) => setFormData({ ...formData, depth: e.target.value })} />
                    </div>
                )}
            </div>

            {is3D && (
                <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
                </div>
            )}

            {isArt2D && (
                <div className="flex items-center space-x-2 border p-3 rounded-md">
                    <Switch 
                        id="framed-mode" 
                        checked={formData.is_framed}
                        onCheckedChange={(checked) => setFormData({...formData, is_framed: checked})}
                    />
                    <Label htmlFor="framed-mode">Framed?</Label>
                </div>
            )}
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
            <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            />
            </div>
            <div className="space-y-2">
            <Label>Estimate Low (£)</Label>
            <Input type="number" value={formData.estimate_low} onChange={(e) => setFormData({ ...formData, estimate_low: e.target.value })} required />
            </div>
            <div className="space-y-2">
            <Label>Estimate High (£)</Label>
            <Input type="number" value={formData.estimate_high} onChange={(e) => setFormData({ ...formData, estimate_high: e.target.value })} required />
            </div>
            <div className="space-y-2">
            <Label>Reserve Price (£)</Label>
            <Input type="number" value={formData.reserve_price} onChange={(e) => setFormData({ ...formData, reserve_price: e.target.value })} required />
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-lg">Provenance & Authenticity</h3>
              <div className="space-y-2">
                <Label>Provenance Details</Label>
                <Textarea 
                  placeholder="History of ownership..." 
                  value={formData.provenance} 
                  onChange={e => setFormData({...formData, provenance: e.target.value})} 
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={formData.is_authenticated} onCheckedChange={c => setFormData({...formData, is_authenticated: c})} />
                <Label>Authenticity Established?</Label>
              </div>
            </div>

            <div className="bg-muted/40 p-6 rounded-md text-sm space-y-4 text-muted-foreground">
              <h3 className="font-bold text-foreground text-base underline">Customer Agreement</h3>
              <p>By signing the agreement, you are confirming the following to be true:</p>
              <div className="space-y-2 ">
                <p>1) I am the sole owner of the piece described above.</p>
                <p>2) To the best of my knowledge the description is accurate and true.</p>
                <p>3) I believe the piece to be authentic.</p>
                <p>4) I authorise Fotherby’s Ltd to act on my behalf to sell for not below reserve.</p>
                <p>5) I agree to pay Fotherby’s Ltd 10% commission of the final sale price.</p>
                <p>6) Withdrawal must be in writing 2 weeks before auction, otherwise withdrawal fees apply.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Signed :</Label>
                  <Input value={formData.client_signature} onChange={e => setFormData({...formData, client_signature: e.target.value})} placeholder="Type full name" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Dated :</Label>
                  <Input type="date" value={formData.client_signed_date} onChange={e => setFormData({...formData, client_signed_date: e.target.value})} required />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">Submit Agreement</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}