import { Cormorant_Garamond, Montserrat } from 'next/font/google'
import './globals.css'
import PublicShell from '@/components/layout/PublicShell'
import AuthProvider from '@/context/AuthProvider'
import { OrganizationJsonLd } from '@/components/seo/JsonLd'
import { siteConfig } from '@/lib/site'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
})

const siteUrl = siteConfig.url.replace(/\/$/, '')

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ['desarrollo de software', 'aplicaciones a medida', 'FastAPI', 'Next.js', 'portal de clientes'],
  authors: [{ name: siteConfig.name, url: siteUrl }],
  creator: siteConfig.name,
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: siteUrl,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: '/logo-wide.png', width: 1536, height: 1024, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/logo-wide.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/logo.png' }],
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: siteUrl,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-bg">
          Saltar al contenido principal
        </a>
        <OrganizationJsonLd />
        <AuthProvider>
          <PublicShell>{children}</PublicShell>
        </AuthProvider>
      </body>
    </html>
  )
}
