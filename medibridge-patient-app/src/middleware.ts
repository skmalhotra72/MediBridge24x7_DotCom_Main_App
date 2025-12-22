import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Map subdomains to clinic slugs
const SUBDOMAIN_MAP: Record<string, string> = {
  'cgh': 'city-general-hospital',
  'demo-clinic': 'demo-clinic',
  // Add more clinics here as needed
  // 'apollo': 'apollo-hospital',
  // 'max': 'max-healthcare',
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Skip if already on a clinic page or API route
  if (url.pathname.startsWith('/clinic/') || 
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }
  
  // Extract subdomain from hostname
  let subdomain: string | null = null
  
  // Production: subdomain.medibridge24x7.com
  if (hostname.includes('medibridge24x7.com')) {
    const parts = hostname.split('.')
    // Check if it's a subdomain (not www, not patients, not main domain)
    if (parts.length >= 3) {
      const potentialSubdomain = parts[0].toLowerCase()
      if (potentialSubdomain !== 'www' && 
          potentialSubdomain !== 'patients' &&
          potentialSubdomain !== 'medibridge24x7') {
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
    
    // Rewrite root to clinic page
    // cgh.medibridge24x7.com → /clinic/city-general-hospital
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = `/clinic/${clinicSlug}`
      return NextResponse.rewrite(url)
    }
    
    // For hash links (#about, #contact, etc.), rewrite to clinic page
    // The frontend will handle the hash scrolling
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