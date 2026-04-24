/**
 * Réécrit un en-tête Set-Cookie provenant d'un backend distant (ex: Laravel sur Render)
 * pour qu'il soit accepté par le navigateur sur le domaine courant (ex: Vercel).
 *
 * Actions :
 *  - Supprime la directive `Domain=...` → le cookie sera posé sur l'host courant.
 *  - Garantit `Path=/` si manquant.
 *  - Ajoute `Secure` si la requête est HTTPS.
 *  - Normalise `SameSite` à `Lax` si absent (compatible navigateur/CSRF).
 *
 * Utilisé par les route handlers proxy (/api/*, /sanctum/csrf-cookie) afin de
 * partager session & XSRF token entre le domaine front et le backend.
 */
export function rewriteProxiedSetCookie(cookie, { secure = true } = {}) {
  if (typeof cookie !== 'string' || !cookie) return cookie

  // Supprime Domain=...; (avec ou sans espace autour de =, insensible à la casse)
  let out = cookie.replace(/;\s*Domain=[^;]*/gi, '')

  // Path=/ obligatoire pour être envoyé sur toutes les requêtes
  if (!/;\s*Path=/i.test(out)) {
    out += '; Path=/'
  }

  // Secure en HTTPS (prod)
  if (secure && !/;\s*Secure\b/i.test(out)) {
    out += '; Secure'
  }

  // SameSite=Lax par défaut si non précisé (compat majorité des flux CSRF)
  if (!/;\s*SameSite=/i.test(out)) {
    out += '; SameSite=Lax'
  }

  return out
}
