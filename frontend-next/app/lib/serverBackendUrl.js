/**
 * URL du backend Laravel pour les Route Handlers (proxy serveur uniquement).
 * Ordre de résolution :
 *   1. API_PROXY_TARGET           (variable serveur dédiée, recommandée)
 *   2. NEXT_PUBLIC_API_PROXY_TARGET
 *   3. NEXT_PUBLIC_API_URL        (fallback : si configuré pour pointer vers le backend
 *                                   distant, ex. Render). Le client utilise quand même
 *                                   l'origine courante grâce à apiBase.js (HTTPS only).
 *   4. http://localhost:8000      (dev local par défaut)
 *
 * Garde-fou : si la valeur résolue ressemble à l'URL du front (vercel.app, le host
 * courant…), on retombe sur localhost pour éviter une boucle proxy → soi-même.
 */
export function serverBackendOrigin() {
  const candidates = [
    process.env.API_PROXY_TARGET,
    process.env.NEXT_PUBLIC_API_PROXY_TARGET,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter(Boolean)

  for (const raw of candidates) {
    const t = String(raw).replace(/\/$/, '')
    try {
      // Évite la boucle si NEXT_PUBLIC_API_URL pointe vers le domaine Vercel du front.
      if (/vercel\.app$/i.test(new URL(t).hostname)) continue
    } catch {
      continue
    }
    return t
  }
  return 'http://localhost:8000'
}
