import { NextResponse } from 'next/server'

/** Préfixes des routes réservées aux utilisateurs connectés. Redirection vers /login si pas de session. */
const PROTECTED_PREFIXES = [
  '/client',
  '/admin',
  '/agent',
  '/profile',
  '/notifications',
  '/evenements',
  '/entreprise',
  '/livreur',
  '/cuisinier',
  '/verificateur',
  '/secretaire',
]

/**
 * Doit correspondre à config/session.php (cookie = slug(APP_NAME) + '-session').
 * APP_NAME « Green Express » → green-express-session — pas « laravel_session ».
 */
const SESSION_COOKIE_NAME =
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || 'green-express-session'

/** En dev, l'API est souvent sur un autre port (ex. 8000) que le frontend (3000). Le cookie est alors enregistré pour l'origine de l'API et n'est pas envoyé au frontend → le middleware ne peut pas le voir. On laisse RequireAuth (côté client) gérer la redirection. */
function isCrossOriginApi(request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
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
    /* Inclure la racine exacte (ex. /client) : /client/:path* seul peut être ambigu selon la version du matcher. */
    '/client',
    '/client/:path*',
    '/admin',
    '/admin/:path*',
    '/profile',
    '/profile/:path*',
    '/notifications',
    '/notifications/:path*',
    '/evenements',
    '/evenements/:path*',
    '/entreprise',
    '/entreprise/:path*',
    '/livreur',
    '/livreur/:path*',
    '/cuisinier',
    '/cuisinier/:path*',
    '/verificateur',
    '/verificateur/:path*',
    '/agent',
    '/agent/:path*',
    '/secretaire',
    '/secretaire/:path*',
  ],
}
