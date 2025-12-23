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
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|webp)$/)
  ) {
    return NextResponse.next()
  }
  
  // Skip if already on a clinic page (white-label site route)
  if (pathname.startsWith('/clinic/')) {
    return NextResponse.next()
  }
  
  // Extract subdomain from hostname
  let subdomain: string | null = null
  
  // Production: subdomain.medibridge24x7.com
  if (hostname.includes('medibridge24x7.com')) {
    const parts = hostname.split('.')
    // For cgh.medibridge24x7.com -> parts = ['cgh', 'medibridge24x7', 'com']
    if (parts.length >= 3) {
      const potentialSubdomain = parts[0].toLowerCase()
      // Exclude reserved subdomains
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
  
  // If we have a matching subdomain
  if (subdomain && SUBDOMAIN_MAP[subdomain]) {
    const clinicSlug = SUBDOMAIN_MAP[subdomain]
    
    // ONLY rewrite ROOT path to clinic page
    // cgh.medibridge24x7.com/ → /clinic/city-general-hospital
    if (pathname === '/' || pathname === '') {
      url.pathname = `/clinic/${clinicSlug}`
      return NextResponse.rewrite(url)
    }
    
    // For ALL OTHER paths, pass through WITHOUT modification
    // This allows:
    // - cgh.medibridge24x7.com/city-general-hospital → /city-general-hospital (patient portal)
    // - cgh.medibridge24x7.com/city-general-hospital/chat → /city-general-hospital/chat
    // - cgh.medibridge24x7.com/city-general-hospital/login → /city-general-hospital/login
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}