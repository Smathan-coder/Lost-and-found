// Database types and interfaces
export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  user_id: string
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
  updated_at: string
  profiles?: Profile
}

export interface Match {
  id: string
  lost_item_id: string
  found_item_id: string
  lost_item_user_id: string
  found_item_user_id: string
  status: "pending" | "accepted" | "rejected"
  similarity_score: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  item_id?: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface AuthSession {
  user: User | null
  isAuthenticated: boolean
}

export interface DatabaseResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}
