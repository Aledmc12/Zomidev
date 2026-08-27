'use client'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const HIDE_CHROME_PREFIXES = ['/portal', '/admin', '/login', '/olvide-contrasena', '/recuperar-contrasena']

export default function PublicShell({ children }) {
  const pathname = usePathname()
  const hideChrome = HIDE_CHROME_PREFIXES.some((p) => pathname.startsWith(p))

  if (hideChrome) return children

  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  )
}
