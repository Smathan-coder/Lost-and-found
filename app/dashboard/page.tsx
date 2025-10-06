"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/database/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  User,
  LogOut,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Map,
  Target,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface Profile {
  id: string
  full_name: string
  phone?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState<Item[]>([])

  const router = useRouter()
  const { toast } = useToast()
  const dbClient = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: authData, error } = await dbClient.auth.getUser()
        if (error || !authData?.user) {
          router.push("/auth/login")
          return
        }
        const user = authData.user
        setUser(user)

        // Get user profile
        const profileResult = await dbClient.from("profiles").eq("id", user.id).single().execute()
        setProfile(profileResult.data)

        // Get user's items
        const itemsResult = await dbClient
          .from("items")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .execute()

        setItems(itemsResult.data || [])

        // Get all items for map view
        const allItemsResult = await dbClient
          .from("items")
          .eq("is_resolved", false)
          .order("created_at", { ascending: false })
          .execute()

        setAllItems(allItemsResult.data || [])

        // Get match count
        const matchesResult = await dbClient
          .from("matches")
          .or(`user_id.eq.${user.id},user_id.eq.${user.id}`)
          .eq("status", "pending")
          .execute()

        setMatchCount(matchesResult.count || 0)

        // Get unread message count
        const messagesResult = await dbClient
          .from("messages")
          .eq("receiver_id", user.id)
          .eq("is_read", false)
          .execute()

        setMessageCount(messagesResult.count || 0)

        setLoading(false)
      } catch (error) {
        console.error('Dashboard error:', error)
        router.push("/auth/login")
      }
    }

    getUser()
  }, [router])

  useEffect(() => {
    setFilteredItems(items)
  }, [items])

  const handleSignOut = async () => {
    await dbClient.auth.signOut()
    router.push("/")
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredItems(items)
      return
    }

    const filtered = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()),
    )
    setFilteredItems(filtered)
  }

  const handleFilter = (filters: any) => {
    let filtered = items

    if (filters.category) {
      filtered = filtered.filter((item) => item.category === filters.category)
    }

    if (filters.timeRange) {
      const now = new Date()
      const startDate = new Date()

      switch (filters.timeRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0)
          break
        case "week":
          startDate.setDate(now.getDate() - 7)
          break
      }

      filtered = filtered.filter((item) => new Date(item.created_at) >= startDate)
    }

    setFilteredItems(filtered)
  }

  const lostItems = items.filter((item) => item.status === "lost")
  const foundItems = items.filter((item) => item.status === "found")
  const resolvedItems = items.filter((item) => item.is_resolved)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-pulse-glow rounded-full bg-primary/20 p-8">
          <Search className="h-8 w-8 text-primary animate-spin" />
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
              <div className="bg-primary/10 p-2 rounded-xl">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Lost & Found</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/search")} className="touch-effect">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/matches")} className="touch-effect">
                <Target className="h-4 w-4 mr-2" />
                Matches
                {matchCount > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {matchCount}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/messages")} className="touch-effect">
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
                {messageCount > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {messageCount}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/map")} className="touch-effect">
                <Map className="h-4 w-4 mr-2" />
                Map
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/report/lost")} className="touch-effect">
                <AlertCircle className="h-4 w-4 mr-2" />
                Report Lost
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/report/found")} className="touch-effect">
                <CheckCircle className="h-4 w-4 mr-2" />
                Report Found
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="touch-effect">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
            <TabsTrigger value="overview" className="touch-effect">
              <Search className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" className="touch-effect">
              <Plus className="h-4 w-4 mr-2" />
              My Items
            </TabsTrigger>
            <TabsTrigger value="map" className="touch-effect">
              <Map className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
            <TabsTrigger value="messages" className="touch-effect">
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
              {messageCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {messageCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="touch-effect">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-slide-up">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="touch-effect hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-destructive/10 p-2 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{lostItems.length}</p>
                      <p className="text-sm text-muted-foreground">Lost Items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="touch-effect hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{foundItems.length}</p>
                      <p className="text-sm text-muted-foreground">Found Items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="touch-effect hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent/10 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{resolvedItems.length}</p>
                      <p className="text-sm text-muted-foreground">Resolved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="touch-effect hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push("/matches")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-950/20 p-2 rounded-lg">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{matchCount}</p>
                      <p className="text-sm text-muted-foreground">Matches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="touch-effect hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push("/messages")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-950/20 p-2 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{messageCount}</p>
                      <p className="text-sm text-muted-foreground">Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Items */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Items</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items yet</h3>
                    <p className="text-muted-foreground mb-4">Start by reporting a lost or found item</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => router.push("/report/lost")} className="touch-effect">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Report Lost Item
                      </Button>
                      <Button onClick={() => router.push("/report/found")} variant="outline" className="touch-effect">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Report Found Item
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border rounded-xl touch-effect hover:bg-muted/50 transition-colors"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Search className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge variant={item.status === "lost" ? "destructive" : "default"}>{item.status}</Badge>
                            {item.is_resolved && <Badge variant="secondary">Resolved</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.date_lost_found).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Items Tab */}
          <TabsContent value="items" className="space-y-6 animate-slide-up">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Items</h2>
                <div className="flex gap-2">
                  <Button onClick={() => router.push("/report/lost")} className="touch-effect">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Report Lost
                  </Button>
                  <Button onClick={() => router.push("/report/found")} variant="outline" className="touch-effect">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Report Found
                  </Button>
                </div>
              </div>

              <div className="animate-in slide-in-from-top duration-300">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search your items..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {searchQuery ? "No matching items found" : "No items reported yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? "Try adjusting your search terms or filters"
                      : "Get started by reporting your first lost or found item"}
                  </p>
                  {!searchQuery && (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => router.push("/report/lost")} className="touch-effect">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Report Lost Item
                      </Button>
                      <Button onClick={() => router.push("/report/found")} variant="outline" className="touch-effect">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Report Found Item
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredItems.map((item, index) => (
                  <Card
                    key={item.id}
                    className="touch-effect hover:shadow-lg transition-all animate-in slide-in-from-bottom duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {item.image_url ? (
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.title}
                            className="w-24 h-24 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center">
                            <Search className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{item.title}</h3>
                            <Badge variant={item.status === "lost" ? "destructive" : "default"}>{item.status}</Badge>
                            {item.is_resolved && <Badge variant="secondary">Resolved</Badge>}
                          </div>
                          <p className="text-muted-foreground mb-4">{item.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{item.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(item.date_lost_found).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{item.category}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{item.contact_info}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Items Map</h2>
                <p className="text-muted-foreground">Explore all lost and found items in your area</p>
              </div>
              <Button onClick={() => router.push("/map")} variant="outline" className="touch-effect">
                <Map className="h-4 w-4 mr-2" />
                Full Screen Map
              </Button>
            </div>
            <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Interactive map will be displayed here</p>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Messages
                  <Button onClick={() => router.push("/messages")} variant="outline" size="sm" className="touch-effect">
                    View All Messages
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {messageCount > 0 ? `You have ${messageCount} unread messages` : "No messages yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {messageCount > 0
                      ? "Click 'View All Messages' to see your conversations"
                      : "Messages from other users will appear here when they contact you about your items"}
                  </p>
                  <Button onClick={() => router.push("/messages")} className="touch-effect">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Go to Messages
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{profile?.full_name || "User"}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-xl">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  {profile?.phone && (
                    <div className="flex items-center gap-3 p-4 border rounded-xl">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-4 border rounded-xl">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Member Since</p>
                      <p className="text-sm text-muted-foreground">{new Date(user?.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full touch-effect bg-transparent" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
