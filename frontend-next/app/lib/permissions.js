/**
 * Utilitaire de vérification des permissions et rôles côté frontend.
 * 
 * Utilisation:
 * import { canAccess, hasRole, canPerform } from '@/lib/permissions'
 * 
 * if (canAccess('admin')) {
 *   // Afficher panneau admin
 * }
 * 
 * if (canPerform('orders.create')) {
 *   // Afficher bouton créer commande
 * }
 */

// Définition des rôles et permissions
const ROLES_CONFIG = {
  'admin': {
    label: 'Administrateur',
    permissions: [
      'users.create', 'users.edit', 'users.delete', 'users.list',
      'menus.create', 'menus.edit', 'menus.delete', 'menus.list', 'menus.approve',
      'orders.list', 'orders.view', 'orders.cancel',
      'stats.admin.view', 'stats.client.view', 'stats.cuisinier.view',
      'promotions.manage',
    ]
  },
  'cuisinier': {
    label: 'Cuisinier',
    permissions: [
      'menus.create', 'menus.edit-own', 'menus.delete-own',
      'orders.view-own-menus',
      'stats.cuisinier.view',
    ]
  },
  'client': {
    label: 'Client',
    permissions: [
      'menus.view', 'menus.browse',
      'orders.create', 'orders.view-own', 'orders.cancel-own',
      'promotions.view', 'promotions.claim',
      'subscriptions.manage',
      'stats.client.view',
    ]
  },
  'livreur': {
    label: 'Livreur',
    permissions: [
      'orders.view-assignments', 'orders.update-delivery',
      'stats.livreur.view',
    ]
  },
  'verificateur': {
    label: 'Vérificateur',
    permissions: [
      'promotions.validate',
      'stats.verificateur.view',
    ]
  },
  'entreprise': {
    label: 'Chef d\'entreprise',
    permissions: [
      'users.view-own',
      'orders.view-own',
      'subscriptions.manage',
      'stats.entreprise.view',
    ]
  },
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique.
 * @param {string} role - Rôle à vérifier (ex: 'admin', 'client')
 * @param {object} user - Objet utilisateur (optionnel, utilise localStorage si non fourni)
 * @returns {boolean}
 */
export function hasRole(role, user = null) {
  if (!user && typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    user = userStr ? JSON.parse(userStr) : null
  }
  
  return user && user.role === role
}

/**
 * Vérifie si l'utilisateur a accès à un rôle spécifique (pour les gardes).
 * @param {string|array} roles - Rôle(s) autorisé(s)
 * @param {object} user - Objet utilisateur (optionnel)
 * @returns {boolean}
 */
export function canAccess(roles, user = null) {
  if (!user && typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    user = userStr ? JSON.parse(userStr) : null
  }
  
  if (!user) return false
  
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  return rolesArray.includes(user.role)
}

/**
 * Vérifie si l'utilisateur a une permission spécifique.
 * @param {string} permission - Permission à vérifier (ex: 'users.create')
 * @param {object} user - Objet utilisateur (optionnel)
 * @returns {boolean}
 */
export function canPerform(permission, user = null) {
  if (!user && typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    user = userStr ? JSON.parse(userStr) : null
  }
  
  if (!user || !user.role) return false
  
  const roleConfig = ROLES_CONFIG[user.role]
  if (!roleConfig) return false
  
  return roleConfig.permissions.includes(permission)
}

/**
 * Retourne toutes les permissions de l'utilisateur.
 * @param {string} role - Rôle (optionnel, utilise le rôle de l'utilisateur storé si non fourni)
 * @returns {array}
 */
export function getPermissions(role = null) {
  if (!role && typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    role = user ? user.role : null
  }
  
  if (!role) return []
  
  const roleConfig = ROLES_CONFIG[role]
  return roleConfig ? roleConfig.permissions : []
}

/**
 * Retourne les informations complètes d'un rôle.
 * @param {string} role - Rôle
 * @returns {object|null}
 */
export function getRoleInfo(role) {
  return ROLES_CONFIG[role] || null
}

/**
 * Retourne tous les rôles disponibles.
 * @returns {array}
 */
export function getAllRoles() {
  return Object.keys(ROLES_CONFIG)
}

/**
 * Vérifie si l'utilisateur est propriétaire de la ressource ou admin.
 * @param {number} ownerId - ID du propriétaire
 * @param {object} user - Objet utilisateur (optionnel)
 * @returns {boolean}
 */
export function isOwnerOrAdmin(ownerId, user = null) {
  if (!user && typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    user = userStr ? JSON.parse(userStr) : null
  }
  
  return user && (user.id === ownerId || user.role === 'admin')
}

/**
 * Retourne le label d'un rôle.
 * @param {string} role - Rôle
 * @returns {string}
 */
export function getRoleLabel(role) {
  const config = ROLES_CONFIG[role]
  return config ? config.label : role
}

/**
 * Chemin du tableau de bord selon le rôle (aligné sur la page login : /{role}).
 * @param {string|null|undefined} role
 * @returns {string}
 */
export function getDashboardPathForRole(role) {
  const r = String(role || 'client').toLowerCase()
  if (Object.prototype.hasOwnProperty.call(ROLES_CONFIG, r)) {
    return `/${r}`
  }
  return '/client'
}

const permissions = {
  hasRole,
  canAccess,
  canPerform,
  getPermissions,
  getRoleInfo,
  getAllRoles,
  isOwnerOrAdmin,
  getRoleLabel,
  getDashboardPathForRole,
}

export default permissions
