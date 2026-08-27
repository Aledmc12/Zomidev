export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUserSession(user) {
  if (typeof window === 'undefined' || !user) return
  sessionStorage.setItem('user', JSON.stringify(user))
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('user')
}

export function isAdminUser() {
  const user = getStoredUser()
  return user?.rol === 'admin'
}

export function isAuthenticated() {
  return Boolean(getStoredUser())
}
