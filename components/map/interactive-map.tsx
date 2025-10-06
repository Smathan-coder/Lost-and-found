"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ItemInteractionModal from "@/components/modals/item-interaction-modal"
import { MapPin, Navigation, Maximize2, Minimize2, MessageCircle, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface MapItem {
  id: string
  title: string
  description: string
  status: "lost" | "found"
  location: string
  latitude?: number
  longitude?: number
  category: string
  date_lost_found: string
  image_url?: string
  user_id: string
  profiles?: {
    full_name: string
  }
}

interface MapUser {
  id: string
  full_name: string
  location?: string
  latitude?: number
  longitude?: number
  last_active?: string
}

interface InteractiveMapProps {
  items: MapItem[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  showControls?: boolean
  showUsers?: boolean
}

export default function InteractiveMap({
  items,
  center = { lat: 40.7128, lng: -74.006 },
  zoom = 12,
  height = "400px",
  showControls = true,
  showUsers = true,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null)
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [nearbyUsers, setNearbyUsers] = useState<MapUser[]>([])
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Suppress ResizeObserver loop errors
  useEffect(() => {
    const resizeObserverErrorHandler = (e: ErrorEvent) => {
      if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
        e.stopImmediatePropagation()
        return false
      }
    }

    window.addEventListener("error", resizeObserverErrorHandler)

    return () => {
      window.removeEventListener("error", resizeObserverErrorHandler)
    }
  }, [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [supabase])

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log("Location access denied:", error)
        },
      )
    }
  }, [])

  useEffect(() => {
    const fetchNearbyUsers = async () => {
      if (!showUsers || !currentUser) return

      try {
        // Get users who have recent activity (posted items in the last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: activeUsers, error } = await supabase
          .from("items")
          .select(`
            user_id,
            location,
            created_at,
            profiles:user_id (
              full_name
            )
          `)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .neq("user_id", currentUser.id)

        if (error) throw error

        // Group by user and get their most recent location
        const userMap = new Map<string, MapUser>()
        activeUsers?.forEach((item: any) => {
          if (
            !userMap.has(item.user_id) ||
            new Date(item.created_at) > new Date(userMap.get(item.user_id)!.last_active!)
          ) {
            userMap.set(item.user_id, {
              id: item.user_id,
              full_name: item.profiles?.full_name || "Anonymous",
              location: item.location,
              last_active: item.created_at,
            })
          }
        })

        setNearbyUsers(Array.from(userMap.values()))
      } catch (error) {
        console.error("Error fetching nearby users:", error)
      }
    }

    fetchNearbyUsers()
  }, [supabase, currentUser, showUsers])

  // Generate mock coordinates for items based on location string
  const getCoordinatesFromLocation = (location: string, index: number) => {
    const hash = location.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return {
      lat: center.lat + Math.sin(hash + index) * 0.05,
      lng: center.lng + Math.cos(hash + index) * 0.05,
    }
  }

  const itemsWithCoords = items.map((item, index) => ({
    ...item,
    coordinates: getCoordinatesFromLocation(item.location, index),
  }))

  const usersWithCoords = nearbyUsers.map((user, index) => ({
    ...user,
    coordinates: getCoordinatesFromLocation(user.location || "Unknown", index + 1000),
  }))

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const centerOnUserLocation = () => {
    if (userLocation) {
      console.log("Centering on user location:", userLocation)
    }
  }

  const handleItemClick = (item: MapItem) => {
    setSelectedItem(item)
    setSelectedUser(null)
    setIsItemModalOpen(true)
  }

  const handleUserClick = (user: MapUser) => {
    setSelectedUser(user)
    setSelectedItem(null)
  }

  const handleStartConversationWithUser = () => {
    if (selectedUser && currentUser) {
      router.push(`/messages?user=${selectedUser.id}`)
    }
  }

  const mapHeight = isFullscreen ? "100vh" : height

  return (
    <>
      <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
        <Card className={`${isFullscreen ? "h-full border-0 rounded-none" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Items Map
              {showUsers && (
                <Badge variant="outline" className="ml-2">
                  {nearbyUsers.length} active users
                </Badge>
              )}
            </CardTitle>
            {showControls && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={centerOnUserLocation}
                  className="touch-effect bg-transparent"
                  disabled={!userLocation}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFullscreen} className="touch-effect bg-transparent">
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={mapRef}
              className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 overflow-hidden"
              style={{
                height: mapHeight,
                paddingTop: isFullscreen ? "0" : undefined,
              }}
            >
              {/* Map Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" className="absolute inset-0">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Street-like lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <line x1="0" y1="30%" x2="100%" y2="35%" stroke="currentColor" strokeWidth="2" />
                <line x1="0" y1="60%" x2="100%" y2="55%" stroke="currentColor" strokeWidth="2" />
                <line x1="20%" y1="0" x2="25%" y2="100%" stroke="currentColor" strokeWidth="2" />
                <line x1="70%" y1="0" x2="75%" y2="100%" stroke="currentColor" strokeWidth="2" />
              </svg>

              {/* User Location Marker */}
              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                    <div className="absolute inset-0 w-4 h-4 bg-blue-500/30 rounded-full animate-ping" />
                  </div>
                </div>
              )}

              {showUsers &&
                usersWithCoords.map((user, index) => {
                  const x = ((user.coordinates.lng - center.lng + 0.1) / 0.2) * 100
                  const y = ((center.lat - user.coordinates.lat + 0.1) / 0.2) * 100

                  return (
                    <div
                      key={user.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-15 touch-effect"
                      style={{
                        left: `${Math.max(5, Math.min(95, x))}%`,
                        top: `${Math.max(5, Math.min(95, y))}%`,
                      }}
                      onClick={() => handleUserClick(user)}
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8 border-2 border-white shadow-lg hover:scale-110 transition-transform">
                          <AvatarFallback className="bg-green-500 text-white text-xs">
                            {user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {selectedUser?.id === user.id && (
                          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-48 z-30">
                            <Card className="shadow-xl border-2 animate-slide-up">
                              <CardContent className="p-3">
                                <div className="text-center space-y-2">
                                  <Avatar className="h-12 w-12 mx-auto">
                                    <AvatarFallback className="bg-green-500 text-white">
                                      {user.full_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold text-sm">{user.full_name}</h4>
                                    <p className="text-xs text-muted-foreground">Active in {user.location}</p>
                                  </div>
                                  {currentUser && (
                                    <Button
                                      size="sm"
                                      onClick={handleStartConversationWithUser}
                                      className="w-full text-xs"
                                    >
                                      <MessageCircle className="h-3 w-3 mr-1" />
                                      Start Chat
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

              {/* Item Markers */}
              {itemsWithCoords.map((item, index) => {
                const x = ((item.coordinates.lng - center.lng + 0.1) / 0.2) * 100
                const y = ((center.lat - item.coordinates.lat + 0.1) / 0.2) * 100

                return (
                  <div
                    key={item.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 touch-effect"
                    style={{
                      left: `${Math.max(5, Math.min(95, x))}%`,
                      top: `${Math.max(5, Math.min(95, y))}%`,
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="relative">
                      <div
                        className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                          item.status === "lost"
                            ? "bg-destructive hover:bg-destructive/80"
                            : "bg-primary hover:bg-primary/80"
                        } transition-colors`}
                      >
                        <MapPin className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full" />
                    <span>Lost Items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span>Found Items</span>
                  </div>
                  {showUsers && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-3 w-3">
                        <AvatarFallback className="bg-green-500 text-white text-xs">
                          <User className="h-2 w-2" />
                        </AvatarFallback>
                      </Avatar>
                      <span>Active Users</span>
                    </div>
                  )}
                  {userLocation && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span>Your Location</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Count */}
              <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                <div className="text-sm font-medium">
                  {items.length} items
                  {showUsers && nearbyUsers.length > 0 && (
                    <span className="text-muted-foreground"> • {nearbyUsers.length} users</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ItemInteractionModal
        item={selectedItem}
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false)
          setSelectedItem(null)
        }}
        currentUser={currentUser}
      />
    </>
  )
}
