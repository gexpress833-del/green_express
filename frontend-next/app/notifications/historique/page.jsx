"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteAllNotifications, deleteNotification, fetchNotifications } from '@/lib/notifications'
import { getNotificationType, NOTIFICATION_TABS } from '@/lib/notificationCategories'
import { getNotificationDeepLink, getNotificationField } from '@/lib/notificationPayload'
import {
  getEventRequestDeepLink,
  getOrderDeepLink,
  getPromotionsDeepLink,
  getSubscriptionsDeepLink,
} from '@/lib/notificationNavigation'
import ConfirmModal from '@/components/ConfirmModal'

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

const TABS = NOTIFICATION_TABS

const NOTIFICATION_THEMES = {
  orders: {
    icon: '📦',
    chip: 'Commande',
    accent: 'border-emerald-400/45',
    glow: 'shadow-[0_0_0_1px_rgba(52,211,153,0.12),0_18px_35px_rgba(16,185,129,0.08)]',
    iconBox: 'bg-emerald-500/15 text-emerald-100 border border-emerald-400/25',
    chipClass: 'bg-emerald-500/15 text-emerald-100 border border-emerald-400/25',
    actionClass: 'bg-emerald-400 text-[#08111f] hover:bg-emerald-300',
  },
  subscriptions: {
    icon: '💳',
    chip: 'Abonnement',
    accent: 'border-violet-400/45',
    glow: 'shadow-[0_0_0_1px_rgba(167,139,250,0.12),0_18px_35px_rgba(139,92,246,0.08)]',
    iconBox: 'bg-violet-500/15 text-violet-100 border border-violet-400/25',
    chipClass: 'bg-violet-500/15 text-violet-100 border border-violet-400/25',
    actionClass: 'bg-violet-400 text-[#08111f] hover:bg-violet-300',
  },
  promotions: {
    icon: '🎁',
    chip: 'Promotion',
    accent: 'border-pink-400/45',
    glow: 'shadow-[0_0_0_1px_rgba(244,114,182,0.12),0_18px_35px_rgba(236,72,153,0.08)]',
    iconBox: 'bg-pink-500/15 text-pink-100 border border-pink-400/25',
    chipClass: 'bg-pink-500/15 text-pink-100 border border-pink-400/25',
    actionClass: 'bg-pink-400 text-[#08111f] hover:bg-pink-300',
  },
  events: {
    icon: '🎉',
    chip: 'Demande d’événement',
    accent: 'border-amber-400/45',
    glow: 'shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_18px_35px_rgba(245,158,11,0.08)]',
    iconBox: 'bg-amber-500/15 text-amber-50 border border-amber-400/25',
    chipClass: 'bg-amber-500/15 text-amber-50 border border-amber-400/25',
    actionClass: 'bg-amber-400 text-[#08111f] hover:bg-amber-300',
  },
  announcements: {
    icon: '📢',
    chip: 'Annonce / info',
    accent: 'border-emerald-400/40',
    glow: 'shadow-[0_0_0_1px_rgba(52,211,153,0.12),0_18px_35px_rgba(16,185,129,0.08)]',
    iconBox: 'bg-emerald-500/15 text-emerald-100 border border-emerald-400/25',
    chipClass: 'bg-emerald-500/15 text-emerald-100 border border-emerald-400/25',
    actionClass: 'bg-emerald-400 text-[#08111f] hover:bg-emerald-300',
  },
}

export default function NotificationsHistoriquePage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [deletingAll, setDeletingAll] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchNotifications(50)
        if (cancelled) return
        const all = Array.isArray(data?.notifications) ? data.notifications : []
        setNotifications(all.filter((notification) => notification.read_at))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function goToOrder(notification) {
    const fallbackHref = getOrderDeepLink(user?.role, getNotificationField(notification, 'order_id'))
    const href = getNotificationDeepLink(notification, fallbackHref)
    if (href) router.push(href)
  }

  function goToEventRequest(notification) {
    const fallbackHref = getEventRequestDeepLink(user?.role)
    const href = getNotificationDeepLink(notification, fallbackHref)
    if (href) router.push(href)
  }

  function goToSubscriptions(notification) {
    const fallbackHref = getSubscriptionsDeepLink(user?.role)
    const href = getNotificationDeepLink(notification, fallbackHref)
    if (href) router.push(href)
  }

  function goToPromotions(notification) {
    const fallbackHref = getPromotionsDeepLink(user?.role, getNotificationField(notification, 'promotion_id'))
    const href = getNotificationDeepLink(notification, fallbackHref)
    if (href) router.push(href)
  }

  const filtered =
    activeTab === 'all'
      ? notifications
      : notifications.filter((notification) => getNotificationType(notification) === activeTab)

  async function doDelete(notification) {
    try {
      await deleteNotification(notification.id)
      setNotifications((current) => current.filter((entry) => entry.id !== notification.id))
    } catch {}
  }

  function handleDelete(notification) {
    const title = getNotificationField(notification, 'title') || 'cette notification'
    setConfirmModal({
      title: 'Supprimer la notification',
      message: `Voulez-vous supprimer définitivement « ${title} » ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
      onConfirm: () => { setConfirmModal(null); doDelete(notification) },
    })
  }

  async function doDeleteAll() {
    if (notifications.length === 0 || deletingAll) return
    setDeletingAll(true)
    try {
      await deleteAllNotifications()
      setNotifications([])
    } finally {
      setDeletingAll(false)
    }
  }

  function handleDeleteAll() {
    if (notifications.length === 0 || deletingAll) return
    setConfirmModal({
      title: 'Supprimer tout l\'historique',
      message: `Vous allez supprimer définitivement ${notifications.length} notification${notifications.length > 1 ? 's' : ''} de votre historique. Cette action est irréversible.`,
      variant: 'danger',
      confirmLabel: 'Tout supprimer',
      onConfirm: () => { setConfirmModal(null); doDeleteAll() },
    })
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Link
              href="/notifications"
              className="text-white/60 hover:text-white text-sm font-medium transition"
            >
              ← Notifications
            </Link>
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={notifications.length === 0 || deletingAll}
              className="text-sm font-medium text-red-300 hover:text-red-200 disabled:opacity-40"
            >
              {deletingAll ? 'Suppression...' : 'Tout supprimer'}
            </button>
          </div>
          <h1
            className="text-3xl md:text-4xl font-extrabold mb-2"
            style={{
              background: 'linear-gradient(135deg, #ffd166 0%, #f8fafc 35%, #67e8f9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Historique
          </h1>
          <p className="text-white/70 text-base">
            Mes notifications déjà lues
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? notifications.length
                : notifications.filter((notification) => getNotificationType(notification) === tab.id).length
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
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
          <div className="space-y-4">
            {filtered.map((notification) => {
              const type = getNotificationType(notification)
              const theme = NOTIFICATION_THEMES[type] || NOTIFICATION_THEMES.announcements
              const title = getNotificationField(notification, 'title') || 'Notification'
              const message = getNotificationField(notification, 'message') || ''
              const originLabel = getNotificationField(notification, 'origin_label')
              const hasOrderAction = Boolean(getNotificationField(notification, 'order_id'))
              const hasEventAction = Boolean(getNotificationField(notification, 'event_request_id'))
              const hasSubscriptionAction = Boolean(getNotificationField(notification, 'subscription_id') || getNotificationField(notification, 'company_subscription_id'))
              const hasPromotionAction = Boolean(getNotificationField(notification, 'promotion_id'))
              const hasSpecificAction = hasOrderAction || hasEventAction || hasSubscriptionAction || hasPromotionAction
              const explicitDeepLink = getNotificationDeepLink(notification, null)
              const cardDeepLink = explicitDeepLink && !hasSpecificAction ? explicitDeepLink : null
              return (
                <article
                  key={notification.id}
                  className={`relative overflow-hidden rounded-[28px] border p-5 sm:p-6 bg-[#101827]/88 ${theme.accent} ${theme.glow}`}
                  style={cardDeepLink ? { cursor: 'pointer' } : undefined}
                  role={cardDeepLink ? 'button' : undefined}
                  tabIndex={cardDeepLink ? 0 : undefined}
                  onClick={cardDeepLink
                    ? (event) => {
                      const target = event.target
                      if (target instanceof Element && target.closest('button,a,input,textarea,select')) {
                        return
                      }
                      router.push(cardDeepLink)
                    }
                    : undefined}
                  onKeyDown={cardDeepLink
                    ? (event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') {
                        return
                      }
                      event.preventDefault()
                      router.push(cardDeepLink)
                    }
                    : undefined}
                >
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_35%)]" />
                  <div className="relative flex gap-4">
                    <span className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${theme.iconBox}`} aria-hidden>
                      {theme.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${theme.chipClass}`}>
                          {theme.chip}
                        </span>
                        <span className="text-white/40 text-xs">{formatRelative(n.created_at)}</span>
                        <span className="ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border border-white/10 bg-white/5 text-white/55">
                          Lue
                        </span>
                      </div>
                      <h3 className="font-extrabold text-white text-lg leading-tight">{title}</h3>
                      {originLabel && (
                        <p className="text-cyan-300/90 text-xs mt-1 font-medium">De : {originLabel}</p>
                      )}
                      {message && <p className="text-white/70 text-sm sm:text-base mt-3 leading-relaxed">{message}</p>}
                      <div className="flex flex-wrap gap-2 mt-5">
                        {hasOrderAction && (
                          <button
                            type="button"
                            onClick={() => goToOrder(notification)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${theme.actionClass}`}
                          >
                            Voir la commande
                          </button>
                        )}
                        {hasEventAction && (
                          <button
                            type="button"
                            onClick={() => goToEventRequest(notification)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${theme.actionClass}`}
                          >
                            Voir la demande
                          </button>
                        )}
                        {hasSubscriptionAction && (
                          <button
                            type="button"
                            onClick={() => goToSubscriptions(notification)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${theme.actionClass}`}
                          >
                            Voir mes abonnements
                          </button>
                        )}
                        {hasPromotionAction && (
                          <button
                            type="button"
                            onClick={() => goToPromotions(notification)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${theme.actionClass}`}
                          >
                            Voir les promotions
                          </button>
                        )}
                        {explicitDeepLink && !hasSpecificAction && (
                          <button
                            type="button"
                            onClick={() => router.push(explicitDeepLink)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${theme.actionClass}`}
                          >
                            Ouvrir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(notification)}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-200 border border-red-400/20 hover:bg-red-500/10 transition"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
      {confirmModal && (
        <ConfirmModal
          {...confirmModal}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </section>
  )
}
