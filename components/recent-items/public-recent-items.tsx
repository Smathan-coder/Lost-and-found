"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { dataService } from "@/lib/database/data-service"
import { authService } from "@/lib/database/auth-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ItemInteractionModal from "@/components/modals/item-interaction-modal"
import { MapPin, Calendar, MessageCircle, CheckCircle, Search } from "lucide-react"

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
  user_id: string
  profiles?: {
    full_name: string
  }
}

interface PublicRecentItemsProps {
  onItemClick?: (item: Item) => void
  limit?: number
  showHeader?: boolean
}

export default function PublicRecentItems({ onItemClick, limit = 10, showHeader = true }: PublicRecentItemsProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const result = await authService.getUser()
      setUser(result.data)
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        const result = await dataService.getItems({
          is_resolved: false,
          limit: limit
        })

        if (result.error) throw new Error(result.error)

        setItems(result.data || [])
      } catch (error) {
        console.error("Error fetching recent items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentItems()
  }, [limit])

  const handleItemClick = (item: Item) => {
    if (onItemClick) {
      onItemClick(item)
    } else {
      setSelectedItem(item)
      setIsModalOpen(true)
    }
  }

  const handleStartConversation = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      router.push("/auth/login")
      return
    }

    router.push(`/messages?user=${item.user_id}&item=${item.id}`)
  }

  const handleReportFound = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      router.push("/auth/login")
      return
    }

    router.push(`/report/found?reference=${item.id}`)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Search className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recent Items
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={showHeader ? "" : "pt-6"}>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recent items</h3>
              <p className="text-muted-foreground">Check back later for new lost and found items</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center gap-4 p-4 border rounded-xl touch-effect hover:bg-muted/50 transition-colors cursor-pointer"
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
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.date_lost_found).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {item.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{item.profiles?.full_name || "Anonymous"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === "lost" && user && item.user_id !== user.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleReportFound(item, e)}
                            className="text-xs touch-effect"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />I Found This
                          </Button>
                        )}

                        {user && item.user_id !== user.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleStartConversation(item, e)}
                            className="text-xs touch-effect"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ItemInteractionModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedItem(null)
        }}
        currentUser={user}
      />
    </>
  )
}
