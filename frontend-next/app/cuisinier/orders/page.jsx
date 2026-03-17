"use client"
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/helpers'
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
                  return (
                    <div key={order.id} className="card rounded-xl transition-shadow duration-300 p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-purple-400">
                            Commande #{order.id}
                            {order.uuid && <span className="text-white/50 font-normal"> — {order.uuid.substring(0, 8)}…</span>}
                          </h3>
                          <p className="text-white/60 text-sm">{formatDate(order.created_at)}</p>
                          {order.delivery_address && (
                            <p className="text-white/50 text-sm">📍 {order.delivery_address}</p>
                          )}
                          {order.user && (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white/80">
                                {order.user.avatar_url ? (
                                  <img src={order.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(order.user.name || order.user.email || '?').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <p className="text-white/50 text-sm">{order.user.name || order.user.email}</p>
                            </div>
                          )}
                        </div>
                        <span className={`badge shrink-0 ${getStatusBadge(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/5">
                          <p className="text-white/80 text-sm font-semibold mb-3">Plats</p>
                          <ul className="space-y-3 list-none pl-0 m-0">
                            {order.items.map((item, idx) => {
                              const unitPrice = Number(item.price) || 0
                              const rawQty = Number(item.quantity) || 1
                              const itemCurrency = item.menu?.currency || 'USD'
                              const isLikelyTotal = !Number.isInteger(rawQty) && unitPrice > 0 && rawQty > unitPrice
                              const qty = isLikelyTotal ? Math.max(1, Math.round(rawQty / unitPrice)) : Math.max(1, Math.round(rawQty))
                              const lineTotal = isLikelyTotal ? rawQty : unitPrice * qty
                              const imageUrl = item.menu?.image
                              const title = item.menu?.title || item.menu?.name || 'Plat'
                              return (
                                <li key={idx} className="flex gap-4 py-3 border-b border-white/10 last:border-0 last:pb-0 items-center">
                                  <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/10 border border-white/10">
                                    {imageUrl ? (
                                      <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">Photo</div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-white/90 font-medium">{title}</p>
                                    <p className="text-white/50 text-xs mt-0.5">{qty} × {unitPrice.toLocaleString('fr-FR')} {itemCurrency}</p>
                                  </div>
                                  <span className="text-white/90 font-medium tabular-nums whitespace-nowrap shrink-0">
                                    {lineTotal.toLocaleString('fr-FR')} {itemCurrency}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
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

                      <div className="pt-4 mt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                        <span className="text-white/90">
                          Total : <strong className="tabular-nums">{order.total_amount != null ? Number(order.total_amount).toLocaleString('fr-FR') : '—'} {currency}</strong>
                        </span>
                        {order.points_earned != null && (
                          <span className="text-white/60 text-sm">— {order.points_earned} points</span>
                        )}
                      </div>
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
