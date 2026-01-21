const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper to get headers with Auth token
const getAuthHeaders = (isMultipart = false) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  const headers: HeadersInit = {}
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  if (!isMultipart) {
    headers["Content-Type"] = "application/json"
  }
  
  return headers
}

export interface Auction {
  id: number
  title: string
  location: "London" | "Paris" | "New York"
  auction_date: string
  start_time: "9:30am" | "2:00pm" | "7:00pm"
  theme?: string
  auction_type: "Physical" | "Online"
  status: "Upcoming" | "Completed" | "Cancelled"
  created_at: string
  is_archived?: boolean
}

export interface Lot {
  id: number
  lot_reference: string
  auction_id?: number
  artist: string
  title: string
  category: string
  dimensions?: string
  subcategory?: string
  subject?: string
  framing_details?: string
  year_of_production?: number
  description?: string
  estimate_low: number
  estimate_high: number
  reserve_price: number
  sold_price?: number
  commission_bids: boolean
  triage_status: "Physical" | "Online"
  status: "Pending" | "Listed" | "Sold" | "Unsold" | "Withdrawn" | "Archived" | "Submitted"  
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
  medium?: string
  material?: string
  weight?: number
  height?: number
  width?: number
  depth?: number
  is_framed?: boolean
  provenance?: string
  is_authenticated?: boolean
  client_signature?: string
  client_signed_date?: string
  expert_name?: string
  expert_notes?: string
  requested_time_frame?: string
  expert_signature?: string
  expert_signed_date?: string
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
  async getAuctions(params?: { status?: string, archived_only?: boolean }): Promise<Auction[]> {
    const query = new URLSearchParams(params as any).toString()
    const res = await fetch(`${API_BASE_URL}/api/auctions?${query}`, {
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error("Failed to fetch auctions")
    return res.json()
  },

  async createAuction(auction: Omit<Auction, "id" | "created_at" | "status">): Promise<Auction> {
    const res = await fetch(`${API_BASE_URL}/api/auctions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(auction),
    })
    if (!res.ok) throw new Error("Failed to create auction")
    return res.json()
  },

  async updateAuction(id: number, auction: Partial<Auction>): Promise<Auction> {
    const res = await fetch(`${API_BASE_URL}/api/auctions/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(auction),
    })
    if (!res.ok) throw new Error("Failed to update auction")
    return res.json()
  },

  async deleteAuction(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/auctions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete auction")
    }
  },

  async archiveAuction(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/auctions/${id}/archive`, {
      method: "PUT",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to archive auction")
  },

  async unarchiveAuction(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/auctions/${id}/unarchive`, {
      method: "PUT",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to restore auction")
  },

  async generateAuctionPDF(auctionId: number): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/api/auctions/${auctionId}/generate-pdf`, {
      method: "POST",
      headers: getAuthHeaders(),
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
    archived_only?: boolean
  }): Promise<Lot[]> {
    const query = new URLSearchParams(params as any).toString()
    const res = await fetch(`${API_BASE_URL}/api/lots?${query}`, {
       headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error("Failed to fetch lots")
    return res.json()
  },

  async getLot(id: number): Promise<Lot> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${id}`, {
       headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error("Failed to fetch lot")
    return res.json()
  },

  async createLot(lot: Omit<Lot, "id" | "created_at" | "images" | "sold_price" | "withdrawal_fee">): Promise<Lot> {
    const res = await fetch(`${API_BASE_URL}/api/lots`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(lot),
    })
    if (!res.ok) throw new Error("Failed to create lot")
    return res.json()
  },

  async updateLot(id: number, lot: Partial<Lot>): Promise<Lot> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(lot),
    })
    if (!res.ok) throw new Error("Failed to update lot")
    return res.json()
  },

  async deleteLot(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to delete lot")
  },

  async archiveLot(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${id}/archive`, {
      method: "PUT",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to archive lot")
  },

  async unarchiveLot(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${id}/unarchive`, {
      method: "PUT",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to restore lot")
  },

  async getSuggestedTriage(estimateLow: number): Promise<{ suggested_triage: string; reason: string }> {
    const cleanEstimate = String(estimateLow).replace(/,/g, '');
    const res = await fetch(`${API_BASE_URL}/api/lots/suggest-triage?estimate_low=${cleanEstimate}`)
    
    if (!res.ok) {
        console.error("Failed to get triage suggestion, falling back to default");
        return { suggested_triage: "Physical", reason: "Could not fetch suggestion" };
    }
    return res.json()
  },

  async assignLotToAuction(lotId: number, auctionId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${lotId}/assign-auction?auction_id=${auctionId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to assign lot to auction")
  },

  async withdrawLot(lotId: number): Promise<{ message: string; withdrawal_fee: number }> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${lotId}/withdraw`, {
      method: "PUT",
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(true),
      body: formData,
    })
    if (!res.ok) throw new Error("Failed to upload image")
    return res.json()
  },

  async deleteLotImage(imageId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/lots/images/${imageId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to delete image")
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
        headers: getAuthHeaders(),
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
    subcategory?: string
    auction_date?: string
    auction_id?: string 
    subject?: string
    min_estimate?: number
    max_estimate?: number
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

  async getSubcategories(category?: string): Promise<string[]> {
    const url = category 
        ? `${API_BASE_URL}/api/subcategories?category=${encodeURIComponent(category)}`
        : `${API_BASE_URL}/api/subcategories`
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch subcategories")
    return res.json()
  },

  // Client Portal
  async getClientLots(clientId: number): Promise<Lot[]> {
    const res = await fetch(`${API_BASE_URL}/api/clients/${clientId}/lots`, {
        headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error("Failed to fetch client lots")
    return res.json()
  },

  async getAuction(id: number): Promise<Auction> {
    const res = await fetch(`${API_BASE_URL}/api/auctions/${id}`)
    if (!res.ok) throw new Error("Failed to fetch auction")
    return res.json()
  },

  async getClients(): Promise<Client[]> {
    const res = await fetch(`${API_BASE_URL}/api/clients`, {
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error("Failed to fetch clients")
    return res.json()
  },

  async updateClient(id: number, data: Partial<Client>): Promise<Client> {
    const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update client")
    return res.json()
  },

  async deleteClient(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to delete client")
  },

  async placeBid(lotId: number, amount: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${lotId}/bid`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ lot_id: lotId, bid_amount: amount }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || "Failed to place bid")
    }
    return res.json()
  },
  
  async getAuctionLog(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/admin/auction-log`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch log")
    return res.json()
  },

  async getLotBids(lotId: number): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/lots/${lotId}/bids`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch bids")
    return res.json()
  },
}