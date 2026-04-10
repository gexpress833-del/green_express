'use client'

import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import OrderStatusTimeline from '@/components/OrderStatusTimeline'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'
import { getOrderStatusLabel } from '@/lib/orderStatus'

export default function ClientOrderDetailPage() {
  const params = useParams()
  const id = params?.id
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    apiRequest(`/api/orders/${encodeURIComponent(id)}`, { method: 'GET' })
      .then((r) => {
        setOrder(r)
      })
      .catch((e) => {
        setError(e?.message || 'Commande introuvable')
        setOrder(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <ReadOnlyGuard allowedActions={['view', 'read']} showWarning={false}>
      <section className="page-section min-h-screen bg-[#0b1220]" aria-label="Détail de la commande">
        <div className="container max-w-3xl">
          <ClientSubpageHeader
            title={order ? `Commande #${order.id}` : 'Commande'}
            subtitle="Suivi et détails"
            icon="📦"
            backHref="/client/orders"
            backLabel="Mes commandes"
          />

          {loading && (
            <div className="card text-center">
              <p className="text-white/60">Chargement…</p>
            </div>
          )}

          {!loading && error && (
            <div className="card text-center border border-red-500/30 bg-red-500/10">
              <p className="text-red-300">{error}</p>
              <Link
                href="/client/orders"
                className="inline-flex mt-4 px-4 py-2 rounded-lg bg-white/10 text-cyan-200 text-sm hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Retour aux commandes
              </Link>
            </div>
          )}

          {!loading && order && (
            <div className="space-y-6">
              <div className="card rounded-xl border border-white/10">
                <h2 className="text-lg font-semibold text-white/95 mb-4">Suivi</h2>
                <OrderStatusTimeline status={order.status} />
              </div>

              <div className="card rounded-xl border border-white/10">
                <div className="flex flex-wrap justify-between gap-2 mb-4">
                  <p className="text-white/50 text-sm">{formatDate(order.created_at)}</p>
                  <span className="text-sm font-medium text-cyan-200/90">{getOrderStatusLabel(order.status)}</span>
                </div>
                {order.delivery_address && (
                  <p className="text-white/65 text-sm mb-4">
                    <span className="text-white/40">Adresse : </span>
                    {order.delivery_address}
                  </p>
                )}

                {order.items && order.items.length > 0 && (
                  <ul className="space-y-2 list-none p-0 m-0 border-t border-white/10 pt-4">
                    {order.items.map((item, idx) => {
                      const unitPrice = Number(item.price) || 0
                      const rawQty = Number(item.quantity) || 1
                      const currency = (item.menu?.currency || order.currency || 'CDF').toUpperCase()
                      const isLikelyTotal = !Number.isInteger(rawQty) && unitPrice > 0 && rawQty > unitPrice
                      const qty = isLikelyTotal ? Math.max(1, Math.round(rawQty / unitPrice)) : Math.max(1, Math.round(rawQty))
                      const lineTotal = isLikelyTotal ? rawQty : unitPrice * qty
                      const fmt = (n) =>
                        currency === 'CDF' || currency === 'FC'
                          ? formatCurrencyCDF(n)
                          : `${Number(n).toLocaleString('fr-FR')} ${currency}`
                      return (
                        <li key={idx} className="flex justify-between gap-4 text-sm">
                          <span className="text-white/85">
                            {item.menu?.title || 'Plat'} × {qty}
                          </span>
                          <span className="text-white/80 tabular-nums shrink-0">{fmt(lineTotal)}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {order.delivery_code && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/25 rounded-lg">
                    <p className="text-white/65 text-sm mb-2">Code de livraison</p>
                    <p
                      className="text-2xl font-bold text-cyan-300 font-mono tracking-widest"
                      aria-label={`Code de livraison : ${order.delivery_code}`}
                    >
                      {order.delivery_code}
                    </p>
                    <p className="text-white/45 text-xs mt-2">À communiquer au livreur à la réception.</p>
                  </div>
                )}

                {order.status === 'pending_payment' && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-300 text-sm mb-3">Paiement en attente.</p>
                    <Link
                      href={`/client/orders/create?order_id=${order.id}`}
                      className="inline-flex px-4 py-2 rounded-lg bg-[#d4af37] text-[#0b1220] text-sm font-semibold hover:bg-[#e5c048] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220] focus-visible:ring-amber-300"
                    >
                      Payer avec Mobile Money
                    </Link>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-baseline">
                  <span className="text-white/60 text-sm">Total</span>
                  <span className="text-lg font-semibold text-cyan-200 tabular-nums">
                    {order.total_amount != null
                      ? (() => {
                          const cur = (order.items?.[0]?.menu?.currency || order.currency || 'CDF').toUpperCase()
                          return cur === 'CDF' || cur === 'FC'
                            ? formatCurrencyCDF(order.total_amount)
                            : `${Number(order.total_amount).toLocaleString('fr-FR')} ${cur}`
                        })()
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/client/orders"
                  className="text-cyan-300/90 text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
                >
                  ← Toutes mes commandes
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
