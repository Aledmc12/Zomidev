import { Suspense } from 'react'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Portal de clientes',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-bg text-muted">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
