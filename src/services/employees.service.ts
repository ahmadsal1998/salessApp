import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/app.types'

export const employeesService = {
  async getEmployees(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'sales')
      .order('full_name')
    if (error) throw error
    return data ?? []
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name')
    if (error) throw error
    return data ?? []
  },

  async updateEmployee(id: string, updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'is_active'>>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getEmployeeStats(employeeId: string) {
    const [customersRes, visitsRes] = await Promise.all([
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', employeeId),
      supabase
        .from('visits')
        .select('result')
        .eq('employee_id', employeeId),
    ])
    const customerCount = customersRes.count ?? 0
    const visits = visitsRes.data ?? []
    const approved = visits.filter((v) => v.result === 'approved').length
    return { customerCount, totalVisits: visits.length, approved }
  },
}
