'use client'

import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/helpers'
import { pushToast } from '@/components/Toaster'

function notificationTitle(n) {
  const d = n?.data || {}
  return d.title || d.message?.slice(0, 80) || 'Notification'
}

function notificationBody(n) {
  const d = n?.data || {}
  if (d.message && d.title) return d.message
  if (d.message) return d.message
  return ''
}

export default function ClientNotificationsPage() {
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    apiRequest('/api/notifications?limit=50', { method: 'GET' })
      .then((r) => {
        setItems(Array.isArray(r?.notifications) ? r.notifications : [])
        setUnreadCount(typeof r?.unread_count === 'number' ? r.unread_count : 0)
      })
      .catch(() => {
        setItems([])
        pushToast('Impossible de charger les notifications.', 'error')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const markRead = async (id) => {
    try {
      const r = await apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
      setUnreadCount(typeof r?.unread_count === 'number' ? r.unread_count : 0)
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      )
    } catch {
      pushToast('Action impossible.', 'error')
    }
  }

  const markAllRead = async () => {
    try {
      const r = await apiRequest('/api/notifications/read-all', { method: 'POST' })
      setUnreadCount(typeof r?.unread_count === 'number' ? r.unread_count : 0)
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      pushToast('Toutes les notifications sont marquées comme lues.', 'success')
    } catch {
      pushToast('Action impossible.', 'error')
    }
  }

  return (
    <ReadOnlyGuard allowedActions={['view', 'read']} showWarning={false}>
      <section className="page-section min-h-screen bg-[#0b1220]" aria-label="Notifications">
        <div className="container">
          <ClientSubpageHeader
            title="Notifications"
            subtitle="Messages de l’application (commandes, abonnements, annonces)"
            icon="🔔"
          />

          <div className="flex flex-wrap justify-end gap-2 mb-4">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/90 text-sm hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {loading ? (
            <div className="card text-center">
              <p className="text-white/60">Chargement…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="card text-center">
              <p className="text-white/70 text-lg">Aucune notification pour le moment.</p>
              <p className="text-white/45 text-sm mt-2">
                Vous serez informé ici des mises à jour de commande et messages importants.
              </p>
            </div>
          ) : (
            <ul className="space-y-3 list-none p-0 m-0" aria-live="polite">
              {items.map((n) => {
                const d = n.data || {}
                const orderId = d.order_id
                const isUnread = !n.read_at
                return (
                  <li key={n.id}>
                    <article
                      className={`card rounded-xl border transition-colors ${
                        isUnread ? 'border-cyan-500/35 bg-cyan-500/5' : 'border-white/10 bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="min-w-0">
                          <h3 id={`notif-${n.id}`} className="text-base font-semibold text-white/95 pr-2">
                            {notificationTitle(n)}
                          </h3>
                          {n.created_at && (
                            <p className="text-white/45 text-xs mt-1">{formatDate(n.created_at)}</p>
                          )}
                          {notificationBody(n) && (
                            <p className="text-white/75 text-sm mt-2 whitespace-pre-wrap">{notificationBody(n)}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {orderId != null && (
                            <Link
                              href={`/client/orders/${orderId}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 text-sm text-cyan-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                            >
                              Suivi commande
                            </Link>
                          )}
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => markRead(n.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/20 text-sm text-white/85 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
