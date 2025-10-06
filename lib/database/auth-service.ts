import { User, AuthSession, DatabaseResponse } from './types'
import { mockUsers } from './mock-data'

// Simple in-memory authentication service
class AuthService {
  private currentUser: User | null = null
  private isAuthenticated: boolean = false

  // Simulate login
  async signIn(email: string, password: string): Promise<DatabaseResponse<User>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const user = mockUsers.find(u => u.email === email)
    
    if (!user) {
      return {
        data: null,
        error: "User not found",
        success: false
      }
    }

    // In a real app, you'd verify the password hash
    // For demo purposes, accept any password
    this.currentUser = user
    this.isAuthenticated = true

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_session', 'true')
    }

    return {
      data: user,
      error: null,
      success: true
    }
  }

  // Simulate signup
  async signUp(userData: {
    email: string
    password: string
    full_name: string
    phone?: string
  }): Promise<DatabaseResponse<User>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === userData.email)
    if (existingUser) {
      return {
        data: null,
        error: "User already exists",
        success: false
      }
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add to mock data (in a real app, this would be saved to database)
    mockUsers.push(newUser)

    this.currentUser = newUser
    this.isAuthenticated = true

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(newUser))
      localStorage.setItem('auth_session', 'true')
    }

    return {
      data: newUser,
      error: null,
      success: true
    }
  }

  // Get current user
  async getUser(): Promise<DatabaseResponse<User>> {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('auth_user')
      const storedSession = localStorage.getItem('auth_session')
      
      if (storedUser && storedSession === 'true') {
        const user = JSON.parse(storedUser)
        this.currentUser = user
        this.isAuthenticated = true
        
        return {
          data: user,
          error: null,
          success: true
        }
      }
    }

    if (this.isAuthenticated && this.currentUser) {
      return {
        data: this.currentUser,
        error: null,
        success: true
      }
    }

    return {
      data: null,
      error: "Not authenticated",
      success: false
    }
  }

  // Sign out
  async signOut(): Promise<DatabaseResponse<null>> {
    this.currentUser = null
    this.isAuthenticated = false

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_session')
    }

    return {
      data: null,
      error: null,
      success: true
    }
  }

  // Get current session
  getSession(): AuthSession {
    return {
      user: this.currentUser,
      isAuthenticated: this.isAuthenticated
    }
  }

  // Subscribe to auth state changes (simplified)
  onAuthStateChange(callback: (session: AuthSession) => void) {
    // In a real app, this would be more sophisticated
    const checkAuth = () => {
      callback(this.getSession())
    }

    // Check immediately
    checkAuth()

    // Return unsubscribe function
    return () => {
      // Cleanup if needed
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
