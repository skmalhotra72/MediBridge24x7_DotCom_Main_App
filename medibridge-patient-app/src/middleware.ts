import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Map subdomains to clinic slugs
const SUBDOMAIN_MAP: Record<string, string> = {
  'cgh': 'city-general-hospital',
  'demo-clinic': 'demo-clinic',
  // Add more clinics as needed
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const pathname = url.pathname
  
  // Skip static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next()
  }
  
  // Skip if already on a clinic page
  if (pathname.startsWith('/clinic/')) {
    return NextResponse.next()
  }
  
  // Extract subdomain from hostname
  let subdomain: string | null = null
  
  // Production: subdomain.medibridge24x7.com
  if (hostname.includes('medibridge24x7.com')) {
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      const potentialSubdomain = parts[0].toLowerCase()
      if (!['www', 'patients', 'admin', 'api', 'medibridge24x7'].includes(potentialSubdomain)) {
        subdomain = potentialSubdomain
      }
    }
  }
  
  // Development: subdomain.localhost:3000
  if (hostname.includes('localhost')) {
    const hostWithoutPort = hostname.split(':')[0]
    const parts = hostWithoutPort.split('.')
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      subdomain = parts[0].toLowerCase()
    }
  }
  
  // If we have a matching subdomain, rewrite to clinic page
  if (subdomain && SUBDOMAIN_MAP[subdomain]) {
    const clinicSlug = SUBDOMAIN_MAP[subdomain]
    url.pathname = `/clinic/${clinicSlug}`
    return NextResponse.rewrite(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}