'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { fetchNotificationById, markNotificationRead, deleteNotification } from '@/lib/notifications'
import { getNotificationType, NOTIFICATION_TABS } from '@/lib/notificationCategories'
import { getNotificationField } from '@/lib/notificationPayload'
import { resolveNotificationNavigateHref } from '@/lib/notificationDetailActions'
import { getApiErrorMessage } from '@/lib/api'
import ConfirmModal from '@/components/ConfirmModal'
import styles from '../page.module.css'

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
    label: 'Demande d\u2019événement',
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

function getPreviewImage(notification) {
  return (
    notification?.image_url ||
    notification?.data?.image ||
    notification?.data?.image_url ||
    notification?.data?.thumbnail ||
    notification?.data?.photo ||
    null
  )
}

export default function NotificationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const controller = new AbortController()

    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchNotificationById(id, { signal: controller.signal })
        if (!cancelled) {
          setNotification(data)
          // Marquer comme lue automatiquement
          if (!data.read_at) {
            try { await markNotificationRead(id) } catch {}
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err) || 'Notification introuvable.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [id])

  const type = getNotificationType(notification)
  const theme = NOTIFICATION_THEMES[type] || NOTIFICATION_THEMES.announcements
  const title = getNotificationField(notification, 'title') || theme.label
  const message = getNotificationField(notification, 'message') || 'Vous avez une nouvelle notification.'
  const previewImage = getPreviewImage(notification)
  const navigateHref = notification ? resolveNotificationNavigateHref(notification, user?.role) : null

  const createdLabel = notification?.created_at
    ? new Date(notification.created_at).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''
  const originLabel = notification?.origin_label

  async function handleDelete() {
    setConfirmModal({
      title: 'Supprimer la notification',
      message: `Voulez-vous supprimer définitivement « ${title} » ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await deleteNotification(id)
          router.push('/notifications')
        } catch {}
      },
    })
  }

  function handleNavigate() {
    if (navigateHref) {
      router.push(navigateHref)
    }
  }

  // Extraction des champs spécifiques
  const details = []
  if (notification) {
    const orderId = getNotificationField(notification, 'order_id')
    const eventId = getNotificationField(notification, 'event_request_id')
    const subId = getNotificationField(notification, 'subscription_id')
    const companySubId = getNotificationField(notification, 'company_subscription_id')
    const promoId = getNotificationField(notification, 'promotion_id')
    const planName = getNotificationField(notification, 'plan_name')
    const promoKind = getNotificationField(notification, 'promotion_kind')
    const eventType = getNotificationField(notification, 'event_type')
    const eventDate = getNotificationField(notification, 'event_date')
    const eventLocation = getNotificationField(notification, 'event_location')
    const orderStatus = getNotificationField(notification, 'order_status')
    const orderAmount = getNotificationField(notification, 'order_amount')
    const orderCurrency = getNotificationField(notification, 'order_currency')
    const deliveryAddress = getNotificationField(notification, 'delivery_address')
    const subscriptionStatus = getNotificationField(notification, 'subscription_status')
    const promotionCode = getNotificationField(notification, 'promotion_code')
    const promotionDiscount = getNotificationField(notification, 'promotion_discount')
    const validUntil = getNotificationField(notification, 'valid_until')
    const priority = getNotificationField(notification, 'priority')

    if (orderId) {
      details.push({ label: 'N° Commande', value: `#${orderId}` })
      if (orderStatus) details.push({ label: 'Statut', value: orderStatus })
      if (orderAmount != null) details.push({ label: 'Montant', value: `${orderAmount} ${orderCurrency || 'CDF'}` })
      if (deliveryAddress) details.push({ label: 'Livraison', value: deliveryAddress })
    }
    if (eventId) {
      details.push({ label: 'N° Demande', value: `#${eventId}` })
      if (eventType) details.push({ label: 'Type', value: eventType })
      if (eventDate) details.push({ label: 'Date', value: new Date(eventDate).toLocaleDateString('fr-FR') })
      if (eventLocation) details.push({ label: 'Lieu', value: eventLocation })
    }
    if (subId || companySubId) {
      details.push({ label: 'N° Abonnement', value: `#${subId || companySubId}` })
      if (planName) details.push({ label: 'Plan', value: planName })
      if (subscriptionStatus) details.push({ label: 'Statut', value: subscriptionStatus })
    }
    if (promoId) {
      details.push({ label: 'N° Promotion', value: `#${promoId}` })
      if (promoKind) details.push({ label: 'Type', value: promoKind })
      if (promotionCode) details.push({ label: 'Code', value: promotionCode })
      if (promotionDiscount) details.push({ label: 'Réduction', value: promotionDiscount })
      if (validUntil) details.push({ label: "Valide jusqu'au", value: new Date(validUntil).toLocaleDateString('fr-FR') })
    }
    if (priority) details.push({ label: 'Priorité', value: priority })
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/notifications" className={styles.backButton} aria-label="Retour">
              ←
            </Link>
            <div className={styles.titleWrap}>
              <h1 className={styles.title}>
                {loading ? 'Chargement…' : `Détail ${theme.label}`}
              </h1>
              <p className={styles.subtitle}>
                {createdLabel || 'Notification'}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.stateCard}>
            <div className={styles.spinner} />
            <p className={styles.stateText}>Chargement de la notification…</p>
          </div>
        ) : error ? (
          <div className={styles.stateCard}>
            <p className={`${styles.stateText} ${styles.errorText}`}>{error}</p>
            <Link href="/notifications" className={styles.historyLink}>
              Retour aux notifications
            </Link>
          </div>
        ) : (
          <article className={`${styles.card} ${theme.cardClass}`} style={{ marginTop: '8px' }}>
            <div className={styles.cardTop}>
              <div className={`${styles.iconWrap} ${theme.iconClass}`}>
                {theme.icon}
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div>
                    <h3 className={styles.cardTitle}>{title}</h3>
                    {originLabel && (
                      <p className={styles.cardMeta}>De : {originLabel}</p>
                    )}
                  </div>
                </div>

                <div className={`${styles.preview} ${theme.previewClass}`}>
                  {previewImage ? (
                    <img src={previewImage} alt={title} className={styles.previewImage} />
                  ) : (
                    <div className={`${styles.previewFallback} ${theme.iconClass}`}>
                      {theme.icon}
                    </div>
                  )}
                  <div className={styles.previewText}>
                    <p className={styles.previewMessage}>{message}</p>
                    <p className={`${styles.previewLabel} ${theme.labelClass}`}>{theme.label}</p>
                  </div>
                </div>

                {details.length > 0 && (
                  <div className={styles.detailFields}>
                    {details.map((d) => (
                      <div key={d.label} className={styles.detailField}>
                        <span className={styles.detailFieldLabel}>{d.label}</span>
                        <span className={styles.detailFieldValue}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.actions}>
                  {navigateHref && (
                    <button
                      type="button"
                      onClick={handleNavigate}
                      className={`${styles.buttonReset} ${styles.actionPrimary} ${theme.actionClass}`}
                    >
                      Ouvrir dans l&apos;application
                    </button>
                  )}
                  <Link
                    href="/notifications"
                    className={`${styles.buttonReset} ${styles.actionMuted}`}
                  >
                    Retour
                  </Link>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`${styles.buttonReset} ${styles.actionDanger}`}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>

      {confirmModal && (
        <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)} />
      )}
    </section>
  )
}
