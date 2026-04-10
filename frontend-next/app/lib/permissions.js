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

/**
 * Repli UI si l’API ne renvoie pas encore `user.permissions` (aligné sur backend/config/roles.php).
 */
const ROLES_CONFIG = {
  admin: {
    label: 'Administrateur',
    permissions: [
      'users.create',
      'users.edit',
      'users.delete',
      'users.assign-role',
      'users.list',
      'menus.create',
      'menus.edit',
      'menus.delete',
      'menus.view',
      'menus.approve',
      'menus.reject',
      'menus.list',
      'orders.create',
      'orders.edit',
      'orders.delete',
      'orders.view',
      'orders.list',
      'orders.cancel',
      'promotions.create',
      'promotions.edit',
      'promotions.delete',
      'promotions.view',
      'promotions.claim',
      'promotions.list',
      'promotions.manage',
      'stats.admin.view',
      'stats.client.view',
      'stats.cuisinier.view',
      'stats.livreur.view',
      'stats.verificateur.view',
      'stats.entreprise.view',
      'subscriptions.create',
      'subscriptions.edit',
      'subscriptions.delete',
      'subscriptions.list',
      'roles.manage_permissions',
      'admin.companies',
      'admin.payments',
      'admin.reports',
      'admin.deliveries',
      'admin.event-requests',
      'admin.event-types',
      'admin.notifications.broadcast',
      'admin.subscription-plans',
      'admin.subscriptions',
      'admin.company-subscriptions',
      'admin.operational',
      'admin.agents',
      'admin.exports',
      'operational.subscriptions.view',
    ],
  },
  cuisinier: {
    label: 'Cuisinier',
    permissions: [
      'menus.create',
      'menus.edit-own',
      'menus.delete-own',
      'menus.view-own',
      'menus.list-own',
      'orders.view-own-menus',
      'orders.list-own-menus',
      'orders.change-status',
      'orders.assign-livreur',
      'stats.cuisinier.view',
      'operational.subscriptions.view',
    ],
  },
  client: {
    label: 'Client',
    permissions: [
      'menus.view-approved',
      'menus.list-approved',
      'orders.create',
      'orders.view-own',
      'orders.list-own',
      'orders.cancel-own',
      'promotions.view',
      'promotions.claim',
      'promotions.list',
      'subscriptions.create',
      'subscriptions.cancel-own',
      'subscriptions.view-own',
      'stats.client.view',
    ],
  },
  livreur: {
    label: 'Livreur',
    permissions: [
      'orders.view-assignments',
      'orders.list-assignments',
      'orders.update-delivery-status',
      'orders.validate-delivery-code',
      'stats.livreur.view',
    ],
  },
  verificateur: {
    label: 'Vérificateur',
    permissions: [
      'promotions.validate-ticket',
      'promotions.view',
      'promotions.list',
      'stats.verificateur.view',
    ],
  },
  entreprise: {
    label: "Chef d'entreprise",
    permissions: [
      'entreprise.b2b.access',
      'company.employees.manage',
      'b2b.meal-plans.manage',
      'users.view-own',
      'users.list-own',
      'orders.view-own',
      'orders.list-own',
      'subscriptions.create',
      'subscriptions.view-own',
      'subscriptions.list-own',
      'stats.entreprise.view',
    ],
  },
  secretaire: {
    label: 'Secrétariat',
    permissions: [
      'orders.list',
      'orders.view',
      'orders.edit',
      'orders.assign-livreur',
      'livreur.assignments.view-all',
      'stats.secretaire.view',
      'admin.event-requests',
    ],
  },
  agent: {
    label: 'Agent',
    permissions: [
      'menus.view-approved',
      'menus.list-approved',
      'agent.dashboard',
      'agent.meal-plans',
    ],
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

  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(permission)
  }

  const roleConfig = ROLES_CONFIG[user.role]
  if (!roleConfig) return false

  return roleConfig.permissions.includes(permission)
}

/**
 * Retourne toutes les permissions de l'utilisateur.
 * @param {string} role - Rôle (optionnel, utilise le rôle de l'utilisateur storé si non fourni)
 * @returns {array}
 */
export function getPermissions(role = null, user = null) {
  if (!user && typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    user = userStr ? JSON.parse(userStr) : null
  }

  if (user && Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions
  }

  if (!role && user) {
    role = user.role
  }
  if (!role && typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    const u = userStr ? JSON.parse(userStr) : null
    role = u ? u.role : null
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
 * Rôles connus côté API (UserController) — chaque rôle a une route /{role} dans le front.
 * Ne pas retomber sur /client pour un rôle staff inconnu : préférer /profile.
 */
const DASHBOARD_ROLE_ORDER = [
  'admin', 'cuisinier', 'client', 'livreur', 'verificateur', 'entreprise', 'secretaire', 'agent',
]

/**
 * Chemin du tableau de bord selon le rôle (aligné sur la page login : /{role}).
 * @param {string|null|undefined} role
 * @returns {string}
 */
export function getDashboardPathForRole(role) {
  if (role == null || String(role).trim() === '') return '/client'
  const r = String(role).toLowerCase().trim()
  if (Object.prototype.hasOwnProperty.call(ROLES_CONFIG, r)) {
    return `/${r}`
  }
  if (DASHBOARD_ROLE_ORDER.includes(r)) {
    return `/${r}`
  }
  return '/profile'
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
