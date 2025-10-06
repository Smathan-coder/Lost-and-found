"use client"

import { useState, useEffect } from "react"
import { SearchBar } from "@/components/ui/search-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, User, MessageCircle, Zap, Target, Map } from "lucide-react"
import { PulseLoader } from "@/components/ui/pulse-loader"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  location: string
  date_lost_found: string
  status: "lost" | "found"
  image_url?: string
  user_id: string
  profiles?: {
    full_name: string
  }
  similarity_score?: number
  distance?: number
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [smartMatches, setSmartMatches] = useState<SearchResult[]>([])
  const [nearbyItems, setNearbyItems] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<any>({})
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const searchItems = async (searchQuery: string, searchFilters: any = {}) => {
    setLoading(true)
    try {
      let query = supabase
        .from("items")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq("is_resolved", false)

      // Text search with fuzzy matching
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`,
        )
      }

      // Category filter
      if (searchFilters.category) {
        query = query.eq("category", searchFilters.category)
      }

      // Status filter
      if (searchFilters.status) {
        query = query.eq("status", searchFilters.status)
      }

      // Time range filter
      if (searchFilters.timeRange) {
        const now = new Date()
        const startDate = new Date()

        switch (searchFilters.timeRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            break
          case "week":
            startDate.setDate(now.getDate() - 7)
            break
          case "month":
            startDate.setMonth(now.getMonth() - 1)
            break
        }

        query = query.gte("created_at", startDate.toISOString())
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50)

      if (error) throw error

      const processedResults = (data || []).map((item) => ({
        ...item,
        similarity_score: calculateSimilarityScore(item, searchQuery),
        distance: userLocation ? calculateDistance(userLocation, parseLocation(item.location)) : undefined,
      }))

      setResults(processedResults)

      generateSmartMatches(processedResults, searchQuery)

      if (userLocation) {
        const nearby = processedResults
          .filter((item) => item.distance && item.distance < 10) // Within 10km
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        setNearbyItems(nearby)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSimilarityScore = (item: any, searchQuery: string): number => {
    if (!searchQuery) return 0

    const query = searchQuery.toLowerCase()
    const title = item.title.toLowerCase()
    const description = item.description.toLowerCase()
    const category = item.category.toLowerCase()

    let score = 0

    // Exact matches get highest score
    if (title.includes(query)) score += 100
    if (description.includes(query)) score += 50
    if (category.includes(query)) score += 75

    // Partial matches
    const queryWords = query.split(" ")
    queryWords.forEach((word) => {
      if (word.length > 2) {
        if (title.includes(word)) score += 25
        if (description.includes(word)) score += 15
        if (category.includes(word)) score += 20
      }
    })

    // Boost recent items
    const daysSincePosted = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePosted < 7) score += 10

    return Math.min(score, 100)
  }

  const generateSmartMatches = (items: SearchResult[], searchQuery: string) => {
    const matches = items
      .filter((item) => item.similarity_score && item.similarity_score > 30)
      .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
      .slice(0, 10)

    setSmartMatches(matches)
  }

  const calculateDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number } | null): number => {
    if (!pos2) return Number.POSITIVE_INFINITY

    const R = 6371 // Earth's radius in km
    const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180
    const dLng = ((pos2.lng - pos1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pos1.lat * Math.PI) / 180) *
        Math.cos((pos2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const parseLocation = (location: string): { lat: number; lng: number } | null => {
    // In a real app, you'd use geocoding API
    // For demo, return random coordinates near major cities
    const cities: { [key: string]: { lat: number; lng: number } } = {
      "new york": { lat: 40.7128, lng: -74.006 },
      "los angeles": { lat: 34.0522, lng: -118.2437 },
      chicago: { lat: 41.8781, lng: -87.6298 },
      houston: { lat: 29.7604, lng: -95.3698 },
      phoenix: { lat: 33.4484, lng: -112.074 },
    }

    const cityKey = Object.keys(cities).find((city) => location.toLowerCase().includes(city))

    return cityKey ? cities[cityKey] : null
  }

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(location)
          searchItems(query, { ...filters, nearMe: true })
        },
        (error) => {
          console.error("Location error:", error)
        },
      )
    }
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    searchItems(searchQuery, filters)
  }

  const handleFilter = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    searchItems(query, updatedFilters)
  }

  const handleContact = (item: SearchResult) => {
    router.push(`/messages?contact=${item.user_id}&item=${item.id}`)
  }

  const renderItemCard = (item: SearchResult, index: number) => (
    <Card
      key={item.id}
      className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/80 backdrop-blur-sm animate-in slide-in-from-bottom"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <Badge variant={item.status === "lost" ? "destructive" : "default"}>
                {item.status === "lost" ? "Lost" : "Found"}
              </Badge>
              {item.similarity_score && item.similarity_score > 70 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Zap className="h-3 w-3 mr-1" />
                  High Match
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-3">{item.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {item.location}
                {item.distance && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                    {item.distance.toFixed(1)}km away
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(item.date_lost_found).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {item.profiles?.full_name || "Anonymous"}
              </div>
            </div>
          </div>

          {item.image_url && (
            <div className="ml-4">
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Badge variant="outline" className="capitalize">
              {item.category}
            </Badge>
            {item.similarity_score && (
              <Badge variant="outline" className="text-xs">
                {item.similarity_score}% match
              </Badge>
            )}
          </div>
          <Button onClick={() => handleContact(item)} className="touch-effect">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  useEffect(() => {
    // Load initial results
    searchItems("")
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 pt-8 animate-slide-up">
          <h1 className="text-3xl font-bold">Smart Search</h1>
          <p className="text-muted-foreground">AI-powered matching to find lost items faster</p>
        </div>

        {/* Search Bar */}
        <div className="animate-in slide-in-from-top duration-500">
          <SearchBar
            onSearch={handleSearch}
            onFilter={handleFilter}
            onLocationSearch={handleLocationSearch}
            placeholder="Search for items, descriptions, or locations..."
          />
        </div>

        {/* Search Results with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="touch-effect">
              All Results ({results.length})
            </TabsTrigger>
            <TabsTrigger value="smart" className="touch-effect">
              <Zap className="h-4 w-4 mr-2" />
              Smart Matches ({smartMatches.length})
            </TabsTrigger>
            <TabsTrigger value="nearby" className="touch-effect">
              <Map className="h-4 w-4 mr-2" />
              Nearby ({nearbyItems.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="touch-effect">
              <Calendar className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <PulseLoader />
              </div>
            ) : results.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No items found. Try adjusting your search.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">{results.map((item, index) => renderItemCard(item, index))}</div>
            )}
          </TabsContent>

          <TabsContent value="smart" className="space-y-4">
            {smartMatches.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Smart Matches
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Enter a search query to see AI-powered matches</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      AI-Powered Smart Matches
                    </CardTitle>
                  </CardHeader>
                </Card>
                <div className="grid gap-4">{smartMatches.map((item, index) => renderItemCard(item, index))}</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="nearby" className="space-y-4">
            {!userLocation ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Nearby Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Enable location to see nearby items</p>
                  <Button onClick={handleLocationSearch} className="touch-effect">
                    <MapPin className="h-4 w-4 mr-2" />
                    Enable Location
                  </Button>
                </CardContent>
              </Card>
            ) : nearbyItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No items found nearby</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5 text-blue-500" />
                      Items Near You
                    </CardTitle>
                  </CardHeader>
                </Card>
                <div className="grid gap-4">{nearbyItems.map((item, index) => renderItemCard(item, index))}</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="grid gap-4">
              {results
                .filter((item) => {
                  const daysSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
                  return daysSince <= 7
                })
                .map((item, index) => renderItemCard(item, index))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
