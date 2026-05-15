export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Relationships: []
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'sales'
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'sales'
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'admin' | 'sales'
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      customers: {
        Relationships: []
        Row: {
          id: string
          business_name: string
          owner_name: string
          phone: string
          city: string | null
          area: string | null
          address: string | null
          category: string | null
          latitude: number | null
          longitude: number | null
          status: 'new' | 'visited' | 'interested' | 'approved' | 'rejected' | 'follow_up'
          assigned_to: string | null
          notes: string | null
          social_links: Json | null
          cover_images: Json | null
          working_hours: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          owner_name: string
          phone: string
          city?: string | null
          area?: string | null
          address?: string | null
          category?: string | null
          latitude?: number | null
          longitude?: number | null
          status?: 'new' | 'visited' | 'interested' | 'approved' | 'rejected' | 'follow_up'
          assigned_to?: string | null
          notes?: string | null
          social_links?: Json | null
          cover_images?: Json | null
          working_hours?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          owner_name?: string
          phone?: string
          city?: string | null
          area?: string | null
          address?: string | null
          category?: string | null
          latitude?: number | null
          longitude?: number | null
          status?: 'new' | 'visited' | 'interested' | 'approved' | 'rejected' | 'follow_up'
          assigned_to?: string | null
          notes?: string | null
          social_links?: Json | null
          cover_images?: Json | null
          working_hours?: Json | null
          updated_at?: string
        }
      }
      visits: {
        Relationships: []
        Row: {
          id: string
          customer_id: string
          employee_id: string
          visit_date: string
          result: 'approved' | 'interested' | 'follow_up' | 'rejected'
          rejection_reason_id: string | null
          notes: string | null
          next_follow_up: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          employee_id: string
          visit_date?: string
          result: 'approved' | 'interested' | 'follow_up' | 'rejected'
          rejection_reason_id?: string | null
          notes?: string | null
          next_follow_up?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          employee_id?: string
          visit_date?: string
          result?: 'approved' | 'interested' | 'follow_up' | 'rejected'
          rejection_reason_id?: string | null
          notes?: string | null
          next_follow_up?: string | null
        }
      }
      rejection_reasons: {
        Relationships: []
        Row: {
          id: string
          reason_en: string
          reason_ar: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          reason_en: string
          reason_ar: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          reason_en?: string
          reason_ar?: string
          is_active?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
