'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import LivreurShell from '@/components/LivreurShell'
import OrderStatusTimeline from '@/components/OrderStatusTimeline'
import { apiRequest } from '@/lib/api'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'
import { getOrderStatusLabel } from '@/lib/orderStatus'

export default function LivreurOrderDetails() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiRequest(`/api/orders/${id}`, { method: 'GET' })
      .then((r) => {
        setOrder(r)
        setError(null)
      })
      .catch((e) => {
        setError(e?.message || 'Commande introuvable')
        setOrder(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <LivreurShell
      title={order ? `Commande #${order.id}` : 'Commande'}
      subtitle="Detail et etapes pour la livraison."
    >
            {loading && (
              <div className="card text-center py-10 border border-white/10">
                <p className="text-white/60">Chargement...</p>
              </div>
            )}
            {!loading && error && (
              <div className="card border border-red-500/30 bg-red-500/10 text-center py-8">
                <p className="text-red-200">{error}</p>
                <Link href="/livreur/assignments" className="inline-block mt-4 text-pink-300 hover:underline">
                  Retour aux missions
                </Link>
              </div>
            )}
            {!loading && order && (
              <div className="space-y-6">
                <div className="card border border-white/10">
                  <h2 className="text-lg font-semibold text-white/95 mb-4">Suivi</h2>
                  <OrderStatusTimeline status={order.status} />
                </div>

                <div className="card border border-white/10">
                  <p className="text-sm text-white/50">{formatDate(order.created_at)}</p>
                  <p className="mt-2 text-cyan-200/90 font-medium">{getOrderStatusLabel(order.status)}</p>
                  {order.delivery_address && (
                    <p className="mt-4 text-white/75 text-sm">
                      <span className="text-white/45">Adresse : </span>
                      {order.delivery_address}
                    </p>
                  )}
                  {order.user && (
                    <p className="mt-2 text-white/65 text-sm">
                      Client : {order.user.name || order.user.email}
                      {order.user.phone && <span className="text-white/45"> · {order.user.phone}</span>}
                    </p>
                  )}

                  {order.items && order.items.length > 0 && (
                    <ul className="mt-6 space-y-2 list-none p-0 border-t border-white/10 pt-4">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between gap-4 text-sm text-white/85">
                          <span>
                            {item.menu?.title || 'Plat'} × {Math.max(1, Number(item.quantity) || 1)}
                          </span>
                          <span className="tabular-nums text-white/70">
                            {(() => {
                              const u = Number(item.price) || 0
                              const q = Math.max(1, Number(item.quantity) || 1)
                              const cur = (item.menu?.currency || 'CDF').toUpperCase()
                              const t = u * q
                              return cur === 'CDF' || cur === 'FC' ? formatCurrencyCDF(t) : `${t.toLocaleString('fr-FR')} ${cur}`
                            })()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {order.delivery_code && (
                    <div className="mt-6 p-4 rounded-lg border border-cyan-500/25 bg-cyan-500/10">
                      <p className="text-xs uppercase tracking-wider text-cyan-200/80">Code livraison (apres paiement)</p>
                      <p className="mt-2 font-mono text-xl text-cyan-100 tracking-widest">{order.delivery_code}</p>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <Link
                    href="/livreur/assignments"
                    className="text-pink-300 text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded"
                  >
                    Retour aux missions
                  </Link>
                </div>
              </div>
            )}
    </LivreurShell>
  )
}
