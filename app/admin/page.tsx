"use client"

import { useEffect, useState } from "react"
import { api, type Auction, type Lot } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Clock, ArrowRight, Gavel, Users, Package, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLots: 0,
    pendingLots: 0,
    totalAuctions: 0,
    upcomingAuctions: 0,
    totalClients: 0
  })
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [recentLots, setRecentLots] = useState<Lot[]>([])
  
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [lots, auctionsData, clients] = await Promise.all([
        api.getLots(),
        api.getAuctions(),
        api.getClients().catch(() => []) 
      ])

      setStats({
        totalLots: lots.length,
        pendingLots: lots.filter(l => l.status === "Pending").length,
        totalAuctions: auctionsData.length,
        upcomingAuctions: auctionsData.filter(a => a.status === "Upcoming").length,
        totalClients: clients.length
      })

      setAuctions(auctionsData)
      setRecentLots(lots.slice(0, 5))
    } catch (error) {
      console.error("Failed to load dashboard data", error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    let startDay = firstDay.getDay() - 1
    if (startDay === -1) startDay = 6

    return { daysInMonth, startDay, month, year }
  }

  const { daysInMonth, startDay, month, year } = getDaysInMonth(currentDate)

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setCurrentDate(newDate)
  }

  const setMonth = (monthIndex: string) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(parseInt(monthIndex))
    setCurrentDate(newDate)
  }

  const setYear = (yearStr: string) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(parseInt(yearStr))
    setCurrentDate(newDate)
  }

  const isSameDay = (date1: Date, day: number) => {
      return date1.getDate() === day && 
             date1.getMonth() === currentDate.getMonth() && 
             date1.getFullYear() === currentDate.getFullYear()
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of auction house activity</p>
      </div>

      {/*  STATS CARDS  */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lots</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLots}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingLots} pending review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Auctions</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAuctions}</div>
            <p className="text-xs text-muted-foreground">Upcoming events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Base</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        
        {/* CALENDAR */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
            <div className="space-y-1 text-center sm:text-left">
                <CardTitle>Auction Calendar</CardTitle>
                <CardDescription>Schedule for {monthNames[month]} {year}</CardDescription>
            </div>
            
            {/* Calendar Controls */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex gap-1">
                    <Select value={month.toString()} onValueChange={setMonth}>
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue>{monthNames[month]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {monthNames.map((m, i) => (
                                <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={year.toString()} onValueChange={setYear}>
                        <SelectTrigger className="w-[90px] h-9">
                            <SelectValue>{year}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 border-b text-center text-xs font-semibold text-muted-foreground bg-muted/30 py-2">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
                <div>SUN</div>
            </div>

            {/* Calendar Grid Body */}
            <div className="grid grid-cols-7 grid-rows-5 h-[500px]">
                
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-b border-r bg-muted/5"></div>
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dayAuctions = auctions.filter(a => {
                        const aDate = new Date(a.auction_date)
                        return isSameDay(aDate, day)
                    })

                    return (
                        <div key={`day-${day}`} className="border-b border-r p-2 min-h-[100px] relative group hover:bg-muted/5 transition-colors">
                            {/* Date Number */}
                            <span className={`text-xs font-semibold block mb-1 ${
                                isSameDay(new Date(), day) ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center" : "text-muted-foreground"
                            }`}>
                                {day}
                            </span>

                            {/* Event Cards */}
                            <div className="space-y-1">
                                {dayAuctions.map(auction => (
                                    <div key={auction.id} className="bg-primary/10 border-l-2 border-primary p-1.5 rounded text-[10px] shadow-sm hover:shadow-md transition-all cursor-pointer">
                                        <div className="font-semibold text-primary truncate" title={auction.title}>
                                            {auction.title}
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                                            <Clock className="h-3 w-3" />
                                            {auction.start_time}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground/70 truncate mt-0.5">
                                            {auction.location}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
                
                {Array.from({ length: 42 - (daysInMonth + startDay) }).map((_, i) => (
                    <div key={`end-empty-${i}`} className="border-b border-r bg-muted/5"></div>
                ))}


            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Recent Lots</CardTitle>
            <CardDescription>Latest inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLots.map((lot) => (
                <div key={lot.id} className="flex items-center gap-3 border-b last:border-0 pb-3 last:pb-0">
                  <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0 border">
                     {lot.images?.[0] ? (
                         <img src={lot.images[0].thumbnail_url} alt={lot.title} className="w-full h-full object-cover" />
                     ) : (
                         <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground text-[10px]">IMG</div>
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lot.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate max-w-[80px]">{lot.artist}</p>
                        <Badge variant={lot.status === 'Sold' ? 'secondary' : 'outline'} className="text-[9px] h-4 px-1">
                            {lot.status}
                        </Badge>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs text-muted-foreground mt-2" asChild>
                  <Link href="/admin/lots">View All Lots <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}