import { PulseLoader } from "@/components/ui/pulse-loader"

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <PulseLoader />
        <p className="text-gray-600">Loading search...</p>
      </div>
    </div>
  )
}
