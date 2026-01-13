"use client"

import { useState } from "react"
import { PublicHeader } from "@/components/public-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
        setLoading(false)
        toast({
            title: "Message Sent",
            description: "We'll get back to you within 24 hours.",
        })
        // Reset form logic here if needed
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* <div className="bg-muted/30 py-16 mb-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-serif font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
                Whether you are looking to buy, sell, or value an item, our team is here to help.
            </p>
        </div>
      </div> */}

      <section className="relative h-[30vh] flex items-center justify-center bg-gradient-to-b from-muted/30 to-background mb-12">
        <div className="absolute inset-0 bg-[url('/luxury-art-gallery.png')] bg-cover bg-center opacity-10" />
        <div className="relative text-center space-y-6 px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">Contact Us</h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Connecting collectors with exceptional works since 1961
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-serif font-bold mb-6">Get in Touch</h2>
                    <p className="text-muted-foreground mb-8">
                        Visit our London headquarters or reach out via phone or email. 
                        For valuation requests, please use our dedicated Valuation form.
                    </p>
                </div>

                <div className="grid gap-6 ">
                    <Card>
                        <CardContent className="flex items-start p-6 gap-4">
                            <MapPin className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold mb-1">Headquarters</h3>
                                <p className="text-sm text-muted-foreground">
                                    123 Bond Street<br />
                                    Mayfair, London<br />
                                    W1S 1AR, United Kingdom
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-start p-6 gap-4">
                            <Phone className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold mb-1">Phone</h3>
                                <p className="text-sm text-muted-foreground mb-1">+44 (0) 20 7123 4567</p>
                                <p className="text-xs text-muted-foreground">Mon-Fri, 9am - 6pm GMT</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-start p-6 gap-4">
                            <Mail className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold mb-1">Email</h3>
                                <p className="text-sm text-muted-foreground">enquiries@fotherby.com</p>
                                <p className="text-sm text-muted-foreground">valuations@fotherby.com</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card rounded-xl border p-8 shadow-sm hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-serif font-bold mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" placeholder="Jane" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" placeholder="Doe" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="jane@example.com" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="General Enquiry" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                            id="message" 
                            placeholder="How can we help you?" 
                            className="min-h-[150px]" 
                            required 
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Sending..." : (
                            <>
                                Send Message <Send className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </div>

        </div>
      </div>
    </div>
  )
}