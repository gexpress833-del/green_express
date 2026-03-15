"use client"
import ClientSidebar from '@/components/ClientSidebar'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'

export default function ClientOrders(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <ReadOnlyGuard allowedActions={['view', 'read']} showWarning={false}>
      <section className="page-section min-h-screen">
        <div className="container">
          <header className="mb-8 fade-in">
            <h1 className="text-4xl font-extrabold mb-2" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 40px rgba(0, 255, 255, 0.5)'
            }}>
              Mes commandes
            </h1>
            <p className="text-white/70 text-lg">Consultez l'historique de vos commandes</p>
          </header>

          <div className="dashboard-grid">
            <ClientSidebar />
            <main className="main-panel">
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
                    const getStatusLabel = (status) => {
                      const s = (status || '').toLowerCase()
                      switch (s) {
                        case 'pending_payment': return 'En attente de paiement'
                        case 'pending': return 'En attente de livraison'
                        case 'out_for_delivery': return 'En cours de livraison'
                        case 'delivered': return 'Livrée'
                        default: return status || 'En attente'
                      }
                    }

                    const getStatusBadge = (status) => {
                      const s = (status || '').toLowerCase()
                      switch (s) {
                        case 'pending_payment': return 'badge-error'
                        case 'pending': return 'badge-warning'
                        case 'out_for_delivery': return 'badge-warning'
                        case 'delivered': return 'badge-success'
                        default: return 'badge-error'
                      }
                    }

                    return (
                      <div key={order.id} className="card fade-in">
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
                            {getStatusLabel(order.status)}
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
                          </div>
                        )}

                        <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-white/10">
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
            </main>
          </div>
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
