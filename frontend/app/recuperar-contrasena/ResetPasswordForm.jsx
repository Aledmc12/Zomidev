'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import PasswordInput from '@/components/ui/PasswordInput'
import { api } from '@/lib/api'

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contrasenas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.auth.resetPassword({ token, password })
      setDone(true)
    } catch (err) {
      setError(err.detail || 'No se pudo restablecer la contrasena.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-center">
        <div>
          <p className="text-red-300">Enlace invalido o expirado.</p>
          <Link href="/olvide-contrasena" className="mt-4 inline-block text-gold">Solicitar nuevo enlace</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="wide" size={48} />
          <h1 className="mt-6 font-serif text-2xl text-bone">Nueva contrasena</h1>
        </div>
        {done ? (
          <div className="card-surface p-8 text-center">
            <p className="text-emerald-300">Contrasena actualizada correctamente.</p>
            <Button href="/login" className="mt-6">Ir al login</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-surface space-y-5 p-8">
            <PasswordInput
              id="password"
              label="Nueva contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Minimo 10 caracteres, mayuscula, minuscula, numero y simbolo."
            />
            <PasswordInput
              id="confirm"
              label="Confirmar contrasena"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <FormError id="reset-error" message={error} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Guardando...' : 'Restablecer contrasena'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
