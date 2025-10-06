"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Calendar, MessageCircle, CheckCircle, Phone, Mail, Send, X } from "lucide-react"

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

interface ItemInteractionModalProps {
  item: Item | null
  isOpen: boolean
  onClose: () => void
  currentUser: any
}

export default function ItemInteractionModal({ item, isOpen, onClose, currentUser }: ItemInteractionModalProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showMessageForm, setShowMessageForm] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  if (!item) return null

  const isOwner = currentUser && item.user_id === currentUser.id
  const canInteract = currentUser && !isOwner

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: item.user_id,
        content: message.trim(),
        item_id: item.id,
      })

      if (error) throw error

      toast({
        title: "Message sent!",
        description: "Your message has been delivered to the item owner.",
      })

      setMessage("")
      setShowMessageForm(false)
      onClose()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportFound = () => {
    onClose()
    router.push(`/report/found?reference=${item.id}`)
  }

  const handleStartConversation = () => {
    onClose()
    router.push(`/messages?user=${item.user_id}&item=${item.id}`)
  }

  const handleLogin = () => {
    onClose()
    router.push("/auth/login")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {item.title}
              <Badge variant={item.status === "lost" ? "destructive" : "default"}>{item.status}</Badge>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {item.status === "lost" ? "Someone lost this item" : "Someone found this item"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Image */}
          {item.image_url ? (
            <img
              src={item.image_url || "/placeholder.svg"}
              alt={item.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
              <MapPin className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Item Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Category</h4>
                <Badge variant="outline">{item.category}</Badge>
              </div>
              <div>
                <h4 className="font-medium mb-1">Date</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.date_lost_found).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-1">Location</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {item.location}
              </div>
            </div>

            {/* Owner Information */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Posted by</h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{item.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{item.profiles?.full_name || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground">
                    Posted {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information (only for authenticated users) */}
            {currentUser && item.contact_info && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {item.contact_info.includes("@") ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  {item.contact_info}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-4">
            {!currentUser ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Sign in to message the owner or report that you found this item</p>
                <Button onClick={handleLogin} className="w-full">
                  Sign In to Interact
                </Button>
              </div>
            ) : isOwner ? (
              <div className="text-center">
                <p className="text-muted-foreground">This is your item</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!showMessageForm ? (
                  <div className="flex gap-2">
                    {item.status === "lost" && (
                      <Button onClick={handleReportFound} className="flex-1 touch-effect">
                        <CheckCircle className="h-4 w-4 mr-2" />I Found This
                      </Button>
                    )}
                    <Button onClick={() => setShowMessageForm(true)} variant="outline" className="flex-1 touch-effect">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Send a message</h4>
                      <Textarea
                        placeholder={`Hi! I ${item.status === "lost" ? "might have found" : "am interested in"} your ${item.title}...`}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isLoading}
                        className="flex-1 touch-effect"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isLoading ? "Sending..." : "Send Message"}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowMessageForm(false)
                          setMessage("")
                        }}
                        variant="outline"
                        className="touch-effect"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <Button onClick={handleStartConversation} variant="ghost" size="sm" className="text-xs">
                    View full conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
