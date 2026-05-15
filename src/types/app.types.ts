import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Visit = Database['public']['Tables']['visits']['Row']
export type RejectionReason = Database['public']['Tables']['rejection_reasons']['Row']

export type CustomerStatus = Customer['status']
export type VisitResult = Visit['result']
export type UserRole = Profile['role']

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'website' | 'linkedin' | 'custom'

export interface SocialLink {
  platform: SocialPlatform
  url: string
  label?: string
}

export interface StoreImage {
  url: string
  is_main: boolean
}

export type DayKey = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'

export interface DaySchedule {
  open: boolean
  from: string  // "HH:MM" 24h
  to: string    // "HH:MM" 24h
}

export type WorkingHours = Record<DayKey, DaySchedule>

export interface CustomerWithEmployee extends Customer {
  assigned_employee?: Profile | null
}

export interface VisitWithRelations extends Visit {
  customer?: Customer | null
  employee?: Profile | null
  rejection_reason?: RejectionReason | null
}

export interface DashboardStats {
  totalCustomers: number
  newCustomers: number
  approvedCustomers: number
  rejectedCustomers: number
  followUpCustomers: number
  conversionRate: number
  todayVisits: number
  totalVisits: number
}

export interface CustomerFilters {
  search?: string
  status?: CustomerStatus | 'all'
  assignedTo?: string | 'all'
  page?: number
  pageSize?: number
}

export interface VisitFilters {
  employeeId?: string | 'all'
  result?: VisitResult | 'all'
  dateFrom?: string
  dateTo?: string
  customerId?: string
  page?: number
  pageSize?: number
}
