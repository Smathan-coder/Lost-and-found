"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import MessageThread from "@/components/messaging/message-thread"
import { ArrowLeft, MessageCircle } from "lucide-react"

interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string
  last_message: string
  last_message_time: string
  unread_count: number
  item_id?: string
  item_title?: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      await fetchConversations(user.id)
    }

    getUser()
  }, [supabase, router])

  const fetchConversations = async (userId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select(`
          *,
          item:items(title)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Get unique user IDs from messages to fetch profiles
      const userIds = new Set<string>()
      messagesData?.forEach((message: any) => {
        userIds.add(message.sender_id)
        userIds.add(message.receiver_id)
      })

      // Fetch profiles for all users involved in conversations
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIds))

      if (profilesError) throw profilesError

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map()
      profilesData?.forEach((profile: any) => {
        profilesMap.set(profile.id, profile)
      })

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>()

      messagesData?.forEach((message: any) => {
        const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id
        const otherUserProfile = profilesMap.get(otherUserId)
        const otherUserName = otherUserProfile?.full_name || "Unknown User"

        const conversationKey = `${Math.min(userId, otherUserId)}-${Math.max(userId, otherUserId)}`

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            id: conversationKey,
            other_user_id: otherUserId,
            other_user_name: otherUserName,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: message.sender_id !== userId && !message.is_read ? 1 : 0,
            item_id: message.item_id,
            item_title: message.item?.title,
          })
        } else {
          const existing = conversationMap.get(conversationKey)!
          if (new Date(message.created_at) > new Date(existing.last_message_time)) {
            existing.last_message = message.content
            existing.last_message_time = message.created_at
          }
          if (message.sender_id !== userId && !message.is_read) {
            existing.unread_count++
          }
        }
      })

      setConversations(Array.from(conversationMap.values()))
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-pulse-glow rounded-full bg-primary/20 p-8">
          <MessageCircle className="h-8 w-8 text-primary animate-spin" />
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
                <h1 className="text-xl font-bold">Messages</h1>
                <p className="text-sm text-muted-foreground">Communicate with other users</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {conversations.length} conversations
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Start messaging other users when you find potential matches
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 cursor-pointer touch-effect hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                          selectedConversation?.id === conversation.id ? "bg-muted/50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{conversation.other_user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm truncate">{conversation.other_user_name}</h4>
                              {conversation.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{conversation.last_message}</p>
                            {conversation.item_title && (
                              <p className="text-xs text-primary mt-1">About: {conversation.item_title}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(conversation.last_message_time).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <MessageThread
                otherUserId={selectedConversation.other_user_id}
                otherUserName={selectedConversation.other_user_name}
                currentUserId={user?.id}
                itemId={selectedConversation.item_id}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
