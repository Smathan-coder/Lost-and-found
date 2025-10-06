"use client"

import { useState, useEffect } from "react"
import { MapPin, Navigation } from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"

interface LocationTrackerProps {
  onLocationUpdate?: (location: { lat: number; lng: number; address?: string }) => void
  showAddress?: boolean
}

export function LocationTracker({ onLocationUpdate, showAddress = true }: LocationTrackerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = { lat: latitude, lng: longitude }

        // Simulate reverse geocoding (in a real app, you'd use a geocoding service)
        if (showAddress) {
          try {
            // This is a mock address - in production, use a real geocoding service
            const mockAddress = `${Math.floor(latitude * 100) % 1000} Main St, City, State`
            newLocation.address = mockAddress
          } catch (err) {
            console.error("Geocoding error:", err)
          }
        }

        setLocation(newLocation)
        onLocationUpdate?.(newLocation)
        setLoading(false)
      },
      (error) => {
        setError("Unable to retrieve your location")
        setLoading(false)
        console.error("Geolocation error:", error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }

  useEffect(() => {
    // Auto-get location on mount
    getCurrentLocation()
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={getCurrentLocation}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-transparent"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {loading ? "Getting Location..." : "Use Current Location"}
        </Button>

        {location && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Location Found
          </Badge>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}

      {location && showAddress && location.address && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-blue-500" />
            <div>
              <p className="font-medium">Current Location:</p>
              <p>{location.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
