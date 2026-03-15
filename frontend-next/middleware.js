import { NextResponse } from 'next/server'

/** Préfixes des routes réservées aux utilisateurs connectés. Redirection vers /login si pas de session. */
const PROTECTED_PREFIXES = [
  '/client',
  '/admin',
  '/profile',
  '/notifications',
  '/evenements',
  '/entreprise',
  '/livreur',
  '/cuisinier',
  '/verificateur',
]

/** Cookie de session Laravel (Sanctum SPA). Présent après connexion. */
const SESSION_COOKIE_NAME = 'laravel_session'

/** En dev, l'API est souvent sur un autre port (ex. 8000) que le frontend (3000). Le cookie est alors enregistré pour l'origine de l'API et n'est pas envoyé au frontend → le middleware ne peut pas le voir. On laisse RequireAuth (côté client) gérer la redirection. */
function isCrossOriginApi(request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  try {
    const apiOrigin = new URL(apiUrl).origin
    const requestOrigin = new URL(request.url).origin
    return apiOrigin !== requestOrigin
  } catch {
    return true
  }
}

function isProtectedPath(pathname) {
  if (!pathname || pathname === '/') return false
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  if (!isProtectedPath(pathname)) return NextResponse.next()

  if (isCrossOriginApi(request)) return NextResponse.next()

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  if (sessionCookie?.value) return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('returnUrl', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/client/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/notifications/:path*',
    '/evenements/:path*',
    '/entreprise/:path*',
    '/livreur/:path*',
    '/cuisinier/:path*',
    '/verificateur/:path*',
  ],
}
