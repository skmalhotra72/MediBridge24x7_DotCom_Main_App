import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Map subdomains to clinic slugs
const SUBDOMAIN_MAP: Record<string, string> = {
  'cgh': 'city-general-hospital',
  'demo-clinic': 'demo-clinic',
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  if (url.pathname.startsWith('/clinic/') || 
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }
  
  let subdomain: string | null = null
  
  if (hostname.includes('medibridge24x7.com')) {
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      const potentialSubdomain = parts[0].toLowerCase()
      if (potentialSubdomain !== 'www' && 
          potentialSubdomain !== 'patients' &&
          potentialSubdomain !== 'medibridge24x7') {
        subdomain = potentialSubdomain
      }
    }
  }
  
  if (hostname.includes('localhost')) {
    const hostWithoutPort = hostname.split(':')[0]
    const parts = hostWithoutPort.split('.')
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      subdomain = parts[0].toLowerCase()
    }
  }
  
  if (subdomain && SUBDOMAIN_MAP[subdomain]) {
    const clinicSlug = SUBDOMAIN_MAP[subdomain]
    
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = `/clinic/${clinicSlug}`
      return NextResponse.rewrite(url)
    }
    
    if (!url.pathname.includes('.')) {
      url.pathname = `/clinic/${clinicSlug}`
      return NextResponse.rewrite(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}