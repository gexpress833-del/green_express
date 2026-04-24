import { NextResponse } from 'next/server'
import { serverBackendOrigin } from '@/lib/serverBackendUrl'

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
 * Proxy explicite vers Laravel : mêmes en-têtes Cookie / X-XSRF-TOKEN que le rewrite Next,
 * + X-Forwarded-* pour que Laravel (TrustProxies) aligne session / CSRF avec le front :3000.
 */
async function proxyRequest(request, context) {
  const params = await context.params
  const raw = params?.path
  const pathStr = Array.isArray(raw) ? raw.filter(Boolean).join('/') : raw || ''
  const u = new URL(request.url)
  const backend = serverBackendOrigin()
  const target = `${backend}/api${pathStr ? `/${pathStr}` : ''}${u.search}`

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
      { status: 502 }
    )
  }

  const response = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
  })

  if (typeof res.headers.getSetCookie === 'function') {
    for (const c of res.headers.getSetCookie()) {
      response.headers.append('Set-Cookie', c)
    }
  } else {
    const single = res.headers.get('set-cookie')
    if (single) response.headers.append('Set-Cookie', single)
  }

  res.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (k === 'set-cookie') return
    if (['transfer-encoding', 'connection'].includes(k)) return
    response.headers.set(key, value)
  })

  return response
}

export async function GET(request, context) {
  return proxyRequest(request, context)
}
export async function POST(request, context) {
  return proxyRequest(request, context)
}
export async function PUT(request, context) {
  return proxyRequest(request, context)
}
export async function PATCH(request, context) {
  return proxyRequest(request, context)
}
export async function DELETE(request, context) {
  return proxyRequest(request, context)
}
export async function OPTIONS(request, context) {
  return proxyRequest(request, context)
}
