"use client"
import '@/styles/admin-order-thumbs.css'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatDate, formatOrderMoney } from '@/lib/helpers'
import { getBlobImageUrl, resolveMediaUrl } from '@/lib/imageLoader'
import Sidebar from '@/components/Sidebar'

function getStatusLabel(status) {
  switch (status) {
    case 'pending_payment': return 'En attente de paiement'
    case 'pending': return 'En attente de livraison'
    case 'out_for_delivery': return 'En cours de livraison'
    case 'delivered': return 'Livrée'
    default: return status || '—'
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'pending_payment': return 'badge-error'
    case 'pending': return 'badge-warning'
    case 'out_for_delivery': return 'badge-warning'
    case 'delivered': return 'badge-success'
    default: return 'badge-error'
  }
}

export default function CuisinierOrdersPage() {
  const [orders, setOrders] = useState([])
  const [livreurs, setLivreurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)
  const searchParams = useSearchParams()
  const orderIdFromUrl = searchParams.get('order')
  const orderRefs = useRef({})

  useEffect(() => {
    apiRequest('/api/orders', { method: 'GET' })
      .then((r) => setOrders(Array.isArray(r) ? r : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    apiRequest('/api/livreurs', { method: 'GET' })
      .then((r) => setLivreurs(Array.isArray(r) ? r : []))
      .catch(() => setLivreurs([]))
  }, [])

  useEffect(() => {
    if (loading || !orderIdFromUrl || orders.length === 0) return
    const id = orderIdFromUrl.trim()
    const el = orderRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-purple-400', 'ring-offset-2', 'ring-offset-[#0b1220]')
      const t = setTimeout(() => {
        el.classList.remove('ring-2', 'ring-purple-400', 'ring-offset-2', 'ring-offset-[#0b1220]')
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [loading, orderIdFromUrl, orders.length])

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #9d4edd 0%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Commandes — Attribuer un livreur
          </h1>
          <p className="text-white/70 text-lg">Choisissez un livreur pour chaque commande à livrer.</p>
          <Link href="/cuisinier" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">← Retour tableau de bord</Link>
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
                <Link href="/cuisinier" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">Retour tableau de bord</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const currency = order.items?.[0]?.menu?.currency || 'USD'
                  const clientPhotoSrc = order.user?.avatar_url ? resolveMediaUrl(order.user.avatar_url) : ''
                  return (
                    <div
                      key={order.id}
                      ref={(el) => { if (el) orderRefs.current[String(order.id)] = el }}
                      className="order-card order-card--marketing card rounded-2xl p-5 sm:p-7"
                    >
                      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-purple-500/20 bg-[#0b1220] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="min-w-0 space-y-2">
                          <h3 className="text-lg font-semibold text-purple-400">
                            Commande #{order.id}
                            {order.uuid && <span className="text-white/50 font-normal"> — {order.uuid.substring(0, 8)}…</span>}
                          </h3>
                          <p className="text-white/60 text-sm">{formatDate(order.created_at)}</p>
                          {order.delivery_address && (
                            <p className="text-white/50 text-sm">📍 {order.delivery_address}</p>
                          )}
                          {order.user && (
                            <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-200/80">Photo du client</p>
                              <div className="mt-2 flex min-w-0 flex-wrap items-start gap-3">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="order-user-photo-wrap">
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
                                      <div className="flex h-full w-full items-center justify-center bg-white/5 p-1 text-center text-[10px] leading-tight text-white/45">
                                        Pas de photo
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
                                <div className="min-w-0 flex-1 pt-0.5">
                                  <p className="text-sm font-semibold text-white">{order.user.name || order.user.email}</p>
                                  {order.user.email && order.user.name && (
                                    <p className="mt-0.5 truncate text-xs text-white/50">{order.user.email}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className={`badge shrink-0 ${getStatusBadge(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mb-6 rounded-lg border border-white/10 bg-[#0b1220] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-white/90 text-sm font-semibold">Détail des plats</p>
                            <p className="text-[11px] text-white/45">{order.items.length} article{order.items.length > 1 ? 's' : ''}</p>
                          </div>
                          <ul className="list-none space-y-0 pl-0 m-0">
                            {order.items.map((item, idx) => {
                              const unitPrice = Number(item.price) || 0
                              const rawQty = Number(item.quantity) || 1
                              const itemCurrency = (item.menu?.currency || currency || 'CDF').toUpperCase()
                              const isLikelyTotal = !Number.isInteger(rawQty) && unitPrice > 0 && rawQty > unitPrice
                              const qty = isLikelyTotal ? Math.max(1, Math.round(rawQty / unitPrice)) : Math.max(1, Math.round(rawQty))
                              const lineTotal = isLikelyTotal ? rawQty : unitPrice * qty
                              const imageUrl = item.menu?.image
                              const dishSrc = imageUrl ? getBlobImageUrl(imageUrl, 360) : ''
                              const title = item.menu?.title || item.menu?.name || 'Plat'
                              return (
                                <li
                                  key={idx}
                                  className="border-b border-white/10 py-4 last:border-0 last:pb-0"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-300/90">
                                        Plat commandé {order.items.length > 1 ? `(${idx + 1})` : ''}
                                      </p>
                                      <p className="text-base font-semibold leading-snug text-white">{title}</p>
                                      <p className="text-sm text-white/55">
                                        <span className="tabular-nums">{qty}</span>
                                        {' × '}
                                        <span className="tabular-nums">{formatOrderMoney(unitPrice, itemCurrency)}</span>
                                        <span className="text-white/35"> · </span>
                                        <span className="text-white/45">prix unitaire</span>
                                      </p>
                                    </div>
                                    <div className="flex flex-row items-end justify-between gap-4 sm:flex-col sm:items-end sm:justify-between sm:shrink-0">
                                      <figure className="m-0 flex shrink-0 flex-col items-center gap-1">
                                        <figcaption className="max-w-[6.5rem] text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                                          Visuel menu
                                        </figcaption>
                                        <div className="order-dish-photo-wrap order-dish-photo-wrap--lg">
                                          {dishSrc ? (
                                            <img
                                              src={dishSrc}
                                              alt={`Plat commandé : ${title}`}
                                              className="order-photo-img"
                                              width={104}
                                              height={104}
                                              loading="lazy"
                                              decoding="async"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] leading-tight text-white/45">
                                              Photo non renseignée
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

                      {order.delivery_code && (
                        <p className="text-sm text-cyan-400 font-mono mb-6">Code livraison : {order.delivery_code}</p>
                      )}

                      {order.delivery_code && (order.status === 'pending' || order.status === 'out_for_delivery') && (
                        <div className="mb-6 flex flex-wrap items-center gap-3">
                          <span className="text-white/70 text-sm">Livreur :</span>
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
                          {assigningId === order.id && <span className="text-white/50 text-sm">Enregistrement…</span>}
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
