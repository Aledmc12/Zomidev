import PortalShell from '@/components/portal/PortalShell'

export const metadata = {
  title: 'Portal de clientes',
  robots: { index: false, follow: false },
}

export default function PortalLayout({ children }) {
  return <PortalShell>{children}</PortalShell>
}
