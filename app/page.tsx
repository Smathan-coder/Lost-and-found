"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/database/auth-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Search, MessageCircle, Shield } from "lucide-react"
import PublicRecentItems from "@/components/recent-items/public-recent-items"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const result = await authService.getUser()
      setUser(result.data)
      setLoading(false)
    }

    getUser()

    const unsubscribe = authService.onAuthStateChange((session) => {
      setUser(session.user)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-pulse-glow rounded-full bg-primary/20 p-8">
          <Search className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  if (user) {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full animate-float" />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-accent/5 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-primary/3 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-2xl animate-pulse-glow">
              <Search className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 text-balance">Lost & Found</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Reunite with your lost items or help others find theirs. Our smart matching system connects lost and found
            items instantly.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: Search,
              title: "Smart Search",
              description: "AI-powered matching system finds potential matches automatically",
            },
            {
              icon: MapPin,
              title: "Location Tracking",
              description: "Interactive maps show where items were lost or found",
            },
            {
              icon: MessageCircle,
              title: "Direct Messaging",
              description: "Secure communication between users to arrange returns",
            },
            {
              icon: Shield,
              title: "Safe & Secure",
              description: "Your privacy and security are our top priorities",
            },
          ].map((feature, index) => (
            <Card
              key={index}
              className="touch-effect hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 p-3 rounded-xl w-fit mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground text-pretty">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Public Recent Items Section */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Recent Lost & Found Items</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See what others have recently lost or found in your community
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <PublicRecentItems limit={6} />
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto border">
            <h2 className="text-2xl font-bold mb-4">Get Started Today</h2>
            <p className="text-muted-foreground mb-6 text-pretty">
              Join our community and help reunite lost items with their owners.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/auth/sign-up")}
                className="w-full touch-effect text-lg py-6 rounded-xl"
                size="lg"
              >
                Sign Up Free
              </Button>
              <Button
                onClick={() => router.push("/auth/login")}
                variant="outline"
                className="w-full touch-effect rounded-xl"
                size="lg"
              >
                Already have an account? Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
