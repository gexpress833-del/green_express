"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/notifications'
import ProfileSidebar from '../profile/components/ProfileSidebar'

function formatRelative(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffM = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffM < 1) return "À l'instant"
  if (diffM < 60) return `Il y a ${diffM} min`
  if (diffH < 24) return `Il y a ${diffH} h`
  if (diffD < 7) return `Il y a ${diffD} j`
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const TABS = [
  { id: 'all', label: 'Toutes' },
  { id: 'orders', label: 'Commandes' },
  { id: 'events', label: 'Événements' },
  { id: 'system', label: 'Système' },
]

export default function NotificationsPage() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchNotifications(50)
        if (cancelled) return
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const unreadCount = notifications.filter(n => !n.read_at).length
  const orderCount = notifications.filter(n => n?.data?.order_id && !n.read_at).length
  const eventCount = notifications.filter(n => n?.data?.event_request_id && !n.read_at).length
  const systemCount = notifications.filter(n => !n?.data?.order_id && !n?.data?.event_request_id && !n.read_at).length

  async function handleMarkAllRead() {
    if (unreadCount === 0) return
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      const data = await fetchNotifications(50)
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : [])
      router.push('/notifications/historique')
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleMarkRead(n) {
    if (n.read_at) return
    try {
      await markNotificationRead(n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      router.push('/notifications/historique')
    } catch {}
  }

  function goToOrder(n) {
    const orderId = n?.data?.order_id
    if (!orderId) return
    router.push(`/client/orders?order=${orderId}`)
  }

  function goToEventRequest() {
    router.push('/client/event-requests')
  }

  function getNotificationType(n) {
    if (n?.data?.order_id) return 'orders'
    if (n?.data?.event_request_id) return 'events'
    return 'system'
  }

  const unread = notifications.filter(n => !n.read_at)
  const filterByTab = (list) =>
    activeTab === 'all' ? list : list.filter(n => getNotificationType(n) === activeTab)
  const unreadFiltered = filterByTab(unread)
  const readCount = notifications.filter(n => n.read_at).length
  const tabCounts = { all: unreadCount, orders: orderCount, events: eventCount, system: systemCount }

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  function renderCard(n) {
    const isUnread = !n.read_at
    const title = n?.data?.title || 'Notification'
    const message = n?.data?.message || ''
    const originLabel = n?.data?.origin_label
    const icon = n?.data?.order_id ? '📦' : n?.data?.event_request_id ? '📅' : '🔔'
    return (
      <article
        key={n.id}
        className={`rounded-2xl border p-6 transition-colors ${
          isUnread ? 'border-cyan-500/20 bg-[#0f172a]' : 'border-white/5 bg-[#0f172a]/50'
        }`}
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">{title}</h3>
            {originLabel && (
              <p className="text-cyan-400/90 text-xs mt-0.5">
                De : {originLabel}
              </p>
            )}
            {message && <p className="text-white/60 text-sm mt-1">{message}</p>}
            <p className="text-white/40 text-xs mt-2">{formatRelative(n.created_at)}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {n?.data?.order_id && (
                <button
                  type="button"
                  onClick={() => goToOrder(n)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-[#d4af37]/90 text-[#0b1220] hover:bg-[#d4af37] transition-colors"
                >
                  Voir la commande
                </button>
              )}
              {n?.data?.event_request_id && (
                <button
                  type="button"
                  onClick={goToEventRequest}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-cyan-500/80 text-[#0b1220] hover:bg-cyan-400 transition-colors"
                >
                  Voir la demande
                </button>
              )}
              {isUnread && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 border border-white/15 hover:bg-white/5 transition-colors"
                >
                  Marquer lue
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container py-8">
        <div className="dashboard-grid gap-6 lg:gap-8">
          <ProfileSidebar
            onLogout={handleLogout}
            dashboardHref={user?.role ? `/${user.role}` : '/client'}
          />

          <main className="main-panel min-w-0">
            <header className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
            </header>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || markingAll}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/90 border border-white/15 hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                {markingAll ? 'Marquage…' : 'Tout marquer lu'}
              </button>
              <Link
                href="/notifications/historique"
                className="px-4 py-2 rounded-lg text-sm font-medium text-cyan-400/90 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
              >
                Historique{readCount > 0 ? ` (${readCount})` : ''}
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {TABS.map((tab) => {
                const count = tabCounts[tab.id] ?? 0
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && <span className="ml-1 text-white/50">({count})</span>}
                  </button>
                )
              })}
            </div>

            <div>
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">
                Non lues {unreadCount > 0 && `· ${unreadCount}`}
              </h2>
              {loading ? (
                <div className="rounded-2xl border border-white/5 bg-[#0f172a]/50 py-20 text-center">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/50 text-sm">Chargement…</p>
                </div>
              ) : unreadFiltered.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-[#0f172a]/30 py-16 text-center">
                  <p className="text-white/40 text-sm">
                    {unreadCount === 0
                      ? 'Aucune notification non lue.'
                      : `Aucune dans « ${TABS.find(t => t.id === activeTab)?.label} ».`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">{unreadFiltered.map(renderCard)}</div>
              )}
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}
