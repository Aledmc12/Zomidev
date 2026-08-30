const ATTEMPT_KEY = 'carrera_login_attempts'

type AttemptRecord = { count: number; resetAt: number }

const MAX_ATTEMPTS = 8
const WINDOW_MS = 15 * 60 * 1000
const LOCKOUT_MS = 5 * 60 * 1000

function readAttempts(): AttemptRecord {
  if (typeof window === 'undefined') return { count: 0, resetAt: Date.now() + WINDOW_MS }
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY)
    if (!raw) return { count: 0, resetAt: Date.now() + WINDOW_MS }
    return JSON.parse(raw) as AttemptRecord
  } catch {
    return { count: 0, resetAt: Date.now() + WINDOW_MS }
  }
}

function writeAttempts(record: AttemptRecord) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(record))
}

export function canAttemptLogin(): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now()
  let record = readAttempts()
  if (now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS }
    writeAttempts(record)
  }
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, retryAfterSec: Math.max(retryAfterSec, 1) }
  }
  return { allowed: true }
}

export function recordFailedLogin() {
  const now = Date.now()
  let record = readAttempts()
  if (now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS }
  }
  record.count += 1
  if (record.count >= MAX_ATTEMPTS) {
    record.resetAt = now + LOCKOUT_MS
  }
  writeAttempts(record)
}

export function clearLoginAttempts() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ATTEMPT_KEY)
}
