"use client"

import { useEffect, useState } from "react"
import { api, type Lot } from "@/lib/api"
import { PublicHeader } from "@/components/public-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Package, TrendingUp, Clock, Calendar } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ClientPortalPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)

  // Mock client ID, in production, this would come from authentication
  const mockClientId = 2

  useEffect(() => {
    api
      .getClientLots(mockClientId)
      .then(setLots)
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: lots.length,
    listed: lots.filter((l) => l.status === "Listed").length,
    pending: lots.filter((l) => l.status === "Pending").length,
    sold: lots.filter((l) => l.status === "Sold").length,
    withdrawn: lots.filter((l) => l.status === "Withdrawn").length,
    totalEstimate: lots.reduce((sum, lot) => sum + lot.estimate_high, 0),
  }

  const withdrawnWithFees = lots.filter((l) => l.status === "Withdrawn" && l.withdrawal_fee > 0)

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">Seller Dashboard</h1>
          <p className="text-muted-foreground">Track the status of your consigned items</p>
        </div>

        {/* Warning for withdrawal fees */}
        {withdrawnWithFees.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Withdrawal Fees Applied</AlertTitle>
            <AlertDescription>
              {withdrawnWithFees.length} item(s) withdrawn within 2 weeks of auction incurred a 5% fee on lower
              estimate.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Consigned with Fotherby&apos;s</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Listed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.listed}</div>
              <p className="text-xs text-muted-foreground mt-1">Active in auctions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sold</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sold}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully auctioned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{(stats.totalEstimate / 1000).toFixed(0)}k</div>
              <p className="text-xs text-muted-foreground mt-1">High estimates</p>
            </CardContent>
          </Card>
        </div>

        {/* Lots Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Consigned Items</CardTitle>
            <CardDescription>View the status and details of your items</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading your items...</div>
            ) : lots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No items found</div>
            ) : (
              <div className="space-y-4">
                {lots.map((lot) => (
                  <div
                    key={lot.id}
                    className="flex flex-col md:flex-row gap-4 p-4 border border-border rounded-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-full md:w-32 h-32 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                      {lot.images?.[0]?.image_url ? (
                        <img
                          src={lot.images[0].image_url || "/placeholder.svg"}
                          alt={lot.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{lot.lot_reference}</p>
                          <h3 className="font-semibold text-lg text-foreground">{lot.artist}</h3>
                          <p className="text-sm italic text-muted-foreground">{lot.title}</p>
                        </div>
                        <Badge
                          variant={
                            lot.status === "Sold"
                              ? "default"
                              : lot.status === "Listed"
                                ? "default"
                                : lot.status === "Withdrawn"
                                  ? "destructive"
                                  : "secondary"
                          }
                        >
                          {lot.status}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimate:</span>
                          <span className="font-medium">
                            £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
                          </span>
                        </div>

                        {lot.sold_price && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sold Price:</span>
                            <span className="font-medium text-green-600">£{lot.sold_price.toLocaleString()}</span>
                          </div>
                        )}

                        {lot.withdrawal_fee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Withdrawal Fee:</span>
                            <span className="font-medium text-destructive">£{lot.withdrawal_fee.toLocaleString()}</span>
                          </div>
                        )}

                        {lot.auction_title && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Auction:</span>
                              <span className="font-medium">{lot.auction_title}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date:</span>
                              <span className="font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(lot.auction_date!).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {lot.status === "Withdrawn" && lot.withdrawal_fee > 0 && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            This item was withdrawn less than 2 weeks before the auction. A 5% fee (£
                            {lot.withdrawal_fee.toLocaleString()}) of the lower estimate has been applied.
                          </AlertDescription>
                        </Alert>
                      )}

                      {lot.status === "Pending" && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Your item is being prepared for an upcoming auction. You will be notified once it is listed.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Policy */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal Policy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              You may withdraw your items from auction at any time. However, if withdrawal occurs less than 2 weeks (14
              days) before the scheduled auction date, a withdrawal fee of 5% of the lower estimate will be applied.
            </p>
            <p>
              This policy helps us manage catalogue printing and marketing commitments. Please contact us if you have
              any questions about withdrawing an item.
            </p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
