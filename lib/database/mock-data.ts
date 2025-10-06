import { User, Profile, Item, Match, Message } from './types'

// Mock users data
export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "john.doe@example.com",
    full_name: "John Doe",
    phone: "+1 (555) 123-4567",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "user-2",
    email: "jane.smith@example.com",
    full_name: "Jane Smith",
    phone: "+1 (555) 987-6543",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z"
  },
  {
    id: "user-3",
    email: "mike.wilson@example.com",
    full_name: "Mike Wilson",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z"
  }
]

// Mock profiles data
export const mockProfiles: Profile[] = [
  {
    id: "profile-1",
    user_id: "user-1",
    full_name: "John Doe",
    phone: "+1 (555) 123-4567",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "profile-2",
    user_id: "user-2",
    full_name: "Jane Smith",
    phone: "+1 (555) 987-6543",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z"
  },
  {
    id: "profile-3",
    user_id: "user-3",
    full_name: "Mike Wilson",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z"
  }
]

// Mock items data
export const mockItems: Item[] = [
  {
    id: "item-1",
    user_id: "user-1",
    title: "iPhone 13 Pro",
    description: "Lost my iPhone 13 Pro in blue color near Central Park. It has a cracked screen protector and a black case with my initials 'JD' on it.",
    category: "Electronics",
    status: "lost",
    location: "Central Park, NYC",
    date_lost_found: "2024-01-15",
    contact_info: "john.doe@example.com",
    is_resolved: false,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    profiles: mockProfiles[0]
  },
  {
    id: "item-2",
    user_id: "user-2",
    title: "Black Leather Wallet",
    description: "Found a black leather wallet with credit cards and driver's license. Contains some cash and business cards.",
    category: "Personal Items",
    status: "found",
    location: "Times Square, NYC",
    date_lost_found: "2024-01-14",
    contact_info: "jane.smith@example.com",
    is_resolved: false,
    created_at: "2024-01-14T15:30:00Z",
    updated_at: "2024-01-14T15:30:00Z",
    profiles: mockProfiles[1]
  },
  {
    id: "item-3",
    user_id: "user-3",
    title: "Red Bicycle",
    description: "Lost my red mountain bike near Brooklyn Bridge. It has a white basket and a bell. Brand is Trek.",
    category: "Vehicles",
    status: "lost",
    location: "Brooklyn Bridge, NYC",
    date_lost_found: "2024-01-13",
    contact_info: "mike.wilson@example.com",
    is_resolved: false,
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T09:15:00Z",
    profiles: mockProfiles[2]
  },
  {
    id: "item-4",
    user_id: "user-1",
    title: "Blue Backpack",
    description: "Found a blue Jansport backpack with textbooks and a laptop inside. Left at the coffee shop on 5th Avenue.",
    category: "Bags",
    status: "found",
    location: "5th Avenue Coffee Shop, NYC",
    date_lost_found: "2024-01-12",
    contact_info: "john.doe@example.com",
    is_resolved: false,
    created_at: "2024-01-12T14:20:00Z",
    updated_at: "2024-01-12T14:20:00Z",
    profiles: mockProfiles[0]
  },
  {
    id: "item-5",
    user_id: "user-2",
    title: "Gold Watch",
    description: "Lost my grandfather's gold watch at the subway station. It's a vintage Rolex with sentimental value.",
    category: "Jewelry",
    status: "lost",
    location: "Grand Central Station, NYC",
    date_lost_found: "2024-01-11",
    contact_info: "jane.smith@example.com",
    is_resolved: true,
    created_at: "2024-01-11T08:45:00Z",
    updated_at: "2024-01-16T12:00:00Z",
    profiles: mockProfiles[1]
  }
]

// Mock matches data
export const mockMatches: Match[] = [
  {
    id: "match-1",
    lost_item_id: "item-1",
    found_item_id: "item-2",
    lost_item_user_id: "user-1",
    found_item_user_id: "user-2",
    status: "pending",
    similarity_score: 0.75,
    created_at: "2024-01-16T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z"
  }
]

// Mock messages data
export const mockMessages: Message[] = [
  {
    id: "message-1",
    sender_id: "user-2",
    receiver_id: "user-1",
    item_id: "item-1",
    content: "Hi! I think I might have found your iPhone. Can you describe it in more detail?",
    is_read: false,
    created_at: "2024-01-16T11:00:00Z",
    updated_at: "2024-01-16T11:00:00Z"
  },
  {
    id: "message-2",
    sender_id: "user-1",
    receiver_id: "user-2",
    item_id: "item-1",
    content: "Yes! It's a blue iPhone 13 Pro with a cracked screen protector and black case with 'JD' initials.",
    is_read: true,
    created_at: "2024-01-16T11:15:00Z",
    updated_at: "2024-01-16T11:15:00Z"
  }
]
