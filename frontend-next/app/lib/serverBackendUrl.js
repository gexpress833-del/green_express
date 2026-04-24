/**
 * URL du backend Laravel pour les Route Handlers (proxy serveur uniquement).
 * Préférer `localhost` plutôt que 127.0.0.1 pour coller au navigateur sur http://localhost:3000 (cookies / CSRF).
 */
export function serverBackendOrigin() {
  const t =
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_PROXY_TARGET ||
    'http://localhost:8000'
  return t.replace(/\/$/, '')
}
