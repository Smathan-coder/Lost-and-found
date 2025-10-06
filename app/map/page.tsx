"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import InteractiveMap from "@/components/map/interactive-map"
import { ArrowLeft, Search, Filter, MapPin } from "lucide-react"

interface Item {
  id: string
  title: string
  description: string
  category: string
  status: "lost" | "found"
  location: string
  date_lost_found: string
  contact_info: string
  image_url?: string
  is_resolved: boolean
  created_at: string
}

export default function MapPage() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const router = useRouter()
  const supabase = createClient()

  const categories = [
    "Electronics",
    "Jewelry",
    "Clothing",
    "Bags & Wallets",
    "Keys",
    "Documents",
    "Sports Equipment",
    "Toys",
    "Books",
    "Other",
  ]

  useEffect(() => {
    const fetchItems = async () => {
      const { data: itemsData } = await supabase
        .from("items")
        .select("*")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })

      setItems(itemsData || [])
      setFilteredItems(itemsData || [])
      setLoading(false)
    }

    fetchItems()
  }, [supabase])

  useEffect(() => {
    let filtered = items

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredItems(filtered)
  }, [items, statusFilter, categoryFilter, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-pulse-glow rounded-full bg-primary/20 p-8">
          <MapPin className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()} className="touch-effect">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Items Map</h1>
                <p className="text-sm text-muted-foreground">Explore lost and found items near you</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredItems.length} items
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 touch-effect rounded-xl"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="touch-effect rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="lost">Lost Items</SelectItem>
                      <SelectItem value="found">Found Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="touch-effect rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Stats */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lost Items</span>
                    <Badge variant="destructive" className="text-xs">
                      {items.filter((item) => item.status === "lost").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Found Items</span>
                    <Badge variant="default" className="text-xs">
                      {items.filter((item) => item.status === "found").length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Items List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredItems.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-xl touch-effect hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          <Badge variant={item.status === "lost" ? "destructive" : "default"} className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <InteractiveMap items={filteredItems} height="600px" />
          </div>
        </div>
      </div>
    </div>
  )
}
