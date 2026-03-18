"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchNotifications } from '@/lib/notifications'

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

export default function NotificationsHistoriquePage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchNotifications(50)
        if (cancelled) return
        const all = Array.isArray(data?.notifications) ? data.notifications : []
        setNotifications(all.filter(n => n.read_at))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

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

  const filtered =
    activeTab === 'all'
      ? notifications
      : notifications.filter(n => getNotificationType(n) === activeTab)

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/notifications"
              className="text-white/60 hover:text-white text-sm font-medium transition"
            >
              ← Notifications
            </Link>
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Historique
          </h1>
          <p className="text-white/70 text-base">
            Notifications déjà lues
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? notifications.length
                : notifications.filter(n => getNotificationType(n) === tab.id).length
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
                <span className="ml-1 opacity-80">({count})</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="card py-12 text-center">
            <p className="text-white/60">Chargement de l'historique…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-white/70 text-lg mb-1">Aucune notification lue</p>
            <p className="text-white/50 text-sm mb-4">
              {activeTab === 'all'
                ? "Les notifications que vous marquez comme lues apparaîtront ici."
                : `Aucune dans ${TABS.find(t => t.id === activeTab)?.label}.`}
            </p>
            <Link
              href="/notifications"
              className="inline-block px-4 py-2 rounded-lg text-sm font-medium text-cyan-400 hover:bg-white/10 border border-cyan-400/30 transition"
            >
              Retour aux notifications
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => {
              const title = n?.data?.title || 'Notification'
              const message = n?.data?.message || ''
              const originLabel = n?.data?.origin_label
              const icon = n?.data?.order_id ? '📦' : n?.data?.event_request_id ? '📅' : '🔔'
              return (
                <div
                  key={n.id}
                  className="card p-4 sm:p-5 border border-white/10 bg-white/5"
                >
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl" aria-hidden>
                      {icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-base">{title}</h3>
                      {originLabel && (
                        <p className="text-cyan-400/90 text-xs mt-0.5">De : {originLabel}</p>
                      )}
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
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
