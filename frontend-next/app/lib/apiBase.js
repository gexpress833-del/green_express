/**
 * Origine des appels API (fetch, URLs média).
 * En dev avec Next sur :3000 et Laravel sur :8000, utiliser la même origine que la page
 * + rewrites (next.config.js) pour que le cookie XSRF soit lisible en JS (évite 419 CSRF).
 */
function resolveApiBase() {
  const raw = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : null;
  const env = raw ? String(raw).replace(/\/$/, '') : '';
  if (typeof window !== 'undefined') {
    const o = window.location.origin;
    if (!env || env === o) return o;
    try {
      const u = new URL(env);
      const { hostname, port } = window.location;
      const isLocal =
        (hostname === 'localhost' || hostname === '127.0.0.1') &&
        (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
      const envIsApiPort = u.port === '8000' || u.port === '8080' || u.port === '';
      const envIsFrontendPort = u.port === '3000' || u.port === '';
      const pageIsNext = port === '3000' || port === '';
      if (isLocal && envIsApiPort && pageIsNext && u.origin !== o) return o;
      if (isLocal && envIsFrontendPort && u.origin !== o) return o;
      // Prod (HTTPS) : les proxies /api/* et /sanctum/csrf-cookie sont en place
      // pour assurer une origine commune (cookies session + XSRF). Si NEXT_PUBLIC_API_URL
      // pointe vers un autre host (ex. backend Render), on utilise quand même l'origine
      // courante pour éviter les requêtes cross-site qui cassent CSRF/session.
      if (window.location.protocol === 'https:' && u.origin !== o) return o;
    } catch {
      /* ignore */
    }
    return env;
  }
  return env || 'http://127.0.0.1:8000';
}

export const API_BASE = resolveApiBase();
