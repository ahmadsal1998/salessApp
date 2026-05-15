import { supabase } from '@/lib/supabase'
import type { Customer, CustomerFilters, CustomerWithEmployee } from '@/types/app.types'
import type { Database } from '@/types/database.types'

type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

const PAGE_SIZE = 15

export const customersService = {
  async getCustomers(filters: CustomerFilters = {}): Promise<{ data: CustomerWithEmployee[]; count: number }> {
    const { search, status, assignedTo, page = 1, pageSize = PAGE_SIZE } = filters
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('customers')
      .select('*, assigned_employee:profiles!customers_assigned_to_fkey(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,owner_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (assignedTo && assignedTo !== 'all') {
      query = query.eq('assigned_to', assignedTo)
    }

    const { data, error, count } = await query
    if (error) throw error
    return { data: (data as CustomerWithEmployee[]) ?? [], count: count ?? 0 }
  },

  async getCustomerById(id: string): Promise<CustomerWithEmployee> {
    const { data, error } = await supabase
      .from('customers')
      .select('*, assigned_employee:profiles!customers_assigned_to_fkey(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as CustomerWithEmployee
  },

  async getAssignedCustomers(employeeId: string, filters: CustomerFilters = {}): Promise<{ data: CustomerWithEmployee[]; count: number }> {
    const { search, status, page = 1, pageSize = PAGE_SIZE } = filters
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('customers')
      .select('*, assigned_employee:profiles!customers_assigned_to_fkey(*)', { count: 'exact' })
      .eq('assigned_to', employeeId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,owner_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
    if (error) throw error
    return { data: (data as CustomerWithEmployee[]) ?? [], count: count ?? 0 }
  },

  async getAllForMap(employeeId?: string): Promise<Customer[]> {
    let query = supabase
      .from('customers')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (employeeId) {
      query = query.eq('assigned_to', employeeId)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async createCustomer(customer: CustomerInsert): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateCustomer(id: string, updates: CustomerUpdate): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
  },

  async getFollowUps(employeeId?: string): Promise<CustomerWithEmployee[]> {
    let query = supabase
      .from('customers')
      .select('*, assigned_employee:profiles!customers_assigned_to_fkey(*)')
      .eq('status', 'follow_up')
      .order('updated_at', { ascending: true })

    if (employeeId) {
      query = query.eq('assigned_to', employeeId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as CustomerWithEmployee[]) ?? []
  },

  async getDashboardStats() {
    const { data, error } = await supabase.from('customers').select('status')
    if (error) throw error
    const counts = (data ?? []).reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] ?? 0) + 1
        acc.total++
        return acc
      },
      { total: 0, new: 0, approved: 0, rejected: 0, follow_up: 0, visited: 0, interested: 0 } as Record<string, number>
    )
    return counts
  },
}
