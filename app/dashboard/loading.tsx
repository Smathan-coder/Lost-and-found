export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
      <div className="animate-pulse-glow rounded-full bg-primary/20 p-8">
        <div className="h-8 w-8 bg-primary/50 rounded animate-spin" />
      </div>
    </div>
  )
}
