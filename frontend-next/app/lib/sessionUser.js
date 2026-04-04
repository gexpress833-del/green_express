/**
 * Valide l’objet renvoyé par GET /api/user ou POST /api/login.
 * Sans identifiant ni rôle métier, on ne considère pas la session exploitable
 * (évite navbar « connectée » + profil vide + libellé « Utilisateur »).
 */
export function normalizeSessionUser(data) {
  if (data == null || typeof data !== 'object') return null
  const id = data.id
  if (id === undefined || id === null) return null
  const raw = data.role
  if (raw == null || String(raw).trim() === '') return null
  const role = String(raw).toLowerCase().trim()
  return { ...data, role }
}
