"use client"

import { useEffect, useState } from "react"
import { api, type Auction, type Lot } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Calendar, TrendingUp, AlertCircle } from "lucide-react"

export default function AdminDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getAuctions(), api.getLots()])
      .then(([auctionsData, lotsData]) => {
        setAuctions(auctionsData)
        setLots(lotsData)
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    totalLots: lots.length,
    listedLots: lots.filter((l) => l.status === "Listed").length,
    pendingLots: lots.filter((l) => l.status === "Pending").length,
    upcomingAuctions: auctions.filter((a) => new Date(a.auction_date) > new Date()).length,
    totalEstimate: lots.reduce((sum, lot) => sum + lot.estimate_high, 0),
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to the Fotherby&apos;s RMS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Lots</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLots}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.listedLots} listed, {stats.pendingLots} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Auctions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAuctions}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Estimate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(stats.totalEstimate / 1000).toFixed(0)}k</div>
            <p className="text-xs text-muted-foreground mt-1">High estimates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLots}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lots */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lots</CardTitle>
          <CardDescription>Latest items added to inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lots.slice(0, 5).map((lot) => (
              <div
                key={lot.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{lot.artist}</p>
                  <p className="text-sm text-muted-foreground italic">{lot.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lot.lot_reference}</p>
                </div>
                <div className="text-right">
                  <Badge variant={lot.status === "Listed" ? "default" : "secondary"}>{lot.status}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    £{lot.estimate_low.toLocaleString()} - £{lot.estimate_high.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Auctions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Auctions</CardTitle>
          <CardDescription>Scheduled auction events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auctions
              .filter((a) => new Date(a.auction_date) > new Date())
              .slice(0, 3)
              .map((auction) => (
                <div
                  key={auction.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{auction.title}</p>
                    <p className="text-sm text-muted-foreground">{auction.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(auction.auction_date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{auction.start_time}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
