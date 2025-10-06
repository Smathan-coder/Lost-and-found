"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import MatchCard from "@/components/matching/match-card"
import { ArrowLeft, Search, CheckCircle, Clock, X } from "lucide-react"

interface Match {
  id: string
  lost_item: {
    id: string
    title: string
    description: string
    location: string
    date_lost_found: string
    image_url?: string
    user_id: string
  }
  found_item: {
    id: string
    title: string
    description: string
    location: string
    date_lost_found: string
    image_url?: string
    user_id: string
  }
  match_score: number
  status: "pending" | "confirmed" | "rejected"
  created_at: string
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("pending")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
      await fetchMatches(user.id)
    }

    getUser()
  }, [supabase, router])

  const fetchMatches = async (userId: string) => {
    try {
      // First get all item IDs that belong to the user
      const { data: userItems, error: itemsError } = await supabase.from("items").select("id").eq("user_id", userId)

      if (itemsError) throw itemsError

      const userItemIds = userItems?.map((item) => item.id) || []

      if (userItemIds.length === 0) {
        setMatches([])
        return
      }

      // Get matches where user owns either the lost or found item
      const { data: matchesData, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          lost_item:items!matches_lost_item_id_fkey(*),
          found_item:items!matches_found_item_id_fkey(*)
        `,
        )
        .or(`lost_item_id.in.(${userItemIds.join(",")}),found_item_id.in.(${userItemIds.join(",")})`)
        .order("created_at", { ascending: false })

      if (error) throw error

      setMatches(matchesData || [])
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMatchStatusChange = () => {
    if (user) {
      fetchMatches(user.id)
    }
  }

  const pendingMatches = matches.filter((match) => match.status === "pending")
  const confirmedMatches = matches.filter((match) => match.status === "confirmed")
  const rejectedMatches = matches.filter((match) => match.status === "rejected")

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
              <Button variant="ghost" onClick={() => router.back()} className="touch-effect">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Potential Matches</h1>
                <p className="text-sm text-muted-foreground">Review potential matches for your items</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {matches.length} total matches
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3">
            <TabsTrigger value="pending" className="touch-effect">
              <Clock className="h-4 w-4 mr-2" />
              Pending ({pendingMatches.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="touch-effect">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmed ({confirmedMatches.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="touch-effect">
              <X className="h-4 w-4 mr-2" />
              Rejected ({rejectedMatches.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Matches */}
          <TabsContent value="pending" className="space-y-6 animate-slide-up">
            {pendingMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No pending matches</h3>
                  <p className="text-muted-foreground">
                    We'll notify you when potential matches are found for your items
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    currentUserId={user?.id}
                    onStatusChange={handleMatchStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Confirmed Matches */}
          <TabsContent value="confirmed" className="space-y-6 animate-slide-up">
            {confirmedMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No confirmed matches</h3>
                  <p className="text-muted-foreground">Confirmed matches will appear here for easy access</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {confirmedMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    currentUserId={user?.id}
                    onStatusChange={handleMatchStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rejected Matches */}
          <TabsContent value="rejected" className="space-y-6 animate-slide-up">
            {rejectedMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <X className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No rejected matches</h3>
                  <p className="text-muted-foreground">Matches you've rejected will appear here for reference</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rejectedMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    currentUserId={user?.id}
                    onStatusChange={handleMatchStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
