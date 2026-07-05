import { supabase } from '@/lib/supabase'
import type { BusinessActivity } from '@/types/app.types'

export const businessActivitiesService = {
  async getAll(activeOnly = true): Promise<BusinessActivity[]> {
    let query = supabase.from('business_activities').select('*').order('created_at')
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async create(name: string): Promise<BusinessActivity> {
    const { data, error } = await supabase
      .from('business_activities')
      .insert({ name })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
