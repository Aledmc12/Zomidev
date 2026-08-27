'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import PasswordInput from '@/components/ui/PasswordInput'
import { useAuthStore } from '@/store/authStore'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        router.replace(redirect)
        return
      }
      router.replace(user.rol === 'admin' ? '/admin' : '/portal')
    }
  }, [user, router, searchParams])

  useEffect(() => {
    if (searchParams.get('session_expired') === 'true') {
      setError('Tu sesion expiro. Inicia sesion nuevamente.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const loggedUser = await login(email, password)
      const redirect = searchParams.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        router.push(redirect)
      } else {
        router.push(loggedUser.rol === 'admin' ? '/admin' : '/portal')
      }
    } catch (err) {
      setError(err.detail || 'Credenciales invalidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo variant="wide" size={56} animated />
          <h1 className="mt-8 font-serif text-3xl text-bone">Portal de clientes</h1>
          <p className="mt-2 text-sm text-muted">Accede para ver el avance de tu proyecto</p>
        </div>

        <form onSubmit={handleSubmit} className="card-surface space-y-5 p-8" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-muted">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? 'login-error' : undefined}
              className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none transition focus:border-gold/40"
            />
          </div>

          <PasswordInput
            id="password"
            label="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(error)}
            describedBy={error ? 'login-error' : undefined}
          />

          <FormError id="login-error" message={error} />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesion'}
          </Button>

          <p className="text-center text-sm text-muted">
            <Link href="/olvide-contrasena" className="text-gold hover:text-gold-soft">
              Olvide mi contrasena
            </Link>
          </p>

          <p className="text-center text-xs text-muted">
            Al iniciar sesion aceptas nuestros{' '}
            <Link href="/terminos" className="underline hover:text-bone">Terminos</Link>{' '}
            y{' '}
            <Link href="/politica-de-privacidad" className="underline hover:text-bone">Politica de privacidad</Link>.
          </p>
        </form>
      </div>
    </div>
  )
}
