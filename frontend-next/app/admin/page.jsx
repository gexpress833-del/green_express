"use client"
import GoldButton from '@/components/GoldButton'
import Sidebar from '@/components/Sidebar'
import DashboardGreeting from '@/components/DashboardGreeting'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'
import dashStyles from './admin-dashboard.module.css'

/** Devise d'affichage des revenus sur le tableau de bord (cohérent avec l'usage RDC). */
const DASHBOARD_REVENUE_CURRENCY = 'CDF'

function formatCurrency(amount, currency) {
  if (amount == null || typeof amount !== 'number') return '—'
  const code = currency === 'CDF' ? 'CDF' : (currency || 'USD')
  const locale = code === 'CDF' ? 'fr-CD' : 'en-US'
  const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount)
  return code === 'CDF' ? formatted.replace('CDF', 'FC') : formatted
}

/** Libellé statut menu pour affichage (cohérent avec le thème admin). */
function menuStatusLabel(status) {
  if (!status) return '—'
  const map = {
    approved: 'Approuvé',
    pending: 'En attente',
    draft: 'Brouillon',
    rejected: 'Refusé',
  }
  return map[status] ?? status
}

/** Prix menu : sans devise en base (souvent null sur d’anciennes lignes), on utilise la même devise que le tableau de bord. */
function formatMenuPrice(menu) {
  if (menu.price == null || menu.price === '') return '—'
  const n = Number(menu.price)
  if (Number.isNaN(n)) return '—'
  const code =
    menu.currency && ['USD', 'CDF'].includes(menu.currency)
      ? menu.currency
      : DASHBOARD_REVENUE_CURRENCY
  return formatCurrency(n, code)
}

/** Affiche la date « demain » exploitation (API renvoie souvent Y-m-d). */
function formatOperationalDate(isoDate) {
  if (!isoDate) return null
  try {
    const d = new Date(`${isoDate}T12:00:00`)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
  } catch {
    return null
  }
}

const OP_SUBSCRIPTION_TILES = [
  { key: 'active', label: 'Actifs', tone: 'emerald' },
  { key: 'scheduled', label: 'Planifiés', tone: 'sky' },
  { key: 'pending', label: 'En attente', tone: 'amber' },
  { key: 'expired', label: 'Expirés', tone: 'rose' },
]

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [opStats, setOpStats] = useState(null)
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [s, m, o] = await Promise.all([
          apiRequest('/api/admin/stats', { method: 'GET' }),
          apiRequest('/api/menus?recent=1', { method: 'GET' }),
          apiRequest('/api/operational/subscriptions/stats', { method: 'GET' }).catch(() => null),
        ])
        if (!mounted) return
        setStats(s)
        setOpStats(o)
        setMenus(Array.isArray(m) ? m : (m?.data ?? []))
        setLoadedAt(new Date())
      } catch (err) {
        if (!mounted) return
        console.error('Erreur chargement stats admin:', err)
        setStats(null)
        setOpStats(null)
        setMenus([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <section className={`page-section page-section--admin-tight min-h-screen ${dashStyles.adminShell} ${dashStyles.adminPageSection}`}>
      <div className={dashStyles.adminAmbient} aria-hidden />
      <div className={dashStyles.adminGrid} aria-hidden />
      <div className={`w-full ${dashStyles.adminInner}`}>
        <DashboardGreeting
          className={dashStyles.greetingHeader}
          nameHighlightClassName={dashStyles.greetingName}
          compact
        >
          <h1 className={dashStyles.pageTitle}>
            Tableau de bord Admin
          </h1>
          <p className={dashStyles.pageSubtitle}>
            Vue d&apos;ensemble des indicateurs — statistiques, menus, promotions et gestion utilisateurs.
          </p>
        </DashboardGreeting>

        <div className="dashboard-grid">
          <Sidebar />

          <main className="main-panel min-w-0">
            {loading ? (
              <div className={`${dashStyles.panelGlass} ${dashStyles.loadingPanel}`} aria-busy="true" aria-live="polite">
                <div className={dashStyles.skeletonLine} />
                <div className={dashStyles.skeletonLineWide} />
                <div className={dashStyles.skeletonGrid}>
                  <div className={dashStyles.skeletonStat} />
                  <div className={dashStyles.skeletonStat} />
                  <div className={dashStyles.skeletonStat} />
                  <div className={dashStyles.skeletonStat} />
                </div>
                <div className={dashStyles.skeletonBlock} />
                <p className={dashStyles.loadingLabel}>
                  <span className={dashStyles.loadingDot} aria-hidden />
                  Chargement des indicateurs…
                </p>
              </div>
            ) : !stats ? (
              <div className={`${dashStyles.panelGlass} ${dashStyles.errorPanel}`}>
                <p className="text-red-300 mb-2 font-medium">Impossible de charger les statistiques.</p>
                <p className="text-white/65 text-sm">
                  Vérifiez la connexion au serveur ou réessayez plus tard.
                </p>
              </div>
            ) : (
              <>
                {/* Indicateurs clés — source : API / base de données */}
                <div className={`flex flex-wrap items-center justify-between gap-2 ${dashStyles.adminEyebrowRow}`}>
                  <h2 className={dashStyles.sectionEyebrow}>
                    Indicateurs clés
                  </h2>
                  <p className="text-xs text-white/40" title="Source des données">
                    Données issues de la base de données
                    {loadedAt && (
                      <span> · Actualisées à {loadedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </p>
                </div>
                {opStats && (
                  <>
                    <p className={dashStyles.opSectionCaption}>
                      Exploitation & abonnements : indicateurs calculés à la volée depuis la base à chaque chargement de la page
                      {loadedAt && (
                        <span className="text-white/50"> (même actualisation que l’horodatage ci-dessus).</span>
                      )}
                    </p>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 ${dashStyles.opRow}`}>
                      <div className={`${dashStyles.opCard} ${dashStyles.opCardEmerald} ${dashStyles.opCardPro}`}>
                        <div className={dashStyles.opCardHeader}>
                          <div>
                            <p className={dashStyles.opCardKicker}>Production</p>
                            <h3 className={dashStyles.opCardTitle}>Demain (exploitation)</h3>
                          </div>
                          {opStats.tomorrow?.is_weekend ? (
                            <span className={`${dashStyles.opCardBadge} ${dashStyles.opCardBadgeWeekend}`}>Jour non ouvré</span>
                          ) : (
                            (formatOperationalDate(opStats.tomorrow?.date) || opStats.tomorrow?.weekday_label) && (
                              <span className={dashStyles.opCardBadge}>
                                {formatOperationalDate(opStats.tomorrow?.date) ?? opStats.tomorrow?.weekday_label}
                              </span>
                            )
                          )}
                        </div>
                        {opStats.tomorrow?.is_weekend ? (
                          <p className={dashStyles.opTomorrowHint}>
                            Aucun repas à préparer — le réseau ne livre pas ce jour-là.
                          </p>
                        ) : (
                          <div className={dashStyles.opTomorrowBody}>
                            <div className={dashStyles.opTomorrowMain}>
                              <span className={dashStyles.opTomorrowValue}>
                                {opStats.tomorrow?.meal_count ?? '—'}
                              </span>
                              <span className={dashStyles.opTomorrowUnit}>repas à préparer</span>
                            </div>
                            {opStats.tomorrow?.menu_summary && (
                              <p className={dashStyles.opMenuSummary} title={opStats.tomorrow.menu_summary}>
                                {opStats.tomorrow.menu_summary}
                              </p>
                            )}
                            <div className={dashStyles.opMetaStrip}>
                              <span>
                                <strong>{opStats.tomorrow?.client_count ?? 0}</strong> client(s)
                              </span>
                              {opStats.tomorrow?.weekday_label && (
                                <>
                                  <span className={dashStyles.opMetaDot} aria-hidden>·</span>
                                  <span>{opStats.tomorrow.weekday_label}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`${dashStyles.opCard} ${dashStyles.opCardPro}`}>
                        <div className={dashStyles.opCardHeader}>
                          <div>
                            <p className={dashStyles.opCardKicker}>Portefeuille</p>
                            <h3 className={dashStyles.opCardTitle}>Abonnements particuliers</h3>
                          </div>
                        </div>
                        <div className={dashStyles.opStatGrid}>
                          {OP_SUBSCRIPTION_TILES.map((tile) => {
                            const raw = opStats.subscriptions?.[tile.key]
                            const val = raw == null ? '—' : raw
                            return (
                              <div
                                key={tile.key}
                                className={dashStyles.opStatTile}
                                data-tone={tile.tone}
                              >
                                <span className={dashStyles.opStatValue}>{val}</span>
                                <span className={dashStyles.opStatLabel}>{tile.label}</span>
                              </div>
                            )
                          })}
                        </div>
                        <div className={dashStyles.opCardFooter}>
                          {opStats.scheduled_starting_tomorrow > 0 && (
                            <p className={dashStyles.opCardFooterNote}>
                              {opStats.scheduled_starting_tomorrow} abonnement(s) planifié(s) pour démarrer demain
                            </p>
                          )}
                          <Link href="/admin/subscriptions" className={dashStyles.opCardFooterLink}>
                            Gérer les abonnements →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="stats-row">
                  <div className="stat-card">
                    <h4>Commandes</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{stats?.orders ?? '—'}</p>
                    <Link href="/admin/orders" className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block font-medium">
                      Voir toutes les commandes →
                    </Link>
                  </div>
                  <div className="stat-card">
                    <h4>Revenus totaux</h4>
                    <p className="text-2xl sm:text-3xl font-bold tabular-nums">
                      {formatCurrency(stats?.revenue ?? 0, DASHBOARD_REVENUE_CURRENCY)}
                    </p>
                    <p className="text-xs text-white/40 mt-2 leading-snug">
                      Toutes commandes confondues
                    </p>
                  </div>
                  <div className="stat-card">
                    <h4>Abonnements</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{stats?.subscriptions ?? '—'}</p>
                    <Link href="/admin/subscriptions" className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block font-medium">
                      Gérer les abonnements →
                    </Link>
                  </div>
                  <div className="stat-card">
                    <h4>Menus</h4>
                    <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{stats?.menus ?? '—'}</p>
                    <p className="text-xs text-white/40 mt-2 leading-snug">
                      En attente d&apos;approbation :{' '}
                      <span className="text-amber-300 font-medium">{stats?.pending_menus ?? 0}</span>
                    </p>
                  </div>
                </div>

                {/* Menus récents — source : GET /api/menus?recent=1 */}
                <section className={`card mt-4 ${dashStyles.adminCardTight} ${dashStyles.menusRecentSection}`} aria-labelledby="menus-recents-heading">
                  <h3 id="menus-recents-heading" className={dashStyles.menusRecentTitle}>
                    Menus récents
                  </h3>
                  <p className={dashStyles.menusRecentSubtitle}>
                    Aperçu des derniers menus (source : base de données).
                  </p>
                  <div className={dashStyles.menusRecentCta}>
                    <GoldButton href="/admin/menus">Gérer tous les menus</GoldButton>
                  </div>
                  <div className={dashStyles.menusTableViewport}>
                    <div className={dashStyles.menusTableShell}>
                      <table className={dashStyles.menusTable} role="table" aria-label="Menus récents">
                        <thead>
                          <tr>
                            <th scope="col">Nom</th>
                            <th scope="col">Créateur</th>
                            <th scope="col">Statut</th>
                            <th scope="col" className={dashStyles.menusTableThPrice}>
                              Prix
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {menus.map((menu) => (
                            <tr key={menu.id}>
                              <td className={dashStyles.menusTableCellName}>
                                {menu.name ?? menu.title ?? '—'}
                              </td>
                              <td className={dashStyles.menusTableCellCreator}>
                                {menu.creator?.name ?? '—'}
                              </td>
                              <td>
                                <span
                                  className={
                                    menu.status === 'approved'
                                      ? dashStyles.menusBadgeApproved
                                      : menu.status === 'pending'
                                        ? dashStyles.menusBadgePending
                                        : dashStyles.menusBadgeNeutral
                                  }
                                >
                                  {menuStatusLabel(menu.status)}
                                </span>
                              </td>
                              <td className={dashStyles.menusTableCellPrice}>
                                {formatMenuPrice(menu)}
                              </td>
                            </tr>
                          ))}
                          {!loading && menus.length === 0 && (
                            <tr>
                              <td colSpan={4} className={dashStyles.menusTableEmpty}>
                                Aucun menu récent.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* Actions rapides */}
                <section className={`card mt-4 ${dashStyles.adminCardTight}`} aria-labelledby="actions-heading">
                  <h3 id="actions-heading" className={`${dashStyles.sectionTitle} mb-1`}>
                    Actions rapides
                  </h3>
                  <p className="text-white/60 text-sm mb-4">Accès directs aux principales fonctions d&apos;administration.</p>
                  <div className={dashStyles.adminQuickActions}>
                    <GoldButton href="/admin/menus">Valider les menus</GoldButton>
                    <GoldButton href="/admin/promotions">Créer une promotion</GoldButton>
                    <GoldButton href="/admin/users">Gérer les utilisateurs</GoldButton>
                    <GoldButton href="/admin/reports">Générer des rapports</GoldButton>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
