import { Suspense } from 'react'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata = {
  title: 'Restablecer contrasena',
  robots: { index: false, follow: false },
}

export default function RecuperarContrasenaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-bg text-muted">Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
