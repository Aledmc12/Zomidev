'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import { siteConfig } from '@/lib/site'

const navLinks = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/portafolio', label: 'Portafolio' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export default function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isPortal = pathname.startsWith('/portal') || pathname.startsWith('/admin')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (isPortal) return null

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/80 backdrop-blur-md">
      <div className="container-wide flex items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center" aria-label={siteConfig.name}>
          <Logo variant="wide" size={34} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide transition ${pathname === link.href ? 'text-gold-soft' : 'text-muted hover:text-bone'}`}
            >
              {link.label}
            </Link>
          ))}
          <Button href="/login" variant="secondary">Portal de clientes</Button>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X className="h-6 w-6 text-bone" aria-hidden="true" /> : <Menu className="h-6 w-6 text-bone" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-white/5 px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-bone">
                {link.label}
              </Link>
            ))}
            <Button href="/login" variant="secondary" className="w-full">Portal de clientes</Button>
          </nav>
        </div>
      )}
    </header>
  )
}
