export function getBrowserStorage() {
  if (typeof window === 'undefined') return null

  try {
    if (typeof localStorage?.getItem === 'function') {
      return localStorage
    }
  } catch {
    return null
  }

  return null
}
