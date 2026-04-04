import { filterNavByPermissions } from '@/lib/navPermissions'

/**
 * Entrées du menu secrétariat : chaque nouvelle page /secretaire/… doit être déclarée ici
 * pour apparaître quand l’admin accorde la permission correspondante.
 *
 * - `always` : toujours visible pour le rôle secrétariat (point d’entrée du tableau de bord)
 * - `permission` : une permission requise
 * - `anyOf` : au moins une des permissions requise
 */
export const SECRETAIRE_NAV_CONFIG = [
  {
    href: '/secretaire',
    label: "Vue d'ensemble",
    always: true,
    isActive: (pathname) => pathname === '/secretaire',
  },
  {
    href: '/secretaire/orders',
    label: 'Commandes & livreurs',
    anyOf: ['orders.list', 'orders.view'],
    isActive: (pathname) => pathname.startsWith('/secretaire/orders'),
  },
  {
    href: '/secretaire/flux',
    label: 'Flux livraisons',
    anyOf: ['orders.list', 'livreur.assignments.view-all', 'orders.assign-livreur'],
    isActive: (pathname) => pathname.startsWith('/secretaire/flux'),
  },
  {
    href: '/secretaire/event-requests',
    label: 'Demandes événements',
    permission: 'admin.event-requests',
    isActive: (pathname) => pathname.startsWith('/secretaire/event-requests'),
  },
]

/** @deprecated utiliser filterNavByPermissions(items, user, { requireRole: 'secretaire' }) */
export function filterSecretaireNavItems(items, user) {
  return filterNavByPermissions(items, user, { requireRole: 'secretaire' })
}

/** Actions rapides (hors « Vue d’ensemble ») — mêmes règles que le menu. */
export function getSecretaireQuickActions(user) {
  return filterSecretaireNavItems(
    SECRETAIRE_NAV_CONFIG.filter((item) => !item.always),
    user
  )
}
