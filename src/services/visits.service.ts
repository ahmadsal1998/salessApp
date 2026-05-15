import { supabase } from '@/lib/supabase'
import type { Visit, VisitFilters, VisitWithRelations } from '@/types/app.types'
import type { Database } from '@/types/database.types'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

type VisitInsert = Database['public']['Tables']['visits']['Insert']

const PAGE_SIZE = 15

export const visitsService = {
  async getVisits(filters: VisitFilters = {}): Promise<{ data: VisitWithRelations[]; count: number }> {
    const { employeeId, result, dateFrom, dateTo, customerId, page = 1, pageSize = PAGE_SIZE } = filters
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('visits')
      .select(
        '*, customer:customers(*), employee:profiles!visits_employee_id_fkey(*), rejection_reason:rejection_reasons(*)',
        { count: 'exact' }
      )
      .order('visit_date', { ascending: false })
      .range(from, to)

    if (employeeId && employeeId !== 'all') query = query.eq('employee_id', employeeId)
    if (result && result !== 'all') query = query.eq('result', result)
    if (customerId) query = query.eq('customer_id', customerId)
    if (dateFrom) query = query.gte('visit_date', dateFrom)
    if (dateTo) query = query.lte('visit_date', `${dateTo}T23:59:59`)

    const { data, error, count } = await query
    if (error) throw error
    return { data: (data as VisitWithRelations[]) ?? [], count: count ?? 0 }
  },

  async createVisit(visit: VisitInsert): Promise<Visit> {
    const { data, error } = await supabase.from('visits').insert(visit).select().single()
    if (error) throw error

    // update customer status based on result
    const statusMap: Record<string, string> = {
      approved: 'approved',
      rejected: 'rejected',
      interested: 'interested',
      follow_up: 'follow_up',
    }
    await supabase
      .from('customers')
      .update({ status: statusMap[visit.result] as 'approved' | 'rejected' | 'interested' | 'follow_up', updated_at: new Date().toISOString() })
      .eq('id', visit.customer_id)

    return data
  },

  async getTodayVisitCount(employeeId?: string): Promise<number> {
    const today = new Date()
    let query = supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .gte('visit_date', startOfDay(today).toISOString())
      .lte('visit_date', endOfDay(today).toISOString())

    if (employeeId) query = query.eq('employee_id', employeeId)

    const { count, error } = await query
    if (error) throw error
    return count ?? 0
  },

  async getVisitsLast30Days(): Promise<{ date: string; count: number }[]> {
    const start = subDays(new Date(), 29)
    const { data, error } = await supabase
      .from('visits')
      .select('visit_date')
      .gte('visit_date', startOfDay(start).toISOString())

    if (error) throw error

    const counts: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      counts[d] = 0
    }
    for (const v of data ?? []) {
      const d = format(new Date(v.visit_date), 'yyyy-MM-dd')
      if (counts[d] !== undefined) counts[d]++
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }))
  },

  async getRejectionBreakdown(): Promise<{ reason: string; reason_ar: string; count: number }[]> {
    const { data, error } = await supabase
      .from('visits')
      .select('rejection_reason:rejection_reasons(reason_en, reason_ar)')
      .eq('result', 'rejected')
      .not('rejection_reason_id', 'is', null)

    if (error) throw error

    type RejRow = { rejection_reason: { reason_en: string; reason_ar: string } | null }
    const rows = (data ?? []) as RejRow[]
    const counts: Record<string, { reason: string; reason_ar: string; count: number }> = {}
    for (const v of rows) {
      const rr = v.rejection_reason
      if (rr) {
        const key = rr.reason_en
        if (!counts[key]) counts[key] = { reason: rr.reason_en, reason_ar: rr.reason_ar, count: 0 }
        counts[key].count++
      }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count)
  },

  async getTopEmployees(): Promise<{ employee: { id: string; full_name: string }; approved: number; total: number }[]> {
    const { data, error } = await supabase
      .from('visits')
      .select('employee_id, result, employee:profiles!visits_employee_id_fkey(id, full_name)')

    if (error) throw error

    type EmpRow = { employee_id: string; result: string; employee: { id: string; full_name: string } | null }
    const rows = (data ?? []) as EmpRow[]
    const map: Record<string, { employee: { id: string; full_name: string }; approved: number; total: number }> = {}
    for (const v of rows) {
      const emp = v.employee
      if (!emp) continue
      if (!map[emp.id]) map[emp.id] = { employee: emp, approved: 0, total: 0 }
      map[emp.id].total++
      if (v.result === 'approved') map[emp.id].approved++
    }
    return Object.values(map).sort((a, b) => b.approved - a.approved).slice(0, 5)
  },

  async getReportData(employeeId?: string, dateFrom?: string, dateTo?: string) {
    let query = supabase
      .from('visits')
      .select('result, employee_id, employee:profiles!visits_employee_id_fkey(id, full_name)')

    if (employeeId && employeeId !== 'all') query = query.eq('employee_id', employeeId)
    if (dateFrom) query = query.gte('visit_date', dateFrom)
    if (dateTo) query = query.lte('visit_date', `${dateTo}T23:59:59`)

    const { data, error } = await query
    if (error) throw error

    type ReportRow = { result: string; employee_id: string; employee: { id: string; full_name: string } | null }
    const rows = (data ?? []) as ReportRow[]
    const map: Record<string, { employee: { id: string; full_name: string }; approved: number; rejected: number; total: number }> = {}
    for (const v of rows) {
      const emp = v.employee
      if (!emp) continue
      if (!map[emp.id]) map[emp.id] = { employee: emp, approved: 0, rejected: 0, total: 0 }
      map[emp.id].total++
      if (v.result === 'approved') map[emp.id].approved++
      if (v.result === 'rejected') map[emp.id].rejected++
    }
    return Object.values(map)
  },
}
