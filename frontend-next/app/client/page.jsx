"use client"
import { useRouter } from 'next/navigation'
import ClientSidebar from '@/components/ClientSidebar'
import GoldButton from '@/components/GoldButton'
import DashboardGreeting from '@/components/DashboardGreeting'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/helpers'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useUnreadNotifications } from '@/lib/useUnreadNotifications'
import Link from 'next/link'

function subscriptionBannerCopy(ongoing) {
  if (!ongoing || ongoing.length === 0) return null
  const s = ongoing[0]
  const status = s.status
  const plan = s.plan || 'Abonnement'
  if (status === 'pending') {
    return {
      title: 'Abonnement en attente',
      line: `${plan} — validez le paiement ou attendez la confirmation de l’équipe.`,
      href: '/client/subscriptions#renew',
    }
  }
  if (status === 'scheduled' && s.started_at) {
    return {
      title: 'Abonnement planifié',
      line: `${plan} — démarre le ${formatDate(s.started_at)}.`,
      href: '/client/subscriptions#renew',
    }
  }
  if (status === 'active') {
    const end = s.expires_at || s.end_date
    const endStr = end ? formatDate(end) : null
    return {
      title: 'Abonnement repas actif',
      line: endStr ? `${plan} — jusqu’au ${endStr}.` : `${plan} — en cours.`,
      href: '/client/subscriptions#renew',
    }
  }
  return {
    title: 'Abonnement',
    line: plan,
    href: '/client/subscriptions#renew',
  }
}

/* ─── Formatage prix ─────────────────────────────────────────── */
function fmt(amount, currency) {
  const n = typeof amount === 'number' ? amount : parseFloat(amount)
  if (Number.isNaN(n)) return '—'
  const c = currency || 'USD'
  if (['USD', 'CDF'].includes(c)) {
    return new Intl.NumberFormat(c === 'USD' ? 'en-US' : 'fr-CD', {
      style: 'currency', currency: c,
    }).format(n)
  }
  return `${n.toFixed(2)} ${c}`
}

/* ─── Carte menu mobile ──────────────────────────────────────── */
function MobileMenuCard({ menu }) {
  const { addItem } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const ok = menu.is_available !== false && menu.status === 'approved'
  const detailHref = `/client/orders/create?menu_id=${menu.id}`

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!ok) return
    addItem(menu, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleCardClick = () => {
    if (ok) router.push(detailHref)
  }
  const handleCardKey = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && ok) {
      e.preventDefault()
      router.push(detailHref)
    }
  }

  return (
    <div
      role={ok ? 'button' : undefined}
      tabIndex={ok ? 0 : undefined}
      onClick={ok ? handleCardClick : undefined}
      onKeyDown={ok ? handleCardKey : undefined}
      aria-label={ok ? `Voir le détail de ${menu.name || menu.title}` : undefined}
      style={{
        borderRadius: 16,
        background: 'rgba(15,28,46,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        cursor: ok ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 120, background: '#1a2e4a', flexShrink: 0 }}>
        {menu.image && !imgErr
          ? <img src={menu.image} alt={menu.name} onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🍽️</div>
        }
        {Boolean(menu.is_popular) && (
          <span style={{ position: 'absolute', top: 7, left: 7, padding: '2px 7px', borderRadius: 99, background: 'rgba(245,158,11,0.9)', color: '#000', fontSize: 10, fontWeight: 800 }}>🔥</span>
        )}
        <span style={{ position: 'absolute', top: 7, right: 7, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', color: 'white', fontSize: 11, fontWeight: 700 }}>
          {fmt(menu.price, menu.currency)}
        </span>
        {!ok && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 8 }}>Indisponible</span>
          </div>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: '10px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          title={menu.name || menu.title}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            minHeight: 32,
          }}
        >
          {menu.name || menu.title}
        </div>
        <div
          title={menu.description || ''}
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            flex: 1,
          }}
        >
          {menu.description || '—'}
        </div>
        <button onClick={handleAdd} disabled={!ok} style={{
          marginTop: 4, width: '100%', padding: '7px 0', borderRadius: 10, border: 'none',
          background: ok
            ? (added ? 'rgba(34,197,94,0.8)' : 'linear-gradient(135deg,#f59e0b,#d97706)')
            : 'rgba(255,255,255,0.07)',
          color: ok ? (added ? 'white' : '#000') : 'rgba(255,255,255,0.25)',
          fontSize: 11, fontWeight: 800, cursor: ok ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}>
          {added ? '✓ Ajouté' : (ok ? '+ Ajouter' : 'Indispo')}
        </button>
      </div>
    </div>
  )
}

/* ─── Page principale ────────────────────────────────────────── */
export default function ClientDashboard() {
  const router = useRouter()
  const { user, initialised, refreshUser } = useAuth()
  const { itemCount: cartCount } = useCart()
  const { unreadCount: unreadNotifications, refreshUnreadCount } = useUnreadNotifications()

  /* Refresh badge immediately when tab regains focus (real-time feel). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onFocus = () => { refreshUnreadCount?.() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refreshUnreadCount])
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [menus, setMenus]   = useState([])
  const [promo, setPromo]   = useState(null)
  const [search, setSearch] = useState('')
  const [ongoingSubs, setOngoingSubs] = useState(null)

  /* Stats (session obligatoire ; skipSessionExpiredOn401 évite redirect sur 401 isolé) */
  const fetchStats = () => {
    apiRequest('/api/client/stats', { method: 'GET', skipSessionExpiredOn401: true })
      .then((r) => {
        setStats(r)
        setLoading(false)
      })
      .catch(async (err) => {
        if (err?.status === 401) await refreshUser()
        setStats((s) => s ?? { points: 0, orders: 0, subscriptions: 0 })
        setLoading(false)
      })
  }

  /* Menus : endpoint public (pas /api/menus/browse qui est derrière auth:api) */
  const fetchMenus = async () => {
    try {
      const r = await apiRequest('/api/menus/public/browse?status=approved&per_page=8', { method: 'GET' })
      let list = Array.isArray(r) ? r : (r?.data?.data || r?.data || [])
      setMenus(list.slice(0, 8))
    } catch { setMenus([]) }
  }

  /* Promo courante */
  const fetchPromo = async () => {
    try {
      const r = await apiRequest('/api/promotions?active_only=1&current=1', { method: 'GET' })
      const single = r && typeof r === 'object' && !Array.isArray(r) && r.id ? r : null
      if (single) { setPromo(single); return }
      const list = await apiRequest('/api/promotions?visible_to_client=1&per_page=1', { method: 'GET' })
      const arr = Array.isArray(list) ? list : (list?.data || [])
      setPromo(arr[0] ?? null)
    } catch { setPromo(null) }
  }

  useEffect(() => {
    if (!initialised) return
    fetchMenus()
    fetchPromo()
    let cancelled = false
    ;(async () => {
      if (!user) {
        setStats({ orders: 0, subscriptions: 0, points: 0 })
        setLoading(false)
        return
      }
      const me = await refreshUser()
      if (cancelled) return
      if (!me) {
        setStats({ orders: 0, subscriptions: 0, points: 0 })
        setLoading(false)
        return
      }
      fetchStats()
    })()
    return () => {
      cancelled = true
    }
  }, [initialised, user, refreshUser])

  useEffect(() => {
    if (!initialised || !user) {
      setOngoingSubs([])
      return
    }
    apiRequest('/api/subscriptions', { method: 'GET', skipSessionExpiredOn401: true })
      .then((r) => {
        const list = Array.isArray(r) ? r : []
        setOngoingSubs(list.filter((s) => s.status === 'pending' || s.status === 'active'))
      })
      .catch(async (err) => {
        if (err?.status === 401) await refreshUser()
        setOngoingSubs([])
      })
  }, [initialised, user, refreshUser])

  useEffect(() => {
    if (!user) return
    const t = setInterval(fetchStats, 30000)
    return () => clearInterval(t)
  }, [user])

  const goSearch = (e) => {
    e.preventDefault()
    router.push('/client/menus')
  }

  /* SVG bell icon — rendu garanti, pas d'emoji */
  const BellIcon = (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )

  /* ── Catégories / raccourcis nav mobile ── */
  const NAV = [
    { icon: '🍽️', label: 'Menus',        href: '/client/menus' },
    { icon: '🛒', label: 'Panier',        href: '/client/cart',                      badge: cartCount, badgeColor: '#fbbf24' },
    { icon: BellIcon, label: 'Notifications', href: '/notifications/historique',     badge: unreadNotifications, badgeColor: '#22d3ee', isBell: true },
    { icon: '🎁', label: 'Promos',        href: '/client/promotions' },
    { icon: '💳', label: 'Abonnements',   href: '/client/subscriptions#renew' },
    { icon: '👤', label: 'Profil',        href: '/profile' },
  ]

  const subBanner = subscriptionBannerCopy(ongoingSubs)

  /* ════════════════════════════════════════════════════════════ */
  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'order', 'claim']} showWarning={false}>

      {/* ══════════ LAYOUT MOBILE (< sm) ══════════ */}
      <div className="mobile-only" style={{ background: '#0b1220', minHeight: '100vh', paddingBottom: 32 }}>

        {subBanner && (
          <div style={{ padding: '14px 16px 0' }}>
            <Link
              href={subBanner.href}
              style={{
                display: 'block',
                padding: '12px 14px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(6,182,212,0.2) 100%)',
                border: '1px solid rgba(139,92,246,0.35)',
                textDecoration: 'none',
                color: 'inherit',
                minHeight: 44,
                boxSizing: 'border-box',
              }}
            >
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{subBanner.title}</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 1.4 }}>{subBanner.line}</p>
              <span className="client-stat-cta client-stat-cta--gold" style={{ marginTop: 10, width: '100%', boxSizing: 'border-box' }}>
                Gérer ou renouveler <span aria-hidden style={{ opacity: 0.9 }}>→</span>
              </span>
            </Link>
          </div>
        )}

        {/* ── Barre de recherche ── */}
        <div style={{ padding: '14px 16px 0' }}>
          <form onSubmit={goSearch} style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none', opacity: 0.5 }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher un plat..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '11px 12px 11px 36px',
                  borderRadius: 14, margin: 0,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: 14,
                }}
              />
            </div>
            <button type="submit" style={{
              padding: '11px 14px', borderRadius: 14, border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 17, flexShrink: 0,
            }}>⚙️</button>
          </form>
        </div>

        {/* ── Stats chips (cliquables → mêmes destinations que le tableau de bord desktop) ── */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {[
            { href: '/client/promotions', icon: '⭐', val: `${stats?.points ?? 0} pts`, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: '#fbbf24', label: 'Points fidélité et promos' },
            { href: '/client/orders', icon: '🛒', val: `${stats?.orders ?? 0} cmd`, bg: 'rgba(6,182,212,0.10)', border: 'rgba(6,182,212,0.35)', color: '#22d3ee', label: 'Mes commandes' },
            { href: '/client/subscriptions#renew', icon: '💳', val: `${stats?.subscriptions ?? 0} abo`, bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.35)', color: '#a78bfa', label: 'Mes abonnements repas' },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              aria-label={c.label}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 99,
                background: c.bg,
                border: `1px solid ${c.border}`,
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.15s ease, filter 0.15s ease',
              }}
            >
              <span style={{ fontSize: 15 }} aria-hidden>{c.icon}</span>
              <span style={{ color: c.color, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>{c.val}</span>
            </Link>
          ))}
        </div>

        {/* ── Navigation / catégories ── */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 16px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                position: 'relative',
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '10px 14px', borderRadius: 16, textDecoration: 'none',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span
                className={n.label === 'Notifications' && n.badge > 0 ? 'bell-ring' : undefined}
                style={{
                  fontSize: 22,
                  lineHeight: 1,
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  color: n.label === 'Notifications'
                    ? (n.badge > 0 ? '#22d3ee' : 'rgba(255,255,255,0.85)')
                    : 'inherit',
                  filter: n.label === 'Notifications' && n.badge > 0
                    ? 'drop-shadow(0 0 6px rgba(34,211,238,0.7))'
                    : undefined,
                }}
              >
                {n.icon}
                {n.badge > 0 && (
                  <span
                    key={n.badge}
                    className="cart-badge-bump"
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -10,
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      borderRadius: 999,
                      fontSize: 10,
                      lineHeight: '18px',
                      color: '#0b1220',
                      fontWeight: 800,
                      textAlign: 'center',
                      background: n.badgeColor || '#fbbf24',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      border: '2px solid #0b1220',
                    }}
                  >
                    {n.badge > 99 ? '99+' : n.badge}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, whiteSpace: 'nowrap' }}>{n.label}</span>
            </Link>
          ))}
        </div>

        {/* ── Bannière promo ── */}
        {promo && (
          <div style={{ margin: '18px 16px 0' }}>
            <div style={{
              borderRadius: 20, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(6,182,212,0.25) 100%)',
              border: '1px solid rgba(139,92,246,0.35)',
              padding: '18px 18px 16px',
            }}>
              {/* Icône déco */}
              <div style={{ position: 'absolute', bottom: -8, right: -4, fontSize: 72, opacity: 0.12, pointerEvents: 'none', lineHeight: 1 }}>🎁</div>

              <span style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Offre du moment</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '4px 0 6px', lineHeight: 1.2 }}>
                {promo.title || promo.name}
              </h3>
              {promo.description && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '0 0 12px', lineHeight: 1.5, maxWidth: '85%' }}>
                  {promo.description.length > 80 ? promo.description.slice(0, 80) + '…' : promo.description}
                </p>
              )}
              {promo.discount_percentage > 0 && (
                <span style={{ display: 'inline-block', marginBottom: 12, padding: '4px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.85)', color: '#000', fontSize: 12, fontWeight: 800 }}>
                  -{promo.discount_percentage}%
                </span>
              )}
              <br />
              <Link href="/client/promotions" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 12,
                background: 'rgba(139,92,246,0.75)', color: 'white',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}>
                Voir l'offre →
              </Link>
            </div>
          </div>
        )}

        {/* ── Menus du moment ── */}
        <div style={{ padding: '22px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>🍽️ Menus du moment</h2>
            <Link href="/client/menus" style={{ fontSize: 12, color: '#22d3ee', textDecoration: 'none', fontWeight: 600 }}>Tout voir →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height: 200, borderRadius: 16, background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : menus.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
              Aucun menu disponible pour le moment
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {menus.map(m => <MobileMenuCard key={m.id} menu={m} />)}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ LAYOUT DESKTOP / TABLETTE (≥ sm) — aligné secrétariat : admin-tight, pas de double .container */}
      <section className="desktop-only client-dashboard-page page-section page-section--admin-tight min-h-screen text-white">
        <div className="mx-auto w-full max-w-6xl px-0 sm:px-0">
          <DashboardGreeting compact>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Accueil repas
            </h1>
            <p className="text-white/70 text-sm sm:text-base lg:text-lg">Vos menus, commandes, points et abonnement repas</p>
          </DashboardGreeting>

          <div className="dashboard-grid mt-6">
            <ClientSidebar />
            <main className="main-panel">
              {subBanner && (
                <div className="card mb-6 p-4 sm:p-5 border border-violet-500/30 bg-violet-500/10">
                  <h2 className="text-sm font-bold text-violet-300 uppercase tracking-wide mb-1">{subBanner.title}</h2>
                  <p className="text-white/90 text-sm sm:text-base m-0 mb-3">{subBanner.line}</p>
                  <Link href={subBanner.href} className="client-stat-cta client-stat-cta--gold">
                    Gérer ou renouveler <span aria-hidden className="opacity-90">→</span>
                  </Link>
                </div>
              )}
              {loading ? (
                <div className="card text-center py-12">
                  <p className="text-white/60">Chargement...</p>
                </div>
              ) : (
                <>
                  {/* Points fidélité */}
                  <div className="points-fidelity-card mb-6">
                    <div className="points-fidelity-inner">
                      <div className="points-fidelity-header">
                        <span className="points-fidelity-icon" aria-hidden>⭐</span>
                        <div>
                          <h3 className="points-fidelity-title">Points fidélité</h3>
                          <p className="points-fidelity-subtitle">Cumulables · Réductions · Repas gratuits · Promos</p>
                        </div>
                      </div>
                      <div className="points-fidelity-value-wrap">
                        <span className="points-fidelity-value">{stats?.points ?? 0}</span>
                        <span className="points-fidelity-unit">pts</span>
                      </div>
                      <Link href="/client/promotions" className="points-fidelity-cta">
                        Utiliser mes points →
                      </Link>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="stats-row">
                    <div className="stat-card">
                      <h4>🛒 Commandes</h4>
                      <p className="text-2xl sm:text-3xl font-bold">{stats?.orders ?? 0}</p>
                      <Link href="/client/orders" className="client-stat-cta">
                        Voir l&apos;historique <span aria-hidden className="opacity-90">→</span>
                      </Link>
                    </div>
                    <div className="stat-card">
                      <h4>💳 Abonnements repas</h4>
                      <p className="text-2xl sm:text-3xl font-bold">{stats?.subscriptions ?? 0}</p>
                      <Link href="/client/subscriptions#renew" className="client-stat-cta client-stat-cta--gold">
                        Gérer ou renouveler <span aria-hidden className="opacity-90">→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Promotions */}
                  <section className="card mt-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{
                      background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>🎁 Promotions disponibles</h3>
                    <p className="text-white/70 mb-4">Consultez et réclamez les offres compatibles avec votre solde de points.</p>
                    <GoldButton href="/client/promotions">Voir les promotions</GoldButton>
                  </section>

                  {/* Menus */}
                  <section className="card mt-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{
                      background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>🍽️ Consulter les menus</h3>
                    <p className="text-white/70 mb-4">Parcourez nos plats disponibles et passez votre commande en quelques clics.</p>
                    <GoldButton href="/client/menus">Voir les menus</GoldButton>
                  </section>

                  {/* Actions rapides */}
                  <section className="card mt-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{
                      background: 'linear-gradient(135deg, #9d4edd 0%, #00ffff 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>📋 Actions rapides</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <GoldButton href="/client/menus">Voir les menus</GoldButton>
                      <GoldButton href="/client/orders">Mes commandes</GoldButton>
                      <GoldButton href="/client/subscriptions">Mes abonnements</GoldButton>
                      <GoldButton href="/client/promotions">Promotions</GoldButton>
                    </div>
                  </section>
                </>
              )}
            </main>
          </div>
        </div>
      </section>

    </ReadOnlyGuard>
  )
}
