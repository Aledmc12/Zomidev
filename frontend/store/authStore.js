import { create } from 'zustand'
import { clearAuthSession, getStoredUser, setUserSession } from '@/lib/auth'
import { api } from '@/lib/api'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      const user = await api.auth.me()
      setUserSession(user)
      set({ user, loading: false })
    } catch {
      clearAuthSession()
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const data = await api.auth.login({ email, password })
    setUserSession(data.user)
    set({ user: data.user })
    return data.user
  },

  logout: async () => {
    try {
      await api.auth.logout()
    } catch {
      // ignore
    }
    clearAuthSession()
    set({ user: null })
  },

  refreshUser: async () => {
    const user = await api.auth.me()
    setUserSession(user)
    set({ user })
    return user
  },
}))
