const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface Auction {
  id: number
  title: string
  location: "London" | "Paris" | "New York"
  auction_date: string
  start_time: "9:30am" | "2:00pm" | "7:00pm"
  theme?: string
  auction_type: "Live" | "Online"
  status: "Upcoming" | "Completed" | "Cancelled"
  created_at: string
}

export interface Lot {
  id: number
  lot_reference: string
  auction_id?: number
  artist: string
  title: string
  category: string
  dimensions?: string
  framing_details?: string
  year_of_production?: number
  description?: string
  estimate_low: number
  estimate_high: number
  reserve_price: number
  sold_price?: number
  commission_bids: boolean
  triage_status: "Physical" | "Online"
  status: "Pending" | "Listed" | "Sold" | "Unsold" | "Withdrawn"
  withdrawal_fee: number
  seller_id?: number
  created_at: string
  images: Array<{
    id: number
    lot_id: number
    image_url: string
    thumbnail_url?: string
    is_primary: boolean
    display_order: number
  }>
  auction_title?: string
  auction_type?: string
  location?: string
  auction_date?: string
  start_time?: string
}

export interface CommissionResult {
  hammer_price: number
  buyers_premium: number
  total_buyer_pays: number
  sellers_commission: number
  total_seller_receives: number
}

export interface Client {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  client_type: "Buyer" | "Seller" | "Joint"
  is_staff: boolean
}

export const api = {
  // Auctions
  async getAuctions(params?: { status?: string }): Promise<Auction[]> {
    const query = new URLSearchParams(params as any).toString()
    const res = await fetch(`${API_BASE_URL}/api/auctions?${query}`)
    if (!res.ok) throw new Error("Failed to fetch auctions")
    return res.json()
  },

  async createAuction(auction: Omit<Auction, "id" | "created_at" | "status">): Promise<Auction> {
    const res = await fetch(`${API_BASE_URL}/api/auctions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auction),
    })
    if (!res.ok) throw new Error("Failed to create auction")
    return res.json()
  },

  async generateAuctionPDF(auctionId: number): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/api/auctions/${auctionId}/generate-pdf`, {
      method: "POST",
    })
    if (!res.ok) throw new Error("Failed to generate PDF")
    return res.blob()
  },

  // Lots
  async getLots(params?: {
    auction_id?: number
    status?: string
    artist?: string
    category?: string
  }): Promise<Lot[]> {
    const query = new URLSearchParams(params as any).toString()
    const res = await fetch(`${API_BASE_URL}/api/lots?${query}`)
    if (!res.ok) throw new Error("Failed to fetch lots")
    return res.json()
  },

  async getLot(id: number): Promise<Lot> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${id}`)
    if (!res.ok) throw new Error("Failed to fetch lot")
    return res.json()
  },

  async createLot(lot: Omit<Lot, "id" | "created_at" | "images" | "sold_price" | "withdrawal_fee">): Promise<Lot> {
    const res = await fetch(`${API_BASE_URL}/api/lots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lot),
    })
    if (!res.ok) throw new Error("Failed to create lot")
    return res.json()
  },

  async getSuggestedTriage(estimateLow: number): Promise<{ suggested_triage: string; reason: string }> {
    const res = await fetch(`${API_BASE_URL}/api/lots/suggest-triage?estimate_low=${estimateLow}`)
    if (!res.ok) throw new Error("Failed to get triage suggestion")
    return res.json()
  },

  async assignLotToAuction(lotId: number, auctionId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${lotId}/assign-auction?auction_id=${auctionId}`, {
      method: "PUT",
    })
    if (!res.ok) throw new Error("Failed to assign lot to auction")
  },

  async withdrawLot(lotId: number): Promise<{ message: string; withdrawal_fee: number }> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${lotId}/withdraw`, {
      method: "PUT",
    })
    if (!res.ok) throw new Error("Failed to withdraw lot")
    return res.json()
  },

  async uploadLotImage(lotId: number, file: File, isPrimary = false): Promise<{ url: string; thumbnail_url: string }> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("is_primary", String(isPrimary))

    const res = await fetch(`${API_BASE_URL}/api/lots/${lotId}/images`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error("Failed to upload image")
    return res.json()
  },

  async completeLotSale(
    lotId: number,
    hammerPrice: number,
    buyerId?: number,
  ): Promise<CommissionResult & { message: string }> {
    const res = await fetch(
      `${API_BASE_URL}/api/lots/${lotId}/complete-sale?hammer_price=${hammerPrice}${buyerId ? `&buyer_id=${buyerId}` : ""}`,
      {
        method: "POST",
      },
    )
    if (!res.ok) throw new Error("Failed to complete sale")
    return res.json()
  },

  // Commission Calculator
  async calculateCommission(hammerPrice: number): Promise<CommissionResult> {
    const res = await fetch(`${API_BASE_URL}/api/calculate-commission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hammer_price: hammerPrice }),
    })
    if (!res.ok) throw new Error("Failed to calculate commission")
    return res.json()
  },

  // Catalogue Search
  async searchCatalogue(params?: {
    q?: string
    location?: string
    auction_type?: string
    category?: string
    auction_date?: string
  }): Promise<Lot[]> {
    const query = new URLSearchParams(params as any).toString()
    const res = await fetch(`${API_BASE_URL}/api/catalogue/search?${query}`)
    if (!res.ok) throw new Error("Failed to search catalogue")
    return res.json()
  },

  async getCategories(): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/api/categories`)
    if (!res.ok) throw new Error("Failed to fetch categories")
    return res.json()
  },

  // Client Portal
  async getClientLots(clientId: number): Promise<Lot[]> {
    const res = await fetch(`${API_BASE_URL}/api/clients/${clientId}/lots`)
    if (!res.ok) throw new Error("Failed to fetch client lots")
    return res.json()
  },

  async getAuction(id: number): Promise<Auction> {
    const res = await fetch(`${API_BASE_URL}/api/auctions/${id}`)
    if (!res.ok) throw new Error("Failed to fetch auction")
    return res.json()
  },
}
