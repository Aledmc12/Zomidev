import { getSupabaseClient } from '@/lib/services/supabase.client'

export async function signUp(email: string, password: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase no configurado')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase no configurado')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase no configurado')
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function getAccessToken() {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

export async function requestAccountDeletion(reason?: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase no configurado')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('No hay sesión activa')

  const { error } = await supabase.from('account_deletion_requests').insert([{
    user_id: user.id,
    email: user.email || null,
    reason: reason?.trim() || null,
    status: 'pending',
    metadata: { source: 'web-app' },
  }])
  if (error) throw error
}
