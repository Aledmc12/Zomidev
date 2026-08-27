/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  ...(isProd
    ? [
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://zomidev.com https://*.zomidev.com; font-src 'self' data:; connect-src 'self' https://zomidev.com https://*.zomidev.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        },
      ]
    : []),
]

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'zomidev.com' },
      { protocol: 'https', hostname: '*.zomidev.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  env: {
    BACKEND_URL: apiUrl,
  },
}

module.exports = nextConfig
