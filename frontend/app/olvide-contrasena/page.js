'use client'
import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await api.auth.forgotPassword({ email })
      setMessage(res.message)
    } catch (err) {
      setError(err.detail || 'No se pudo procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="wide" size={48} />
          <h1 className="mt-6 font-serif text-2xl text-bone">Recuperar contrasena</h1>
          <p className="mt-2 text-sm text-muted">Te enviaremos un enlace si el email esta registrado.</p>
        </div>
        <form onSubmit={handleSubmit} className="card-surface space-y-5 p-8">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-muted">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none focus:border-gold/40"
            />
          </div>
          <FormError id="forgot-error" message={error} />
          {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-gold hover:text-gold-soft">Volver al login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
