'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn, signUp } from '@/lib/services/auth.service'
import { PRIVACY_POLICY_URL } from '@/lib/form/constants'
import { canAttemptLogin, clearLoginAttempts, recordFailedLogin } from '@/lib/security/rateLimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Correo inválido.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    const gate = canAttemptLogin()
    if (!gate.allowed) {
      setError(`Demasiados intentos. Espera ${gate.retryAfterSec}s.`)
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        clearLoginAttempts()
        window.location.href = '/formulario'
      } else {
        await signUp(email.trim(), password)
        setError('Registro exitoso. Revisa tu correo para confirmar.')
      }
    } catch (err) {
      recordFailedLogin()
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/assets/logo.png" alt="Carrera Arango" className="mx-auto h-16 w-auto object-contain" />
          <h1 className="mt-6 text-2xl font-bold">{mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}</h1>
          <p className="mt-1 text-sm text-gray-500">App Carrera Arango — Formularios vehículos</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-gray-600">Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-gray-600">Contraseña</label>
            <input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-carrera-red py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
          </button>
          <button type="button" className="w-full text-sm text-gray-600 underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            Política de privacidad
          </a>
        </p>
        <p className="mt-8 text-center text-xs text-gray-400">
          developed by{' '}
          <Link href="https://zomidev.com" className="underline">ZomiDev</Link>
        </p>
      </div>
    </div>
  )
}
