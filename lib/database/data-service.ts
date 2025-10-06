import { Item, Profile, Match, Message, DatabaseResponse } from './types'
import { mockItems, mockProfiles, mockMatches, mockMessages } from './mock-data'

// Simple in-memory data service
class DataService {
  private items: Item[] = [...mockItems]
  private profiles: Profile[] = [...mockProfiles]
  private matches: Match[] = [...mockMatches]
  private messages: Message[] = [...mockMessages]

  // Items operations
  async getItems(filters?: {
    user_id?: string
    status?: 'lost' | 'found'
    is_resolved?: boolean
    limit?: number
  }): Promise<DatabaseResponse<Item[]>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))

    let filteredItems = [...this.items]

    if (filters) {
      if (filters.user_id) {
        filteredItems = filteredItems.filter(item => item.user_id === filters.user_id)
      }
      if (filters.status) {
        filteredItems = filteredItems.filter(item => item.status === filters.status)
      }
      if (filters.is_resolved !== undefined) {
        filteredItems = filteredItems.filter(item => item.is_resolved === filters.is_resolved)
      }
      if (filters.limit) {
        filteredItems = filteredItems.slice(0, filters.limit)
      }
    }

    // Sort by created_at descending
    filteredItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      data: filteredItems,
      error: null,
      success: true
    }
  }

  async getItemById(id: string): Promise<DatabaseResponse<Item>> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const item = this.items.find(item => item.id === id)
    
    if (!item) {
      return {
        data: null,
        error: "Item not found",
        success: false
      }
    }

    return {
      data: item,
      error: null,
      success: true
    }
  }

  async createItem(itemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Item>> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const newItem: Item = {
      ...itemData,
      id: `item-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.items.push(newItem)

    return {
      data: newItem,
      error: null,
      success: true
    }
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<DatabaseResponse<Item>> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const itemIndex = this.items.findIndex(item => item.id === id)
    
    if (itemIndex === -1) {
      return {
        data: null,
        error: "Item not found",
        success: false
      }
    }

    this.items[itemIndex] = {
      ...this.items[itemIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return {
      data: this.items[itemIndex],
      error: null,
      success: true
    }
  }

  // Profiles operations
  async getProfile(user_id: string): Promise<DatabaseResponse<Profile>> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const profile = this.profiles.find(p => p.user_id === user_id)
    
    if (!profile) {
      return {
        data: null,
        error: "Profile not found",
        success: false
      }
    }

    return {
      data: profile,
      error: null,
      success: true
    }
  }

  async updateProfile(user_id: string, updates: Partial<Profile>): Promise<DatabaseResponse<Profile>> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const profileIndex = this.profiles.findIndex(p => p.user_id === user_id)
    
    if (profileIndex === -1) {
      return {
        data: null,
        error: "Profile not found",
        success: false
      }
    }

    this.profiles[profileIndex] = {
      ...this.profiles[profileIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return {
      data: this.profiles[profileIndex],
      error: null,
      success: true
    }
  }

  // Matches operations
  async getMatches(user_id: string): Promise<DatabaseResponse<Match[]>> {
    await new Promise(resolve => setTimeout(resolve, 150))

    const userMatches = this.matches.filter(
      match => match.lost_item_user_id === user_id || match.found_item_user_id === user_id
    )

    return {
      data: userMatches,
      error: null,
      success: true
    }
  }

  async getMatchCount(user_id: string, status: string = 'pending'): Promise<DatabaseResponse<number>> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const count = this.matches.filter(
      match => 
        (match.lost_item_user_id === user_id || match.found_item_user_id === user_id) &&
        match.status === status
    ).length

    return {
      data: count,
      error: null,
      success: true
    }
  }

  // Messages operations
  async getMessages(user_id: string): Promise<DatabaseResponse<Message[]>> {
    await new Promise(resolve => setTimeout(resolve, 150))

    const userMessages = this.messages.filter(
      message => message.sender_id === user_id || message.receiver_id === user_id
    )

    // Sort by created_at descending
    userMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      data: userMessages,
      error: null,
      success: true
    }
  }

  async getUnreadMessageCount(user_id: string): Promise<DatabaseResponse<number>> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const count = this.messages.filter(
      message => message.receiver_id === user_id && !message.is_read
    ).length

    return {
      data: count,
      error: null,
      success: true
    }
  }

  async sendMessage(messageData: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Message>> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const newMessage: Message = {
      ...messageData,
      id: `message-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.messages.push(newMessage)

    return {
      data: newMessage,
      error: null,
      success: true
    }
  }

  async markMessageAsRead(message_id: string): Promise<DatabaseResponse<Message>> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const messageIndex = this.messages.findIndex(m => m.id === message_id)
    
    if (messageIndex === -1) {
      return {
        data: null,
        error: "Message not found",
        success: false
      }
    }

    this.messages[messageIndex] = {
      ...this.messages[messageIndex],
      is_read: true,
      updated_at: new Date().toISOString()
    }

    return {
      data: this.messages[messageIndex],
      error: null,
      success: true
    }
  }

  // Search functionality
  async searchItems(query: string, filters?: {
    category?: string
    status?: 'lost' | 'found'
    location?: string
  }): Promise<DatabaseResponse<Item[]>> {
    await new Promise(resolve => setTimeout(resolve, 200))

    let results = this.items.filter(item => {
      const matchesQuery = 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())

      if (!matchesQuery) return false

      if (filters) {
        if (filters.category && item.category !== filters.category) return false
        if (filters.status && item.status !== filters.status) return false
        if (filters.location && !item.location.toLowerCase().includes(filters.location.toLowerCase())) return false
      }

      return true
    })

    // Sort by relevance (simple scoring based on title match)
    results.sort((a, b) => {
      const aScore = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
      const bScore = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
      return bScore - aScore
    })

    return {
      data: results,
      error: null,
      success: true
    }
  }
}

// Export singleton instance
export const dataService = new DataService()
