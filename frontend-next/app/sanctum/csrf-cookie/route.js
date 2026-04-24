import { NextResponse } from 'next/server'
import { serverBackendOrigin } from '@/lib/serverBackendUrl'
import { rewriteProxiedSetCookie } from '@/lib/rewriteCookie'

export const dynamic = 'force-dynamic'

/**
 * Proxy serveur vers Laravel /sanctum/csrf-cookie (même origine :3000 pour le navigateur).
 * Les rewrites next.config vers une URL externe sont peu fiables en dev → route explicite.
 */
export async function GET(request) {
  const target = `${serverBackendOrigin()}/sanctum/csrf-cookie`
  const host = request.headers.get('host') || 'localhost:3000'
  let res
  try {
    res = await fetch(target, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') || '',
        accept: request.headers.get('accept') || 'application/json',
        'X-Forwarded-Host': host,
        'X-Forwarded-Proto': request.headers.get('x-forwarded-proto') || 'http',
      },
      cache: 'no-store',
    })
  } catch (e) {
    // Log cote serveur (Vercel/logs) — jamais exposé au navigateur.
    console.error('[csrf-cookie proxy] backend injoignable', { target, error: String(e?.message || e) })
    const isProd = process.env.NODE_ENV === 'production'
    return NextResponse.json(
      isProd
        ? { message: 'Service temporairement indisponible.' }
        : {
            message: 'API Laravel injoignable',
            hint: 'Démarrez le backend : cd backend puis php artisan serve --host=127.0.0.1 --port=8000',
            target,
            error: String(e?.message || e),
          },
      { status: 502 },
    )
  }

  const response = new NextResponse(null, {
    status: res.status,
    statusText: res.statusText,
  })

  // Réécrit les Set-Cookie pour le domaine courant (strip Domain=, Path=/, Secure si HTTPS).
  const isHttps = (request.headers.get('x-forwarded-proto') || '').toLowerCase() === 'https'
  if (typeof res.headers.getSetCookie === 'function') {
    for (const c of res.headers.getSetCookie()) {
      response.headers.append('Set-Cookie', rewriteProxiedSetCookie(c, { secure: isHttps }))
    }
  } else {
    const single = res.headers.get('set-cookie')
    if (single) response.headers.append('Set-Cookie', rewriteProxiedSetCookie(single, { secure: isHttps }))
  }

  const cacheControl = res.headers.get('cache-control')
  if (cacheControl) response.headers.set('Cache-Control', cacheControl)

  return response
}
