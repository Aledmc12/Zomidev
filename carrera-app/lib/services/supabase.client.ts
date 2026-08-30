import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/config'

let supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    const url = getSupabaseUrl()
    const key = getSupabaseAnonKey()
    if (!url || !key) return null
    return createClient(url, key)
  }
  if (supabase) return supabase
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) return null
  supabase = createClient(url, key)
  return supabase
}
