import { NextResponse } from 'next/server'
import { serverBackendOrigin } from '@/lib/serverBackendUrl'
import { rewriteProxiedSetCookie } from '@/lib/rewriteCookie'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
])

/**
 * Proxy explicite vers Laravel POST /api/auth/google.
 *
 * Indispensable car le catch-all NextAuth (app/api/auth/[...nextauth]/route.js)
 * intercepterait sinon /api/auth/google et renverrait 400 (action inconnue).
 * Cette route nommée a une précédence supérieure au catch-all dynamique.
 */
async function proxyRequest(request) {
  const u = new URL(request.url)
  const target = `${serverBackendOrigin()}/api/auth/google${u.search}`

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return
    headers.set(key, value)
  })

  const host = request.headers.get('host') || 'localhost:3000'
  headers.set('X-Forwarded-Host', host)
  headers.set('X-Forwarded-Proto', request.headers.get('x-forwarded-proto') || 'http')
  const xff = request.headers.get('x-forwarded-for')
  if (xff) headers.set('X-Forwarded-For', xff)

  const method = request.method
  const init = {
    method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  }
  if (!['GET', 'HEAD'].includes(method)) {
    init.body = await request.arrayBuffer()
  }

  let res
  try {
    res = await fetch(target, init)
  } catch (e) {
    return NextResponse.json(
      {
        message: 'API Laravel injoignable',
        hint: 'Démarrez le backend : php artisan serve --host=localhost --port=8000',
        target,
        error: String(e?.message || e),
      },
      { status: 502 },
    )
  }

  const response = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
  })

  const isHttps = (request.headers.get('x-forwarded-proto') || u.protocol.replace(':', '')) === 'https'
  if (typeof res.headers.getSetCookie === 'function') {
    for (const c of res.headers.getSetCookie()) {
      response.headers.append('Set-Cookie', rewriteProxiedSetCookie(c, { secure: isHttps }))
    }
  } else {
    const single = res.headers.get('set-cookie')
    if (single) response.headers.append('Set-Cookie', rewriteProxiedSetCookie(single, { secure: isHttps }))
  }

  res.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (k === 'set-cookie') return
    if (['transfer-encoding', 'connection', 'content-encoding', 'content-length'].includes(k)) return
    response.headers.set(key, value)
  })

  return response
}

export async function POST(request) {
  return proxyRequest(request)
}

export async function OPTIONS(request) {
  return proxyRequest(request)
}
