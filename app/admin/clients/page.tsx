"use client"

import { useEffect, useState } from "react"
import { api, type Client } from "@/lib/api"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Mail, Phone, MapPin, User, CheckCircle, Filter, ShoppingBag, Gavel, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Extended Client Interface
interface ExtendedClient extends Client {
    title?: string
    first_name?: string
    last_name?: string
    bank_account_number?: string
    bank_sort_code?: string
    is_approved?: boolean
    items_bought?: number
    items_sold?: number
    total_spent?: number
    total_earned?: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ExtendedClient[]>([])
  const [filteredClients, setFilteredClients] = useState<ExtendedClient[]>([])
  
  const [searchQuery, setSearchQuery] = useState("")
  const [clientTypeFilter, setClientTypeFilter] = useState("all")
  
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [editingClient, setEditingClient] = useState<ExtendedClient | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    let result = clients

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQ) ||
          c.email.toLowerCase().includes(lowerQ) ||
          (c.phone && c.phone.includes(lowerQ))
      )
    }

    if (clientTypeFilter !== "all") {
      result = result.filter((c) => c.client_type === clientTypeFilter)
    }

    setFilteredClients(result)
  }, [searchQuery, clientTypeFilter, clients])

  const loadClients = async () => {
    try {
      const data = await api.getClients()
      setClients(data as ExtendedClient[])
      setFilteredClients(data as ExtendedClient[])
    } catch (error) {
      console.error("Failed to load clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (clientId: number) => {
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/clients/${clientId}/approve`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
          })
          if (res.ok) {
              toast({ title: "Client Approved" })
              loadClients()
          }
      } catch (e) {
          toast({ title: "Failed to approve", variant: "destructive" })
      }
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingClient) return

      try {
          const payload = {
              title: editingClient.title,
              first_name: editingClient.first_name,
              last_name: editingClient.last_name,
              email: editingClient.email,
              phone: editingClient.phone,
              address: editingClient.address,
              client_type: editingClient.client_type,
              bank_account_number: editingClient.bank_account_number,
              bank_sort_code: editingClient.bank_sort_code,
              is_approved: editingClient.is_approved
          }

          await api.updateClient(editingClient.id, payload)
          toast({ title: "Client updated successfully" })
          setEditingClient(null)
          loadClients()
      } catch (error) {
          toast({ title: "Failed to update client", variant: "destructive" })
      }
  }

  const handleDeleteClient = async () => {
      if (!deletingId) return
      try {
          await api.deleteClient(deletingId)
          toast({ title: "Client deleted successfully" })
          setDeletingId(null)
          loadClients()
      } catch (error) {
          toast({ title: "Failed to delete client", variant: "destructive" })
      }
  }

  const formatCurrency = (val?: number) => {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val || 0)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Client Records Management</h1>
        <p className="text-muted-foreground mt-1">Manage buyer and seller records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* <CardTitle className="hidden md:block">Client Records</CardTitle> */}
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Buyer">Buyer</SelectItem>
                  <SelectItem value="Seller">Seller</SelectItem>
                  <SelectItem value="Joint">Joint</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading clients...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact Details</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Banking</TableHead>
                  <TableHead>Approved?</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No clients found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{client.title} {client.first_name} {client.last_name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-6">ID: {client.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.client_type === "Seller" ? "default" : "secondary"}>
                          {client.client_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                          <div className="space-y-1 text-sm">
                              {(client.items_bought || 0) > 0 && (
                                  <div className="flex items-center text-green-700" title="Total Bought">
                                      <ShoppingBag className="h-3 w-3 mr-1" />
                                      <span className="font-medium">{client.items_bought}</span>
                                      <span className="text-muted-foreground ml-1">({formatCurrency(client.total_spent)})</span>
                                  </div>
                              )}
                              {(client.items_sold || 0) > 0 && (
                                  <div className="flex items-center text-blue-700" title="Total Sold">
                                      <Gavel className="h-3 w-3 mr-1" />
                                      <span className="font-medium">{client.items_sold}</span>
                                      <span className="text-muted-foreground ml-1">({formatCurrency(client.total_earned)})</span>
                                  </div>
                              )}
                              {!(client.items_bought || 0) && !(client.items_sold || 0) && (
                                  <span className="text-muted-foreground text-xs italic">-</span>
                              )}
                          </div>
                      </TableCell>
                      <TableCell>
                        {client.bank_sort_code ? (
                            <div className="text-xs">
                                <p>Sort: {client.bank_sort_code}</p>
                                <p>Acc: {client.bank_account_number}</p>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                          {client.is_approved ? (
                              <div className="flex items-center text-green-600 text-xs font-medium">
                                  <CheckCircle className="h-4 w-4 mr-1" /> Approved
                              </div>
                          ) : (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleApprove(client.id)}>
                                  Approve
                              </Button>
                          )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditingClient(client)}>
                              <Pencil className="mr-2 h-4 w-4 focus:text-foreground" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => setDeletingId(client.id)}
                                // className="text-red-600 focus:text-foreground"
                            >
                              <Trash2 className="mr-2 h-4 w-4 focus:text-foreground" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle text-foreground>Edit Client Record</DialogTitle>
          </DialogHeader>
          {editingClient && (
              <form onSubmit={handleUpdateClient} className="space-y-4 text-muted-foreground">
                  <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2 col-span-1">
                          <Label>Title</Label>
                          <Input value={editingClient.title || ""} onChange={e => setEditingClient({...editingClient, title: e.target.value})} />
                      </div>
                      <div className="space-y-2 col-span-1">
                          <Label>First Name</Label>
                          <Input value={editingClient.first_name || ""} onChange={e => setEditingClient({...editingClient, first_name: e.target.value})} />
                      </div>
                      <div className="space-y-2 col-span-2">
                          <Label>Surname</Label>
                          <Input value={editingClient.last_name || ""} onChange={e => setEditingClient({...editingClient, last_name: e.target.value})} />
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={editingClient.phone || ""} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} />
                      </div>
                  </div>

                  <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={editingClient.address || ""} onChange={e => setEditingClient({...editingClient, address: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                          <Label>Type</Label>
                          <Select value={editingClient.client_type} onValueChange={v => setEditingClient({...editingClient, client_type: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Buyer">Buyer</SelectItem>
                                  <SelectItem value="Seller">Seller</SelectItem>
                                  <SelectItem value="Joint">Joint</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label>Sort Code</Label>
                          <Input value={editingClient.bank_sort_code || ""} onChange={e => setEditingClient({...editingClient, bank_sort_code: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <Label>Account No</Label>
                          <Input value={editingClient.bank_account_number || ""} onChange={e => setEditingClient({...editingClient, bank_account_number: e.target.value})} />
                      </div>
                  </div>

                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEditingClient(null)}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                  </DialogFooter>
              </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client record and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}