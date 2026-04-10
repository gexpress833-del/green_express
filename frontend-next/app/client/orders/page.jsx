"use client"
import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'
import { getOrderStatusLabel } from '@/lib/orderStatus'
import Link from 'next/link'

export default function ClientOrders(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const orderIdFromUrl = searchParams.get('order')
  const orderRefs = useRef({})

  useEffect(()=>{
    apiRequest('/api/orders', { method:'GET' })
      .then(r => {
        setOrders(Array.isArray(r) ? r : [])
        setLoading(false)
      })
      .catch(() => {
        setOrders([])
        setLoading(false)
      })
  },[])

  useEffect(() => {
    if (loading || !orderIdFromUrl || orders.length === 0) return
    const id = orderIdFromUrl.trim()
    const el = orderRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-[#0b1220]')
      const t = setTimeout(() => {
        el.classList.remove('ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-[#0b1220]')
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [loading, orderIdFromUrl, orders.length])

  return (
    <ReadOnlyGuard allowedActions={['view', 'read']} showWarning={false}>
      <section className="page-section min-h-screen bg-[#0b1220]">
        <div className="container">
          <ClientSubpageHeader
            title="Mes commandes"
            subtitle="Consultez l'historique de vos commandes"
            icon="🛒"
          />

              {loading ? (
                <div className="card text-center">
                  <p className="text-white/60">Chargement...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="card text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-white/60 text-lg">Aucune commande récente.</p>
                  <p className="text-white/40 mt-2">Vos commandes apparaîtront ici une fois passées.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const getStatusBadge = (status) => {
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

                    return (
                      <div
                        key={order.id}
                        ref={(el) => { if (el) orderRefs.current[String(order.id)] = el }}
                        className="card fade-in rounded-xl transition-shadow duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-1" style={{ 
                              background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              Commande #{order.id || order.uuid?.substring(0, 8)}
                            </h3>
                            <p className="text-white/60 text-sm">
                              {formatDate(order.created_at)}
                            </p>
                            {order.delivery_address && (
                              <p className="text-white/50 text-xs mt-1">
                                📍 {order.delivery_address}
                              </p>
                            )}
                          </div>
                          <span className={`badge ${getStatusBadge(order.status)}`}>
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </div>

                        {/* Plats */}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-white/80 text-sm font-semibold mb-3">Plats</p>
                            <ul className="space-y-3 list-none pl-0 m-0">
                              {order.items.map((item, idx) => {
                                const unitPrice = Number(item.price) || 0
                                const rawQty = Number(item.quantity) || 1
                                const currency = (item.menu?.currency || order.currency || 'CDF').toUpperCase()
                                const isLikelyTotal = !Number.isInteger(rawQty) && unitPrice > 0 && rawQty > unitPrice
                                const qty = isLikelyTotal ? Math.max(1, Math.round(rawQty / unitPrice)) : Math.max(1, Math.round(rawQty))
                                const lineTotal = isLikelyTotal ? rawQty : unitPrice * qty
                                const fmt = (n) => (currency === 'CDF' || currency === 'FC') ? formatCurrencyCDF(n) : `${Number(n).toLocaleString('fr-FR')} ${currency}`
                                return (
                                  <li key={idx} className="flex justify-between items-baseline py-2 border-b border-white/10 last:border-0 gap-4">
                                    <div>
                                      <p className="text-white/90 font-medium">{item.menu?.title || 'Plat'}</p>
                                      <p className="text-white/50 text-xs">{qty} × {fmt(unitPrice)}</p>
                                    </div>
                                    <span className="text-white/90 font-medium tabular-nums shrink-0">{fmt(lineTotal)}</span>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Code de livraison */}
                        {order.delivery_code && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg">
                            <p className="text-white/70 text-sm mb-2">Code de livraison:</p>
                            <p className="text-2xl font-bold text-cyan-400" style={{
                              letterSpacing: '2px',
                              fontFamily: 'monospace'
                            }}>
                              {order.delivery_code}
                            </p>
                            <p className="text-white/50 text-xs mt-2">
                              Présentez ce code au livreur lors de la livraison
                            </p>
                          </div>
                        )}

                        {/* Informations de paiement */}
                        {order.status === 'pending_payment' && (
                          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-400 text-sm">
                              ⚠️ Paiement en attente - Confirmez le paiement pour générer votre code de livraison
                            </p>
                            <Link
                              href={`/client/orders/create?order_id=${order.id}`}
                              className="inline-flex mt-3 px-4 py-2 rounded-lg bg-[#d4af37] text-[#0b1220] text-sm font-semibold hover:bg-[#e5c048] transition"
                            >
                              Payer avec Mobile Money
                            </Link>
                          </div>
                        )}

                        <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-white/10">
                          <Link
                            href={`/client/orders/${order.id}`}
                            className="text-sm text-cyan-300/90 hover:text-cyan-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1 -mx-1"
                          >
                            Suivi détaillé →
                          </Link>
                          <p className="text-white/80 text-sm">
                            Total : <span className="font-semibold text-cyan-300 tabular-nums">
                              {order.total_amount != null
                                ? (() => {
                                    const cur = (order.items?.[0]?.menu?.currency || order.currency || 'CDF').toUpperCase()
                                    return (cur === 'CDF' || cur === 'FC') ? formatCurrencyCDF(order.total_amount) : `${Number(order.total_amount).toLocaleString('fr-FR')} ${cur}`
                                  })()
                                : '—'}
                            </span>
                          </p>
                          {order.points_earned != null && (
                            <p className="text-white/60 text-sm">
                              {order.status === 'delivered' ? '✅' : '⏳'} {order.points_earned} pts
                              {order.status !== 'delivered' && <span className="text-white/40 ml-1">(après validation livraison)</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
