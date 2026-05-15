import { supabase } from '@/lib/supabase'
import type { RejectionReason } from '@/types/app.types'

export const rejectionReasonsService = {
  async getAll(activeOnly = true): Promise<RejectionReason[]> {
    let query = supabase.from('rejection_reasons').select('*').order('created_at')
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async create(reason_en: string, reason_ar: string): Promise<RejectionReason> {
    const { data, error } = await supabase
      .from('rejection_reasons')
      .insert({ reason_en, reason_ar })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Pick<RejectionReason, 'reason_en' | 'reason_ar' | 'is_active'>>): Promise<RejectionReason> {
    const { data, error } = await supabase
      .from('rejection_reasons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
