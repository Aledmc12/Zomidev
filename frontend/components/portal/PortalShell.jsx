'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { href: '/portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/mensajes', label: 'Mensajes', icon: MessageSquare },
  { href: '/portal/notificaciones', label: 'Notificaciones', icon: Bell },
]

export default function PortalShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const hydrate = useAuthStore((s) => s.hydrate)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-muted">Cargando portal...</div>
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/5 bg-bg-secondary transition lg:static ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <Link href="/portal" className="flex items-center gap-3">
            <Logo size={32} />
            <span className="font-serif tracking-[0.15em]">Portal</span>
          </Link>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menu">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="space-y-1 p-4" aria-label="Portal">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${pathname === href ? 'bg-gold/10 text-gold-soft' : 'text-muted hover:bg-white/5 hover:text-bone'}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-4">
          <p className="mb-3 truncate px-4 text-xs text-muted">{user?.nombre}</p>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-300 hover:bg-white/5">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 lg:px-10">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted">
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
            Seguimiento de proyectos
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
