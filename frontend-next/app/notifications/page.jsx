"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  deleteAllNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications'
import { getNotificationType, NOTIFICATION_TABS } from '@/lib/notificationCategories'
import {
  getEventRequestDeepLink,
  getOrderDeepLink,
  getPromotionsDeepLink,
  getSubscriptionsDeepLink,
} from '@/lib/notificationNavigation'
import { getApiErrorMessage } from '@/lib/api'
import ConfirmModal from '@/components/ConfirmModal'
import styles from './page.module.css'

const LOAD_TIMEOUT_MS = 15000

const TABS = NOTIFICATION_TABS

const NOTIFICATION_THEMES = {
  orders: {
    icon: '🛍️',
    cardClass: styles.cardOrder,
    dotClass: styles.dotOrder,
    iconClass: styles.iconOrder,
    previewClass: styles.previewOrder,
    actionClass: styles.actionOrder,
    labelClass: styles.labelOrder,
    label: 'Commande',
  },
  subscriptions: {
    icon: '💳',
    cardClass: styles.cardSubscription,
    dotClass: styles.dotSubscription,
    iconClass: styles.iconSubscription,
    previewClass: styles.previewSubscription,
    actionClass: styles.actionSubscription,
    labelClass: styles.labelSubscription,
    label: 'Abonnement',
  },
  promotions: {
    icon: '🎁',
    cardClass: styles.cardPromotion,
    dotClass: styles.dotPromotion,
    iconClass: styles.iconPromotion,
    previewClass: styles.previewPromotion,
    actionClass: styles.actionPromotion,
    labelClass: styles.labelPromotion,
    label: 'Promotion',
  },
  events: {
    icon: '🎉',
    cardClass: styles.cardEvent,
    dotClass: styles.dotEvent,
    iconClass: styles.iconEvent,
    previewClass: styles.previewEvent,
    actionClass: styles.actionEvent,
    labelClass: styles.labelEvent,
    label: 'Demande d’événement',
  },
  announcements: {
    icon: '📢',
    cardClass: styles.cardAnnouncement,
    dotClass: styles.dotAnnouncement,
    iconClass: styles.iconAnnouncement,
    previewClass: styles.previewAnnouncement,
    actionClass: styles.actionAnnouncement,
    labelClass: styles.labelAnnouncement,
    label: 'Annonce / info',
  },
}

function formatRelative(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffM = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)

  if (diffM < 1) return 'À l’instant'
  if (diffM < 60) return `Il y a ${diffM} min`
  if (diffH < 24) return `Il y a ${diffH} h`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function getPreviewImage(notification) {
  return (
    notification?.data?.image ||
    notification?.data?.image_url ||
    notification?.data?.thumbnail ||
    notification?.data?.photo ||
    null
  )
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const dashboardHref = user?.role ? `/${user.role}` : '/client'

  async function requestNotifications(signal) {
    const data = await fetchNotifications(50, { signal })
    return Array.isArray(data?.notifications) ? data.notifications : []
  }

  useEffect(() => {
    let cancelled = false
    let timedOut = false
    const controller = new AbortController()
    setLoadError(null)
    setLoading(true)
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, LOAD_TIMEOUT_MS)

    requestNotifications(controller.signal)
      .then((items) => {
        if (cancelled) return
        setNotifications(items)
      })
      .catch((error) => {
        if (cancelled) return
        if (error?.name === 'AbortError') {
          if (!timedOut) return
          setLoadError('Le chargement a pris trop de temps. Vérifie que le backend répond bien.')
        } else {
          setLoadError(getApiErrorMessage(error))
        }
        setNotifications([])
      })
      .finally(() => {
        clearTimeout(timeoutId)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [])

  const unread = notifications.filter((notification) => !notification.read_at)
  const allVisible = unread.length > 0 ? unread : notifications
  const filteredNotifications =
    activeTab === 'all'
      ? allVisible
      : allVisible.filter((notification) => getNotificationType(notification) === activeTab)

  const unreadCount = unread.length
  const readCount = notifications.filter((notification) => notification.read_at).length
  const totalCount = notifications.length
  const tabCounts = {
    all: allVisible.length,
    orders: allVisible.filter((n) => getNotificationType(n) === 'orders').length,
    subscriptions: allVisible.filter((n) => getNotificationType(n) === 'subscriptions').length,
    promotions: allVisible.filter((n) => getNotificationType(n) === 'promotions').length,
    events: allVisible.filter((n) => getNotificationType(n) === 'events').length,
    announcements: allVisible.filter((n) => getNotificationType(n) === 'announcements').length,
  }

  async function handleRetry() {
    let timedOut = false
    const controller = new AbortController()
    setLoadError(null)
    setLoading(true)
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, LOAD_TIMEOUT_MS)

    try {
      const items = await requestNotifications(controller.signal)
      setNotifications(items)
    } catch (error) {
      if (error?.name === 'AbortError') {
        if (timedOut) {
          setLoadError('Le chargement a pris trop de temps. Vérifie que le backend répond bien.')
          setNotifications([])
        }
      } else {
        setLoadError(getApiErrorMessage(error))
        setNotifications([])
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at || new Date().toISOString(),
        }))
      )
    } finally {
      setMarkingAll(false)
    }
  }

  async function doDeleteAll() {
    if (totalCount === 0 || deletingAll) return
    setDeletingAll(true)
    try {
      await deleteAllNotifications()
      setNotifications([])
    } finally {
      setDeletingAll(false)
    }
  }

  function handleDeleteAll() {
    if (totalCount === 0 || deletingAll) return
    setConfirmModal({
      title: 'Supprimer toutes les notifications',
      message: `Vous allez supprimer définitivement ${totalCount} notification${totalCount > 1 ? 's' : ''}. Cette action est irréversible.`,
      variant: 'danger',
      confirmLabel: 'Tout supprimer',
      onConfirm: () => { setConfirmModal(null); doDeleteAll() },
    })
  }

  async function handleMarkRead(notification) {
    if (notification.read_at) return
    try {
      await markNotificationRead(notification.id)
      setNotifications((current) =>
        current.map((entry) =>
          entry.id === notification.id
            ? { ...entry, read_at: new Date().toISOString() }
            : entry
        )
      )
    } catch {}
  }

  async function doDelete(notification) {
    try {
      await deleteNotification(notification.id)
      setNotifications((current) => current.filter((entry) => entry.id !== notification.id))
    } catch {}
  }

  function handleDelete(notification) {
    const title = notification?.data?.title || 'cette notification'
    setConfirmModal({
      title: 'Supprimer la notification',
      message: `Voulez-vous supprimer définitivement « ${title} » ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
      onConfirm: () => { setConfirmModal(null); doDelete(notification) },
    })
  }

  function goToOrder(notification) {
    const href = getOrderDeepLink(user?.role, notification?.data?.order_id)
    if (href) router.push(href)
  }

  function goToEventRequest() {
    router.push(getEventRequestDeepLink(user?.role))
  }

  function goToSubscriptions() {
    router.push(getSubscriptionsDeepLink(user?.role))
  }

  function goToPromotions(n) {
    router.push(getPromotionsDeepLink(user?.role, n?.data?.promotion_id))
  }

  function renderCard(notification) {
    const type = getNotificationType(notification)
    const theme = NOTIFICATION_THEMES[type] || NOTIFICATION_THEMES.announcements
    const title = notification?.data?.title || theme.label
    const message = notification?.data?.message || 'Vous avez une nouvelle notification.'
    const isAnnouncementCard = type === 'announcements'
    const previewImage = getPreviewImage(notification)
    const orderId = notification?.data?.order_id
    const subtitleParts = []

    if (orderId) subtitleParts.push(`Commande #${orderId}`)
    if (type === 'events') subtitleParts.push('Nouvelle demande')
    if (type === 'subscriptions' && notification?.data?.plan_name) subtitleParts.push(notification.data.plan_name)
    if (type === 'promotions' && notification?.data?.promotion_kind === 'special') subtitleParts.push('Mise en avant')
    if (notification?.data?.category === 'announcement' || notification?.data?.kind === 'announcement') {
      subtitleParts.push('Green Express')
    }
    subtitleParts.push(formatRelative(notification.created_at))

    return (
      <article
        key={notification.id}
        className={`${styles.card} ${theme.cardClass}`}
      >
        <span className={`${styles.dot} ${theme.dotClass}`} />

        <div className={styles.cardTop}>
          <div className={`${styles.iconWrap} ${theme.iconClass}`}>
            {theme.icon}
          </div>

          <div className={styles.cardBody}>
            <div>
              <div>
                <h3 className={styles.cardTitle}>
                  {title}
                </h3>
                <p className={styles.cardMeta}>
                  {subtitleParts.filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            <div className={`${styles.preview} ${theme.previewClass}`}>
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={title}
                  className={styles.previewImage}
                />
              ) : (
                <div className={`${styles.previewFallback} ${theme.iconClass}`}>
                  {theme.icon}
                </div>
              )}

              <div className={styles.previewText}>
                <p
                  className={
                    isAnnouncementCard
                      ? `${styles.previewMessage} ${styles.previewMessageAnnouncement}`
                      : styles.previewMessage
                  }
                >
                  {message}
                </p>
                <p className={`${styles.previewLabel} ${theme.labelClass}`}>
                  {theme.label}
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              {notification?.data?.order_id && (
                <button
                  type="button"
                  onClick={() => goToOrder(notification)}
                  className={`${styles.buttonReset} ${styles.actionPrimary} ${theme.actionClass}`}
                >
                  Voir la commande
                </button>
              )}

              {notification?.data?.event_request_id && (
                <button
                  type="button"
                  onClick={goToEventRequest}
                  className={`${styles.buttonReset} ${styles.actionPrimary} ${theme.actionClass}`}
                >
                  Voir la demande
                </button>
              )}

              {notification?.data?.subscription_id && (
                <button
                  type="button"
                  onClick={goToSubscriptions}
                  className={`${styles.buttonReset} ${styles.actionPrimary} ${theme.actionClass}`}
                >
                  Voir mes abonnements
                </button>
              )}

              {notification?.data?.promotion_id && (
                <button
                  type="button"
                  onClick={() => goToPromotions(notification)}
                  className={`${styles.buttonReset} ${styles.actionPrimary} ${theme.actionClass}`}
                >
                  Voir les promotions
                </button>
              )}

              {!notification.read_at && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(notification)}
                  className={`${styles.buttonReset} ${styles.actionMuted}`}
                >
                  Marquer comme lue
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(notification)}
                className={`${styles.buttonReset} ${styles.actionDanger}`}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link
              href={dashboardHref}
              className={styles.backButton}
              aria-label="Retour"
            >
              ←
            </Link>
            <div className={styles.titleWrap}>
              <h1 className={styles.title}>Notifications</h1>
              <p className={styles.subtitle}>
                Mes notifications.
                {' '}
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={totalCount === 0 || deletingAll}
              className={`${styles.buttonReset} ${styles.actionDanger}`}
            >
              {deletingAll ? 'Suppression...' : 'Tout supprimer'}
            </button>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              className={`${styles.buttonReset} ${styles.markAllButton}`}
            >
              {markingAll ? 'Patiente...' : 'Tout marquer lu'}
            </button>
          </div>
        </div>

        <div className={styles.tabs}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.buttonReset} ${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 ? ` (${tabCounts[tab.id]})` : ''}
              </button>
            )
          })}
        </div>

        <div className={styles.historyRow}>
          <Link
            href="/notifications/historique"
            className={styles.historyLink}
          >
            Voir l’historique{readCount > 0 ? ` (${readCount})` : ''}
          </Link>
        </div>

        {loading ? (
          <div className={styles.stateCard}>
            <div className={styles.spinner} />
            <p className={styles.stateText}>Chargement des notifications...</p>
          </div>
        ) : loadError ? (
          <div className={styles.stateCard}>
            <p className={`${styles.stateText} ${styles.errorText}`}>{loadError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className={`${styles.buttonReset} ${styles.retryButton}`}
            >
              Réessayer
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.stateCard}>
            <p className={styles.stateText}>Aucune notification à afficher.</p>
          </div>
        ) : (
          <div className={styles.cards}>
            {filteredNotifications.map(renderCard)}
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
