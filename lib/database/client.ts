import { authService } from './auth-service'
import { dataService } from './data-service'
import { User, Item, Profile, Match, Message, AuthSession, DatabaseResponse } from './types'

// Custom database client to replace Supabase
class DatabaseClient {
  // Auth methods
  auth = {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const result = await authService.signIn(credentials.email, credentials.password)
      return {
        data: { user: result.data },
        error: result.error ? new Error(result.error) : null
      }
    },

    signUp: async (credentials: { 
      email: string; 
      password: string; 
      options?: { 
        data?: { full_name?: string; phone?: string } 
      } 
    }) => {
      const userData = {
        email: credentials.email,
        password: credentials.password,
        full_name: credentials.options?.data?.full_name || '',
        phone: credentials.options?.data?.phone
      }
      const result = await authService.signUp(userData)
      return {
        data: { user: result.data },
        error: result.error ? new Error(result.error) : null
      }
    },

    getUser: async () => {
      const result = await authService.getUser()
      return {
        data: { user: result.data },
        error: result.error ? new Error(result.error) : null
      }
    },

    signOut: async () => {
      const result = await authService.signOut()
      return {
        error: result.error ? new Error(result.error) : null
      }
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return authService.onAuthStateChange((session: AuthSession) => {
        callback('SIGNED_IN', session.user ? { user: session.user } : null)
      })
    }
  }

  // Database query methods
  from(table: string) {
    return new QueryBuilder(table)
  }
}

class QueryBuilder {
  private table: string
  private selectFields: string = '*'
  private filters: any[] = []
  private orderBy: { column: string; ascending: boolean } | null = null
  private limitCount: number | null = null

  constructor(table: string) {
    this.table = table
  }

  select(fields: string = '*') {
    this.selectFields = fields
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  or(condition: string) {
    this.filters.push({ type: 'or', condition })
    return this
  }

  order(column: string, options: { ascending: boolean } = { ascending: true }) {
    this.orderBy = { column, ascending: options.ascending }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  single() {
    this.limitCount = 1
    return this
  }

  // Make the QueryBuilder thenable so it can be awaited directly
  then(onFulfilled?: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected)
  }

  async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      switch (this.table) {
        case 'items':
          return await this.executeItemsQuery()
        case 'profiles':
          return await this.executeProfilesQuery()
        case 'matches':
          return await this.executeMatchesQuery()
        case 'messages':
          return await this.executeMessagesQuery()
        default:
          return { data: null, error: new Error(`Table ${this.table} not supported`) }
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  private async executeItemsQuery() {
    const filters: any = {}
    
    for (const filter of this.filters) {
      if (filter.type === 'eq') {
        if (filter.column === 'user_id') filters.user_id = filter.value
        if (filter.column === 'is_resolved') filters.is_resolved = filter.value
      }
    }

    if (this.limitCount) {
      filters.limit = this.limitCount
    }

    const result = await dataService.getItems(filters)
    
    if (this.limitCount === 1 && result.data && result.data.length > 0) {
      return { data: result.data[0], error: null }
    }

    return { data: result.data, error: result.error ? new Error(result.error) : null }
  }

  private async executeProfilesQuery() {
    const userIdFilter = this.filters.find(f => f.type === 'eq' && f.column === 'id')
    
    if (userIdFilter) {
      const result = await dataService.getProfile(userIdFilter.value)
      return { data: result.data, error: result.error ? new Error(result.error) : null }
    }

    return { data: null, error: new Error('Profile query requires user ID') }
  }

  private async executeMatchesQuery() {
    // For matches, we need to handle the OR condition
    const orFilter = this.filters.find(f => f.type === 'or')
    
    if (orFilter) {
      // Extract user ID from OR condition (simplified parsing)
      const userIdMatch = orFilter.condition.match(/user_id\.eq\.([^,)]+)/)
      if (userIdMatch) {
        const userId = userIdMatch[1]
        const result = await dataService.getMatchCount(userId, 'pending')
        return { data: null, error: null, count: result.data || 0 }
      }
    }

    return { data: [], error: null }
  }

  private async executeMessagesQuery() {
    const userIdFilter = this.filters.find(f => f.type === 'eq' && f.column === 'receiver_id')
    const isReadFilter = this.filters.find(f => f.type === 'eq' && f.column === 'is_read')
    
    if (userIdFilter && isReadFilter && isReadFilter.value === false) {
      const result = await dataService.getUnreadMessageCount(userIdFilter.value)
      return { data: null, error: null, count: result.data || 0 }
    }

    return { data: [], error: null }
  }
}

// Add count method to QueryBuilder for count queries
Object.defineProperty(QueryBuilder.prototype, 'count', {
  get: function() {
    return {
      exact: true,
      head: true
    }
  }
})

// Extend the execute method to handle count queries
const originalExecute = QueryBuilder.prototype.execute
QueryBuilder.prototype.execute = async function() {
  const result = await originalExecute.call(this)
  
  // If this was a count query, return the count
  if (result.count !== undefined) {
    return { ...result, count: result.count }
  }
  
  return result
}

// Export singleton instance
export const createClient = () => new DatabaseClient()
