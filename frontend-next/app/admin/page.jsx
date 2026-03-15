"use client"
import GoldButton from '@/components/GoldButton'
import Sidebar from '@/components/Sidebar'
import DashboardGreeting from '@/components/DashboardGreeting'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'

/** Devise d'affichage des revenus sur le tableau de bord (cohérent avec l'usage RDC). */
const DASHBOARD_REVENUE_CURRENCY = 'CDF'

function formatCurrency(amount, currency) {
  if (amount == null || typeof amount !== 'number') return '—'
  const code = currency === 'CDF' ? 'CDF' : (currency || 'USD')
  const locale = code === 'CDF' ? 'fr-CD' : 'en-US'
  const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount)
  return code === 'CDF' ? formatted.replace('CDF', 'FC') : formatted
}

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [s, m] = await Promise.all([
          apiRequest('/api/admin/stats', { method: 'GET' }),
          apiRequest('/api/menus?recent=1', { method: 'GET' }),
        ])
        if (!mounted) return
        setStats(s)
        setMenus(Array.isArray(m) ? m : (m?.data ?? []))
        setLoadedAt(new Date())
      } catch (err) {
        if (!mounted) return
        console.error('Erreur chargement stats admin:', err)
        setStats(null)
        setMenus([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container px-3 sm:px-4">
        <DashboardGreeting>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight" style={{
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Tableau de bord Admin
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl">
            Vue d&apos;ensemble des indicateurs — statistiques, menus, promotions et gestion utilisateurs.
          </p>
        </DashboardGreeting>

        <div className="dashboard-grid">
          <Sidebar />

          <main className="main-panel min-w-0">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement des indicateurs...</p>
              </div>
            ) : !stats ? (
              <div className="card text-center py-12">
                <p className="text-red-300 mb-2">Impossible de charger les statistiques.</p>
                <p className="text-white/60 text-sm">
                  Vérifiez la connexion au serveur ou réessayez plus tard.
                </p>
              </div>
            ) : (
              <>
                {/* Indicateurs clés — source : API / base de données */}
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                    Indicateurs clés
                  </h2>
                  <p className="text-xs text-white/40" title="Source des données">
                    Données issues de la base de données
                    {loadedAt && (
                      <span> · Actualisées à {loadedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </p>
                </div>
                <div className="stats-row">
                  <div className="stat-card">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Commandes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{stats?.orders ?? '—'}</p>
                    <Link href="/admin/orders" className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block font-medium">
                      Voir toutes les commandes →
                    </Link>
                  </div>
                  <div className="stat-card">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Revenus totaux</p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-300 tabular-nums">
                      {formatCurrency(stats?.revenue ?? 0, DASHBOARD_REVENUE_CURRENCY)}
                    </p>
                    <p className="text-xs text-white/40 mt-2">Toutes commandes confondues</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Abonnements</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{stats?.subscriptions ?? '—'}</p>
                    <Link href="/admin/subscriptions" className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block font-medium">
                      Gérer les abonnements →
                    </Link>
                  </div>
                  <div className="stat-card">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Menus</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{stats?.menus ?? '—'}</p>
                    <p className="text-xs text-white/40 mt-2">
                      En attente d&apos;approbation : <span className="text-amber-300 font-medium">{stats?.pending_menus ?? 0}</span>
                    </p>
                  </div>
                </div>

                {/* Menus récents — source : GET /api/menus?recent=1 */}
                <section className="card mt-6" aria-labelledby="menus-recents-heading">
                  <h3 id="menus-recents-heading" className="text-lg font-semibold text-white mb-1">
                    Menus récents
                  </h3>
                  <p className="text-white/60 text-sm mb-4">
                    Aperçu des derniers menus (source : base de données).
                  </p>
                  <div className="mb-4">
                    <GoldButton href="/admin/menus">Gérer tous les menus</GoldButton>
                  </div>
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-left text-sm min-w-[400px]">
                      <thead>
                        <tr className="border-b border-white/10 text-white/70">
                          <th className="py-3 px-2 font-semibold">Nom</th>
                          <th className="py-3 px-2 font-semibold">Créateur</th>
                          <th className="py-3 px-2 font-semibold">Statut</th>
                          <th className="py-3 px-2 font-semibold">Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menus.map((menu) => (
                          <tr key={menu.id} className="border-b border-white/5">
                            <td className="py-3 px-2 text-white/90">{menu.name ?? menu.title ?? '—'}</td>
                            <td className="py-3 px-2 text-white/80">{menu.creator?.name ?? '—'}</td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${menu.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : menu.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/70'}`}>
                                {menu.status ?? '—'}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-white/80 tabular-nums">
                              {(menu.price != null && ['USD', 'CDF'].includes(menu.currency)) ? formatCurrency(menu.price, menu.currency) : '—'}
                            </td>
                          </tr>
                        ))}
                        {!loading && menus.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-white/50">Aucun menu récent.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Actions rapides */}
                <section className="card mt-6" aria-labelledby="actions-heading">
                  <h3 id="actions-heading" className="text-lg font-semibold text-white mb-1">
                    Actions rapides
                  </h3>
                  <p className="text-white/60 text-sm mb-4">Accès directs aux principales fonctions d&apos;administration.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
