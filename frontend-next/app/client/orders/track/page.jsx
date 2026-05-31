'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/lib/api'
import { fetchOrderWithLocation } from '@/lib/geo'
import Link from 'next/link'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const STATUS_LABELS = {
  pending: 'En attente',
  preparing: 'En préparation',
  ready: 'Prête',
  assigned: 'Assignée',
  out_for_delivery: 'En cours de livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

export default function ClientTrackPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const { user } = useAuth()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadOrder = async () => {
    if (!orderId) {
      setError('Aucune commande spécifiée.')
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      const data = await fetchOrderWithLocation(orderId)
      setOrder(data?.data || null)
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Commande introuvable.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderId])

  // Polling toutes les 10 secondes pour le tracking temps réel
  useEffect(() => {
    if (!orderId) return
    const id = setInterval(() => {
      loadOrder()
    }, 10000)
    return () => clearInterval(id)
  }, [orderId])

  const statusLabel = STATUS_LABELS[order?.order?.status] || order?.order?.status || '—'
  const hasDriverPosition = !!order?.order?.driver_latitude && !!order?.order?.driver_longitude
  const hasDeliveryPosition = !!order?.order?.delivery_latitude && !!order?.order?.delivery_longitude

  return (
    <section className="min-h-screen bg-[#0B0F19] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/client/orders" className="text-white/60 hover:text-white transition text-lg">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Suivi de livraison</h1>
            <p className="text-white/50 text-sm">
              Commande #{orderId} — Mise à jour automatique
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-slate-800/60 rounded-2xl p-12 text-center border border-white/5">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Chargement…</p>
          </div>
        ) : error ? (
          <div className="bg-slate-800/60 rounded-2xl p-12 text-center border border-red-500/20">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/client/orders" className="text-cyan-400 hover:underline">
              Retour à mes commandes
            </Link>
          </div>
        ) : (
          <>
            {/* Statut */}
            <div className="bg-slate-800/60 rounded-2xl p-5 mb-5 border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Statut</p>
                  <p className={`text-lg font-bold ${
                    order?.order?.status === 'delivered' ? 'text-emerald-400' :
                    order?.order?.status === 'cancelled' ? 'text-red-400' :
                    'text-cyan-400'
                  }`}>
                    {statusLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Livreur</p>
                  <p className="text-white font-medium">
                    {order?.driver?.name || 'Non assigné'}
                  </p>
                  {order?.driver?.phone && (
                    <a href={`tel:${order.driver.phone}`} className="text-cyan-400 text-sm hover:underline">
                      📞 {order.driver.phone}
                    </a>
                  )}
                </div>
              </div>
              {hasDriverPosition && order?.order?.location_updated_at && (
                <p className="text-white/40 text-xs mt-3">
                  Position du livreur mise à jour : {new Date(order.order.location_updated_at).toLocaleTimeString('fr-FR')}
                </p>
              )}
            </div>

            {/* Carte */}
            <div className="bg-slate-800/60 rounded-2xl overflow-hidden border border-white/5 mb-5" style={{ height: '420px' }}>
              <Map
                userPosition={hasDeliveryPosition ? {
                  latitude: order.order.delivery_latitude,
                  longitude: order.order.delivery_longitude,
                } : null}
                driverPosition={hasDriverPosition ? {
                  latitude: order.order.driver_latitude,
                  longitude: order.order.driver_longitude,
                } : null}
                destination={hasDeliveryPosition ? {
                  latitude: order.order.delivery_latitude,
                  longitude: order.order.delivery_longitude,
                  label: order?.order?.delivery_address || 'Votre adresse',
                } : null}
                height="100%"
                zoom={15}
                showRoute={hasDriverPosition && hasDeliveryPosition}
                className="rounded-2xl"
              />
            </div>

            {/* Info adresse */}
            <div className="bg-slate-800/60 rounded-2xl p-5 mb-5 border border-white/5">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Adresse de livraison</p>
              <p className="text-white font-medium">{order?.order?.delivery_address || '—'}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadOrder}
                disabled={refreshing}
                className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-xl font-semibold transition"
              >
                {refreshing ? 'Actualisation…' : '🔄 Actualiser'}
              </button>
              <Link
                href="/client/orders"
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white/80 rounded-xl font-medium transition"
              >
                ← Mes commandes
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
