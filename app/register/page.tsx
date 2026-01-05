"use client"

import { useState } from "react"
import { useAuth } from "../context/auth-context"
import { PublicHeader } from "@/components/public-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    title: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    client_type: "Buyer",
    bank_account_number: "",
    bank_sort_code: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Registration failed")
      }

      const data = await res.json()
      login(data.access_token, data)
      
      toast({ title: "Account created!", description: "Welcome to Fotherby's." })
    } catch (error: any) {
      toast({ 
        title: "Registration Failed", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Register to bid and consign items. Approval required for trading.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              
              {/* Personal Details */}
              <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="title">Title</Label>
                        <Select onValueChange={(val) => setFormData({...formData, title: val})}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Mr">Mr</SelectItem>
                                <SelectItem value="Mrs">Mrs</SelectItem>
                                <SelectItem value="Ms">Ms</SelectItem>
                                <SelectItem value="Dr">Dr</SelectItem>
                                <SelectItem value="Prof">Prof</SelectItem>
                                <SelectItem value="Sir">Sir</SelectItem>
                                <SelectItem value="Lady">Lady</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input id="first_name" required value={formData.first_name} onChange={handleChange} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="last_name">Surname</Label>
                        <Input id="last_name" required value={formData.last_name} onChange={handleChange} />
                    </div>
                  </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Contact E-mail</Label>
                        <Input id="email" type="email" required value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Contact Telephone</Label>
                        <Input id="phone" required value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Contact Address</Label>
                        <Input id="address" required value={formData.address} onChange={handleChange} placeholder="Street, City, Postcode" />
                    </div>
                  </div>
              </div>

              {/* Account Status & Banking */}
              <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Account Setup</h3>
                  <div className="space-y-2">
                    <Label>Client Status</Label>
                    <Select defaultValue="Buyer" onValueChange={(val) => setFormData({...formData, client_type: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buyer">Buyer</SelectItem>
                        <SelectItem value="Seller">Seller</SelectItem>
                        <SelectItem value="Joint">Joint (Buyer & Seller)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="bank_account_number">Bank Account No.</Label>
                        <Input id="bank_account_number" value={formData.bank_account_number} onChange={handleChange} placeholder="Optional for Buyers" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bank_sort_code">Bank Sort Code</Label>
                        <Input id="bank_sort_code" value={formData.bank_sort_code} onChange={handleChange} placeholder="XX-XX-XX" />
                    </div>
                  </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={formData.password} onChange={handleChange} />
              </div>

            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Register"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}