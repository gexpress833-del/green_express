'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import LivreurShell from '@/components/LivreurShell'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { fetchOrderWithLocation } from '@/lib/geo'
import useGeolocation from '@/hooks/useGeolocation'

// Import dynamique de Leaflet (ssr: false obligatoire pour Next.js App Router)
const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const SEND_INTERVAL_MS = 5000

export default function LivreurTrackPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const { user } = useAuth()

  const [order, setOrder] = useState(null)
  const [orderLoading, setOrderLoading] = useState(true)
  const [orderError, setOrderError] = useState(null)
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState(null)
  const [deliveryStarted, setDeliveryStarted] = useState(false)

  const { position, loading: geoLoading, error: geoError } = useGeolocation({
    watch: true,
    intervalMs: SEND_INTERVAL_MS,
  })

  // Charger les détails de la commande
  useEffect(() => {
    if (!orderId) {
      setOrderError('Aucune commande spécifiée.')
      setOrderLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setOrderLoading(true)
        const data = await fetchOrderWithLocation(orderId)
        if (!cancelled) {
          setOrder(data?.data || null)
        }
      } catch (err) {
        if (!cancelled) {
          setOrderError(getApiErrorMessage(err) || 'Commande introuvable.')
        }
      } finally {
        if (!cancelled) setOrderLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [orderId])

  // Envoyer la position du livreur toutes les 5 secondes
  useEffect(() => {
    if (!position || !deliveryStarted || !orderId) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        setSending(true)
        await apiRequest('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            order_id: Number(orderId),
          }),
        })
        if (!cancelled) {
          setLastSent(new Date())
        }
      } catch {
        // Silencieux — on réessaiera à l'intervalle suivant
      } finally {
        if (!cancelled) setSending(false)
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [position, deliveryStarted, orderId])

  const openGoogleMaps = useCallback(() => {
    if (!order?.order?.delivery_latitude || !order?.order?.delivery_longitude) {
      alert('Coordonnées client non disponibles.')
      return
    }
    const lat = order.order.delivery_latitude
    const lng = order.order.delivery_longitude
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }, [order])

  const openNavigation = useCallback(() => {
    if (!position) {
      alert('Votre position GPS n\'est pas encore disponible.')
      return
    }
    if (!order?.order?.delivery_latitude || !order?.order?.delivery_longitude) {
      alert('Coordonnées client non disponibles.')
      return
    }
    const start = `${position.latitude},${position.longitude}`
    const end = `${order.order.delivery_latitude},${order.order.delivery_longitude}`
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${end}&travelmode=driving`, '_blank')
  }, [position, order])

  return (
    <LivreurShell
      title="Livraison en cours"
      subtitle="Suivez le client sur la carte et partagez votre position."
    >
      {orderLoading ? (
        <div className="card text-center py-12">
          <div className="spinner mx-auto mb-4" />
          <p className="text-white/60">Chargement de la commande…</p>
        </div>
      ) : orderError ? (
        <div className="card text-center py-12">
          <p className="text-red-400 mb-4">{orderError}</p>
          <a href="/livreur/assignments" className="text-cyan-400 hover:underline">
            Retour aux missions
          </a>
        </div>
      ) : (
        <>
          {/* Infos commande */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Commande #{order?.order?.id}
                </h3>
                <p className="text-white/70 text-sm">
                  Client : <span className="text-white font-medium">{order?.customer?.name || '—'}</span>
                </p>
                <p className="text-white/70 text-sm">
                  Téléphone : <span className="text-white font-medium">{order?.customer?.phone || '—'}</span>
                </p>
                <p className="text-white/70 text-sm">
                  Adresse : <span className="text-white font-medium">{order?.order?.delivery_address || '—'}</span>
                </p>
                <p className="text-white/70 text-sm">
                  Statut : <span className="text-cyan-400 font-semibold">{order?.order?.status || '—'}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {!deliveryStarted ? (
                  <button
                    type="button"
                    onClick={() => setDeliveryStarted(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition shadow-lg shadow-emerald-900/30"
                  >
                    🚀 Commencer la livraison
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-emerald-900/40 text-emerald-400 rounded-xl text-sm font-medium border border-emerald-500/30">
                    🛵 Livraison en cours
                  </span>
                )}
                {sending && (
                  <span className="text-xs text-cyan-400 animate-pulse text-center">
                    Envoi position…
                  </span>
                )}
                {lastSent && (
                  <span className="text-xs text-white/40 text-center">
                    Dernier envoi : {lastSent.toLocaleTimeString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* GPS status */}
          {geoLoading && (
            <div className="card mb-4 bg-cyan-950/30 border-cyan-500/20">
              <p className="text-cyan-400 text-sm flex items-center gap-2">
                <span className="spinner w-4 h-4" />
                Récupération de votre position GPS…
              </p>
            </div>
          )}
          {geoError && (
            <div className="card mb-4 bg-red-950/30 border-red-500/20">
              <p className="text-red-400 text-sm">⚠️ {geoError}</p>
            </div>
          )}

          {/* Carte */}
          <div className="card p-0 overflow-hidden mb-6" style={{ height: '420px' }}>
            <Map
              userPosition={order?.order?.delivery_latitude ? {
                latitude: order.order.delivery_latitude,
                longitude: order.order.delivery_longitude,
              } : null}
              driverPosition={position ? {
                latitude: position.latitude,
                longitude: position.longitude,
              } : null}
              destination={order?.order?.delivery_latitude ? {
                latitude: order.order.delivery_latitude,
                longitude: order.order.delivery_longitude,
                label: order?.order?.delivery_address || 'Destination',
              } : null}
              height="100%"
              zoom={15}
              showRoute={!!position && !!order?.order?.delivery_latitude}
              className="rounded-2xl"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openNavigation}
              disabled={!position || !order?.order?.delivery_latitude}
              className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl font-semibold transition shadow-lg"
            >
              🗺️ Itinéraire vers le client
            </button>
            <button
              type="button"
              onClick={openGoogleMaps}
              disabled={!order?.order?.delivery_latitude}
              className="px-5 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-semibold transition"
            >
              📍 Voir sur Google Maps
            </button>
            <a
              href="/livreur/assignments"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white/80 rounded-xl font-medium transition"
            >
              ← Retour aux missions
            </a>
          </div>
        </>
      )}
    </LivreurShell>
  )
}
