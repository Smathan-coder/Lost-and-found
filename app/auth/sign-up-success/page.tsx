import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 bg-primary/5 rounded-full animate-float" />
        <div
          className="absolute bottom-20 left-10 w-24 h-24 bg-accent/5 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col gap-6 animate-slide-up">
          <Card className="backdrop-blur-sm bg-card/80 border-2">
            <CardHeader className="text-center">
              <div className="bg-primary/10 p-4 rounded-xl w-fit mx-auto mb-4 animate-pulse-glow">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Check Your Email!</CardTitle>
              <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground text-pretty">
                You&apos;ve successfully signed up for Lost & Found. Please check your email and click the confirmation
                link to activate your account.
              </p>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or try signing up again.
                </p>
              </div>
              <Button asChild className="w-full touch-effect rounded-xl" size="lg">
                <Link href="/auth/login">Continue to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
