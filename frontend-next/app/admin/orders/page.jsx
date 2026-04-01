"use client"
import '@/styles/admin-order-thumbs.css'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { formatDate, formatOrderMoney } from '@/lib/helpers'
import { getBlobImageUrl, resolveMediaUrl } from '@/lib/imageLoader'

function getStatusLabel(status) {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'pending_payment': return 'En attente de paiement'
    case 'paid': return 'Paiement confirmé'
    case 'pending': return 'En attente de livraison'
    case 'out_for_delivery': return 'En cours de livraison'
    case 'delivered': return 'Livrée'
    case 'cancelled': return 'Annulée'
    default: return status || '—'
  }
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'pending_payment': return 'badge-error'
    case 'paid': return 'badge-warning'
    case 'pending': return 'badge-warning'
    case 'out_for_delivery': return 'badge-warning'
    case 'delivered': return 'badge-success'
    case 'cancelled': return 'badge-error'
    default: return 'badge-error'
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [livreurs, setLivreurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)
  const searchParams = useSearchParams()
  const orderIdFromUrl = searchParams.get('order')

  const orderFilterId = orderIdFromUrl?.trim() || null
  const displayOrders = useMemo(() => {
    if (!orderFilterId) return orders
    return orders.filter((o) => String(o.id) === orderFilterId)
  }, [orders, orderFilterId])

  useEffect(() => {
    apiRequest('/api/orders', { method: 'GET' })
      .then((r) => {
        setOrders(Array.isArray(r) ? r : [])
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    apiRequest('/api/livreurs', { method: 'GET' })
      .then((r) => setLivreurs(Array.isArray(r) ? r : []))
      .catch(() => setLivreurs([]))
  }, [])

  return (
    <section className="page-section page-section--admin-tight min-h-screen bg-[#0b1220] text-white">
        <header className="mb-10 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/70">
            Espace administrateur
          </p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            style={{
              background: 'linear-gradient(135deg, #e8e8ea 0%, #a5f3fc 45%, #fde68a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {orderFilterId ? `Commande n°${orderFilterId}` : 'Commandes'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {orderFilterId
              ? `Détail de la commande n°${orderFilterId} : statut, acheteur, plats et montants.`
              : 'Vue consolidée des commandes clients : statut, acheteur, détail des plats et montants — pour une préparation et une livraison alignées sur l’offre.'}
          </p>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement des commandes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/60 text-lg">Aucune commande pour le moment.</p>
                <p className="text-white/40 mt-2">Les commandes clients apparaîtront ici.</p>
              </div>
            ) : orderFilterId && displayOrders.length === 0 ? (
              <div className="card rounded-2xl border border-white/10 p-8 text-center">
                <p className="text-lg text-white/80">
                  Aucune commande n°{orderFilterId} dans la liste.
                </p>
                <p className="mt-2 text-sm text-white/45">
                  Vérifiez l’identifiant ou ouvrez la liste complète.
                </p>
                <Link
                  href="/admin/orders"
                  className="mt-6 inline-flex rounded-lg bg-cyan-500/90 px-5 py-2.5 text-sm font-semibold text-[#0b1220] hover:opacity-95"
                >
                  ← Toutes les commandes
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orderFilterId && (
                  <div className="card flex flex-col gap-3 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-white/80">
                      <span className="font-semibold text-cyan-200">Vue détail</span>
                      {' — '}
                      commande n°{orderFilterId} uniquement
                    </p>
                    <Link
                      href="/admin/orders"
                      className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                    >
                      ← Toutes les commandes
                    </Link>
                  </div>
                )}
                {displayOrders.map((order) => {
                  const currency = order.items?.[0]?.menu?.currency || 'USD'
                  const clientPhotoSrc = order.user?.avatar_url ? resolveMediaUrl(order.user.avatar_url) : ''
                  return (
                    <div
                      key={order.id}
                      className="order-card order-card--marketing card rounded-2xl p-5 sm:p-7"
                    >
                      {/* En-tête commande */}
                      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
                            Commande n°{order.id}
                            {order.uuid && (
                              <span className="ml-1.5 font-normal text-white/40">
                                · {order.uuid.substring(0, 8)}…
                              </span>
                            )}
                          </h2>
                          <p className="text-[13px] leading-relaxed text-white/50">
                            {formatDate(order.created_at)}
                          </p>
                          {order.delivery_address && (
                            <p className="flex max-w-xl items-start gap-2 text-[13px] leading-relaxed text-white/60">
                              <span className="mt-0.5 shrink-0 opacity-80" aria-hidden>📍</span>
                              <span>{order.delivery_address}</span>
                            </p>
                          )}
                        </div>
                        <span className={`badge shrink-0 self-start text-[11px] font-semibold uppercase tracking-wide ${getStatusBadge(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      {/* Acheteur */}
                      {order.user && (
                        <div className="mt-5 rounded-xl border border-white/[0.09] bg-black/20 px-4 py-4 sm:px-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/75">
                            Acheteur
                          </p>
                          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                            <div className="flex flex-col items-center gap-1.5 sm:items-start">
                              <div className="order-user-photo-wrap ring-1 ring-white/10">
                                {clientPhotoSrc ? (
                                  <img
                                    src={clientPhotoSrc}
                                    alt={`Client ${order.user.name || order.user.email || ''}`}
                                    className="order-photo-img"
                                    width={56}
                                    height={56}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-white/[0.04] p-1 text-center text-[10px] leading-tight text-white/40">
                                    Aucune photo
                                  </div>
                                )}
                              </div>
                              {clientPhotoSrc ? (
                                <a
                                  href={clientPhotoSrc}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="order-thumb-link text-xs"
                                >
                                  Voir en grand
                                </a>
                              ) : null}
                            </div>
                            <div className="min-w-0 space-y-1 border-t border-white/[0.06] pt-3 sm:border-t-0 sm:pt-0">
                              <p className="text-base font-semibold leading-snug text-white">
                                {order.user.name || order.user.email}
                              </p>
                              {order.user.email && order.user.name && (
                                <p className="truncate text-sm text-white/45">{order.user.email}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lignes commandées */}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-6 rounded-xl border border-white/[0.09] bg-black/15 px-4 py-5 sm:px-6">
                          <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.07] pb-4">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/75">
                                Contenu de la commande
                              </p>
                              <p className="mt-1.5 text-sm text-white/45">
                                {order.items.length} article{order.items.length > 1 ? 's' : ''} · vérification visuelle pour la préparation
                              </p>
                            </div>
                          </div>
                          <ul className="m-0 list-none space-y-0 p-0">
                            {order.items.map((item, idx) => {
                              const unitPrice = Number(item.price) || 0
                              const rawQty = Number(item.quantity) || 1
                              const itemCurrency = (item.menu?.currency || currency || 'CDF').toUpperCase()
                              const isLikelyTotal = !Number.isInteger(rawQty) && unitPrice > 0 && rawQty > unitPrice
                              const qty = isLikelyTotal ? Math.max(1, Math.round(rawQty / unitPrice)) : Math.max(1, Math.round(rawQty))
                              const lineTotal = isLikelyTotal ? rawQty : unitPrice * qty
                              const imageUrl = item.menu?.image
                              const dishSrc = imageUrl ? getBlobImageUrl(imageUrl, 320) : ''
                              const title = item.menu?.title || item.menu?.name || 'Plat'
                              return (
                                <li
                                  key={idx}
                                  className="border-b border-white/[0.07] py-5 last:border-0 last:pb-0 first:pt-0"
                                >
                                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                                    <div className="min-w-0 flex-1 space-y-2">
                                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/38">
                                        Ligne {idx + 1}{order.items.length > 1 ? ` / ${order.items.length}` : ''}
                                      </p>
                                      <p className="text-[17px] font-semibold leading-snug tracking-tight text-white">
                                        {title}
                                      </p>
                                      <p className="text-sm leading-relaxed text-white/50">
                                        <span className="tabular-nums text-white/65">{qty}</span>
                                        {' × '}
                                        <span className="tabular-nums">{formatOrderMoney(unitPrice, itemCurrency)}</span>
                                        <span className="text-white/35"> · </span>
                                        <span className="text-white/40">prix unitaire</span>
                                      </p>
                                    </div>
                                    <div className="flex flex-row items-start justify-between gap-6 sm:gap-8 lg:flex-shrink-0 lg:items-stretch">
                                      <figure className="m-0 flex flex-col items-center gap-2">
                                        <figcaption className="max-w-[6.5rem] text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                                          Visuel menu
                                        </figcaption>
                                        <div className="order-dish-photo-wrap ring-1 ring-white/10">
                                          {dishSrc ? (
                                            <img
                                              src={dishSrc}
                                              alt={`Plat : ${title}`}
                                              className="order-photo-img"
                                              width={96}
                                              height={96}
                                              loading="lazy"
                                              decoding="async"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] leading-snug text-white/35">
                                              Non renseigné
                                            </div>
                                          )}
                                        </div>
                                        {dishSrc ? (
                                          <a
                                            href={dishSrc}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="order-thumb-link text-xs"
                                          >
                                            Voir en grand
                                          </a>
                                        ) : null}
                                      </figure>
                                      <dl className="order-subtotal-box">
                                        <dt>Sous-total</dt>
                                        <dd>{formatOrderMoney(lineTotal, itemCurrency)}</dd>
                                      </dl>
                                    </div>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>

                          <div className="mt-6 border-t border-white/[0.08] pt-5">
                            <dl className="order-total-box">
                              <dt className="order-total-box__label">Montant total</dt>
                              <dd className="order-total-box__value">
                                {formatOrderMoney(order.total_amount, currency)}
                              </dd>
                            </dl>
                            {order.points_earned != null && (
                              <p className="mt-3 text-[13px] leading-relaxed text-white/45">
                                Fidélité :{' '}
                                <span className="font-medium text-amber-200/90">{order.points_earned} points</span>
                                {' '}
                                crédités après livraison validée.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {(!order.items || order.items.length === 0) && (
                        <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center">
                          <p className="text-sm text-white/45">Aucune ligne détaillée pour cette commande.</p>
                          <p className="mt-3 text-lg font-semibold tabular-nums text-white">
                            {formatOrderMoney(order.total_amount, currency)}
                          </p>
                        </div>
                      )}

                      {/* Code livraison */}
                      {order.delivery_code && (
                        <div className="mt-6 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/70">
                            Code livraison
                          </p>
                          <p className="mt-2 font-mono text-lg font-semibold tracking-wider text-cyan-100">
                            {order.delivery_code}
                          </p>
                        </div>
                      )}

                      {/* Attribuer un livreur (commandes en attente ou en livraison) */}
                      {order.delivery_code && (order.status === 'pending' || order.status === 'out_for_delivery') && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                          <span className="text-sm font-medium text-white/55">Livreur</span>
                          <select
                            value={order.livreur_id ?? ''}
                            onChange={(e) => {
                              const livreurId = e.target.value ? Number(e.target.value) : null
                              if (livreurId == null) return
                              setAssigningId(order.id)
                              apiRequest(`/api/orders/${order.id}/assign-livreur`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ livreur_id: livreurId })
                              })
                                .then((updated) => {
                                  setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, livreur_id: updated.livreur_id, delivery_driver: updated.delivery_driver } : o)))
                                })
                                .catch(() => {})
                                .finally(() => setAssigningId(null))
                            }}
                            disabled={assigningId === order.id}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white min-w-[180px]"
                          >
                            <option value="">— Choisir un livreur —</option>
                            {livreurs.map((l) => (
                              <option key={l.id} value={l.id}>{l.name || l.email}</option>
                            ))}
                          </select>
                          {order.delivery_driver && (
                            <span className="text-white/60 text-sm">Actuel : {order.delivery_driver.name || order.delivery_driver.email}</span>
                          )}
                          {assigningId === order.id && <span className="text-sm text-white/45">Enregistrement…</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
    </section>
  )
}
