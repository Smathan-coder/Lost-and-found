"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationTracker } from "@/components/ui/location-tracker"
import { ArrowLeft, Upload, MapPin, Calendar, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const categories = [
  "Electronics",
  "Jewelry",
  "Clothing",
  "Bags & Wallets",
  "Keys",
  "Documents",
  "Sports Equipment",
  "Toys",
  "Books",
  "Other",
]

export default function ReportLostPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    dateLost: "",
    contactInfo: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleLocationUpdate = (location: { lat: number; lng: number; address?: string }) => {
    if (location.address) {
      handleInputChange("location", location.address)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.location.trim()) newErrors.location = "Location is required"
    if (!formData.dateLost) newErrors.dateLost = "Date lost is required"
    if (!formData.contactInfo.trim()) newErrors.contactInfo = "Contact information is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "All required fields must be filled out.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let imageUrl = null

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("item-images").upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("item-images").getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Insert item record
      const { error: insertError } = await supabase.from("items").insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        status: "lost",
        location: formData.location,
        date_lost_found: formData.dateLost,
        contact_info: formData.contactInfo,
        image_url: imageUrl,
      })

      if (insertError) throw insertError

      toast({
        title: "Lost item reported!",
        description: "Your item has been added to our database. We'll notify you of any matches.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error submitting lost item:", error)
      toast({
        title: "Error",
        description: "Failed to report lost item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="touch-effect">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Report Lost Item</h1>
              <p className="text-muted-foreground">Help us help you find your lost item</p>
            </div>
          </div>

          <Card className="backdrop-blur-sm bg-card/80 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Lost Item Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2 animate-in slide-in-from-left duration-300">
                  <Label htmlFor="title">Item Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., iPhone 14 Pro, Blue Backpack, Wedding Ring"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={`touch-effect rounded-xl transition-all duration-200 focus:scale-[1.02] ${errors.title ? "border-destructive" : ""}`}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top duration-200">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div
                  className="space-y-2 animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: "100ms" }}
                >
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed description including color, size, brand, distinctive features..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className={`touch-effect rounded-xl min-h-24 transition-all duration-200 focus:scale-[1.02] ${errors.description ? "border-destructive" : ""}`}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top duration-200">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div
                  className="space-y-2 animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: "200ms" }}
                >
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger
                      className={`touch-effect rounded-xl transition-all duration-200 hover:scale-[1.02] ${errors.category ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="Select item category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top duration-200">
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Location with GPS */}
                <div
                  className="space-y-2 animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: "300ms" }}
                >
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Where did you lose it? *
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Central Park, Starbucks on 5th Ave, University Library"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className={`touch-effect rounded-xl transition-all duration-200 focus:scale-[1.02] ${errors.location ? "border-destructive" : ""}`}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top duration-200">
                      {errors.location}
                    </p>
                  )}

                  <div className="mt-3">
                    <LocationTracker onLocationUpdate={handleLocationUpdate} />
                  </div>
                </div>

                {/* Date Lost */}
                <div
                  className="space-y-2 animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: "400ms" }}
                >
                  <Label htmlFor="dateLost" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    When did you lose it? *
                  </Label>
                  <Input
                    id="dateLost"
                    type="date"
                    value={formData.dateLost}
                    onChange={(e) => handleInputChange("dateLost", e.target.value)}
                    className={`touch-effect rounded-xl transition-all duration-200 focus:scale-[1.02] ${errors.dateLost ? "border-destructive" : ""}`}
                  />
                  {errors.dateLost && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top duration-200">
                      {errors.dateLost}
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                <div
                  className="space-y-2 animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: "500ms" }}
                >
                  <Label htmlFor="contactInfo">Contact Information *</Label>
                  <Input
                    id="contactInfo"
                    placeholder="Phone number or email for contact"
                    value={formData.contactInfo}
                    onChange={(e) => handleInputChange("contactInfo", e.target.value)}
                    className={`touch-effect rounded-xl transition-all duration-200 focus:scale-[1.02] ${errors.contactInfo ? "border-destructive" : ""}`}
                  />
                  {errors.contactInfo && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top duration-200">
                      {errors.contactInfo}
                    </p>
                  )}
                </div>

                {/* Image Upload */}
                <div
                  className="space-y-2 animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: "600ms" }}
                >
                  <Label htmlFor="image" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Photo (Optional)
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center touch-effect hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]">
                    <input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <label htmlFor="image" className="cursor-pointer">
                      {imagePreview ? (
                        <div className="space-y-2 animate-in zoom-in duration-300">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-w-full h-32 object-cover rounded-lg mx-auto transition-transform duration-200 hover:scale-105"
                          />
                          <p className="text-sm text-muted-foreground">Click to change image</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground transition-transform duration-200 hover:scale-110" />
                          <p className="text-sm text-muted-foreground">Click to upload a photo of your lost item</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: "700ms" }}>
                  <Button
                    type="submit"
                    className="w-full touch-effect rounded-xl py-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Reporting Lost Item...
                      </div>
                    ) : (
                      "Report Lost Item"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
