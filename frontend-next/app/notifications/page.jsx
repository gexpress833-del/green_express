"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/notifications'

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

  function goToEventRequest(n) {
    const id = n?.data?.event_request_id
    if (!id) return
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

  function renderNotificationCard(n) {
    const isUnread = !n.read_at
    const title = n?.data?.title || 'Notification'
    const message = n?.data?.message || ''
    const icon = n?.data?.order_id ? '📦' : n?.data?.event_request_id ? '📅' : '🔔'
    return (
      <div
        key={n.id}
        className={`card p-4 sm:p-5 border transition ${
          isUnread ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10 bg-white/5'
        }`}
      >
        <div className="flex gap-4">
          <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl" aria-hidden>
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base">{title}</h3>
            {message && <p className="text-white/70 text-sm mt-1">{message}</p>}
            <p className="text-white/50 text-xs mt-2">{formatRelative(n.created_at)}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {n?.data?.order_id && (
                <button
                  type="button"
                  onClick={() => goToOrder(n)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition"
                >
                  Voir la commande
                </button>
              )}
              {n?.data?.event_request_id && (
                <button
                  type="button"
                  onClick={() => goToEventRequest(n)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500 text-[#0b1220] hover:bg-cyan-400 transition"
                >
                  Voir la demande
                </button>
              )}
              {isUnread && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/90 border border-white/30 hover:bg-white/10 transition"
                >
                  Marquer comme lue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Titre comme le reste de l'app */}
        <header className="mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Notifications
          </h1>
          <p className="text-white/70 text-base">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
          </p>
        </header>

        {/* Actions + onglets */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markingAll}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {markingAll ? 'Marquage…' : 'Tout marquer lu'}
          </button>
          <span className="text-white/30">|</span>
          <Link
            href="/notifications/historique"
            className="px-4 py-2 rounded-lg text-sm font-medium text-cyan-400 hover:bg-white/10 border border-cyan-400/30 transition inline-block"
          >
            Voir l'historique {readCount > 0 && `(${readCount})`}
          </Link>
          <div className="flex flex-wrap gap-2 ml-auto">
            {TABS.map((tab) => {
              const count = tabCounts[tab.id] ?? 0
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                      : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                  {count > 0 && <span className="ml-1 opacity-80">({count})</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section Non lues */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white/90 mb-3 flex items-center gap-2">
            <span>Non lues</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-sm font-medium">
                {unreadCount}
              </span>
            )}
          </h2>
          {loading ? (
            <div className="card py-12 text-center">
              <p className="text-white/60">Chargement des notifications…</p>
            </div>
          ) : unreadFiltered.length === 0 ? (
            <div className="card py-8 text-center">
              <p className="text-white/60 text-sm">
                {unreadCount === 0 ? 'Aucune notification non lue.' : `Aucune non lue dans ${TABS.find(t => t.id === activeTab)?.label}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">{unreadFiltered.map(renderNotificationCard)}</div>
          )}
        </div>
      </div>
    </section>
  )
}
