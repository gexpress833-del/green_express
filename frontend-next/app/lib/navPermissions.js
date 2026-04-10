import { canPerform } from '@/lib/permissions'

/**
 * Filtre des entrées de navigation selon les permissions Spatie / API.
 *
 * - `always` : toujours afficher (ex. tableau de bord du rôle)
 * - `permission: null` : toujours afficher (ex. profil)
 * - `permission` : permission unique requise
 * - `anyOf` : au moins une permission requise
 *
 * @param {object} opts
 * @param {string} [opts.requireRole] — si défini, exige `user.role === requireRole`
 */
export function filterNavByPermissions(items, user, opts = {}) {
  const { requireRole } = opts
  if (!user) return []
  if (requireRole && user.role !== requireRole) return []
  return items.filter((item) => {
    if (item.always) return true
    if (Object.prototype.hasOwnProperty.call(item, 'permission') && item.permission === null) {
      return true
    }
    if (Array.isArray(item.anyOf) && item.anyOf.length > 0) {
      return item.anyOf.some((p) => canPerform(p, user))
    }
    if (item.permission) {
      return canPerform(item.permission, user)
    }
    return true
  })
}
