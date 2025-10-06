"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, CheckCircle, X, MapPin, Calendar, User } from "lucide-react"

interface MatchCardProps {
  match: {
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
  currentUserId: string
  onStatusChange?: () => void
}

export default function MatchCard({ match, currentUserId, onStatusChange }: MatchCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const isOwnerOfLostItem = match.lost_item.user_id === currentUserId
  const otherItem = isOwnerOfLostItem ? match.found_item : match.lost_item
  const myItem = isOwnerOfLostItem ? match.lost_item : match.found_item

  const handleStatusUpdate = async (newStatus: "confirmed" | "rejected") => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("matches").update({ status: newStatus }).eq("id", match.id)

      if (error) throw error

      toast({
        title: newStatus === "confirmed" ? "Match confirmed!" : "Match rejected",
        description:
          newStatus === "confirmed"
            ? "You can now message the other user to arrange pickup."
            : "This match has been rejected.",
      })

      onStatusChange?.()
    } catch (error) {
      console.error("Error updating match status:", error)
      toast({
        title: "Error",
        description: "Failed to update match status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartConversation = async () => {
    // In a real implementation, this would create a conversation or navigate to messaging
    toast({
      title: "Feature coming soon!",
      description: "Direct messaging will be available in the next update.",
    })
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 dark:bg-green-950/20"
    if (score >= 60) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20"
    return "text-red-600 bg-red-50 dark:bg-red-950/20"
  }

  const getMatchScoreText = (score: number) => {
    if (score >= 80) return "High Match"
    if (score >= 60) return "Medium Match"
    return "Low Match"
  }

  return (
    <Card className="touch-effect hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(match.match_score)}`}>
              {getMatchScoreText(match.match_score)} ({match.match_score}%)
            </div>
            <Badge
              variant={
                match.status === "confirmed" ? "default" : match.status === "rejected" ? "destructive" : "secondary"
              }
            >
              {match.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">{new Date(match.created_at).toLocaleDateString()}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* My Item */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Your {myItem === match.lost_item ? "Lost" : "Found"} Item
            </div>
            <div className="flex gap-3">
              {myItem.image_url ? (
                <img
                  src={myItem.image_url || "/placeholder.svg"}
                  alt={myItem.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{myItem.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{myItem.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{myItem.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Other User's Item */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Potential {otherItem === match.lost_item ? "Lost" : "Found"} Item
            </div>
            <div className="flex gap-3">
              {otherItem.image_url ? (
                <img
                  src={otherItem.image_url || "/placeholder.svg"}
                  alt={otherItem.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{otherItem.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{otherItem.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{otherItem.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">Why this might be a match:</h5>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>
                Similar dates ({new Date(myItem.date_lost_found).toLocaleDateString()} vs{" "}
                {new Date(otherItem.date_lost_found).toLocaleDateString()})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>Similar locations</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {match.status === "pending" && (
            <>
              <Button
                onClick={() => handleStatusUpdate("confirmed")}
                disabled={isLoading}
                className="flex-1 touch-effect"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Match
              </Button>
              <Button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={isLoading}
                variant="outline"
                className="flex-1 touch-effect"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Not a Match
              </Button>
            </>
          )}
          {match.status === "confirmed" && (
            <Button onClick={handleStartConversation} className="flex-1 touch-effect" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message Owner
            </Button>
          )}
          {match.status === "rejected" && (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2">Match rejected</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
