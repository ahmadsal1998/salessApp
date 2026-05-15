import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/app.types'

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: Partial<Pick<Profile, 'full_name' | 'phone'>>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async createEmployee(params: {
    email: string
    password: string
    fullName: string
    phone?: string
  }) {
    const { data, error } = await supabase.functions.invoke('create-employee', {
      body: {
        email: params.email,
        password: params.password,
        fullName: params.fullName,
        phone: params.phone,
      },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)

    return data
  },
}
