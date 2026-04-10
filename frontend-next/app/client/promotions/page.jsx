"use client"
import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState } from 'react'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import PromoCard from '@/components/PromoCard'
import Toaster, { pushToast } from '@/components/Toaster'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientPromotions() {
  const [currentPromo, setCurrentPromo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [userPoints, setUserPoints] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(null)
  const { isAuthenticated, initialised } = useAuth()

  async function loadCurrentPromo() {
    setLoading(true)
    try {
      // D'abord promotion en cours (active maintenant)
      let r = await apiRequest('/api/promotions?active_only=1&current=1', { method: 'GET' })
      let promo = r && typeof r === 'object' && !Array.isArray(r) && r.id ? r : null
      if (!promo) {
        // Sinon : promotions visibles (en cours + à venir, pas encore terminées)
        const list = await apiRequest('/api/promotions?visible_to_client=1&per_page=5', { method: 'GET' })
        const arr = Array.isArray(list) ? list : list?.data || []
        promo = arr.length > 0 ? arr[0] : null
      }
      setCurrentPromo(promo)
    } catch (err) {
      setCurrentPromo(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadClientStats() {
    try {
      const s = await apiRequest('/api/client/stats', { method: 'GET' })
      setUserPoints(s.points ?? null)
    } catch (e) {
      setUserPoints(null)
    }
  }

  useEffect(() => {
    if (!initialised) return
    setIsLoggedIn(!!isAuthenticated)
  }, [initialised, isAuthenticated])

  useEffect(() => {
    loadCurrentPromo()
  }, [])

  useEffect(() => {
    if (isLoggedIn === true) loadClientStats()
  }, [isLoggedIn])

  async function claimPromotion(promo) {
    if (!promo || !confirm('Confirmer la réclamation de cette offre ?')) return
    setClaiming(true)
    try {
      const res = await apiRequest(`/api/promotions/${promo.id}/claim`, { method: 'POST' })
      const msg = res.ticket_code
        ? `${res.message} — Votre ticket : ${res.ticket_code} (à présenter au vérificateur)`
        : (res.message || 'Réclamation réussie')
      pushToast({ type: 'success', message: msg })
      await loadCurrentPromo()
      await loadClientStats()
    } catch (err) {
      pushToast({ type: 'error', message: getApiErrorMessage(err) || 'Erreur lors de la réclamation' })
    } finally {
      setClaiming(false)
    }
  }

  const p = currentPromo
  const pointsRequired = p?.points_required ?? 0
  const hasEnoughPoints =
    pointsRequired === 0 ||
    (userPoints !== null && userPoints >= pointsRequired)
  const isUpcoming = p?.start_at && new Date(p.start_at) > new Date()
  const claimDisabled =
    !p ||
    claiming ||
    isUpcoming ||
    (p.quantity_limit !== null && p.quantity_limit <= 0) ||
    (p.end_at && new Date(p.end_at) < new Date()) ||
    !hasEnoughPoints

  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'claim']} showWarning={false}>
      <section className="page-section min-h-screen bg-[#0b1220]">
        <div className="container">
          <ClientSubpageHeader
            title="Promotion du moment"
            subtitle="Une seule promotion à réclamer avec vos points de fidélité."
            icon="🎁"
            desktopExtra={isLoggedIn === true && userPoints !== null ? (
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-amber-500/30 mt-4">
                <span className="text-2xl" aria-hidden>⭐</span>
                <div>
                  <span className="text-white/60 text-sm block">Votre solde</span>
                  <span className="text-2xl font-bold text-amber-300">{userPoints} points</span>
                </div>
              </div>
            ) : null}
          />

              {loading ? (
                <div className="card text-center py-16">
                  <p className="text-white/60">Chargement de la promotion...</p>
                </div>
              ) : !currentPromo ? (
                <div className="card text-center py-16">
                  <div className="text-6xl mb-4">🎁</div>
                  <p className="text-white/60 text-lg">Aucune promotion disponible pour le moment.</p>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto">
                  {isLoggedIn === false && (
                    <div className="mb-4 p-4 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-200 text-sm">
                      Seuls les clients connectés peuvent réclamer la promotion. Connectez-vous ou créez un compte pour utiliser vos points fidélité.
                    </div>
                  )}
                  {isLoggedIn === true && pointsRequired > 0 && userPoints !== null && userPoints < pointsRequired && (
                    <div className="mb-4 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-200 text-sm">
                      Points insuffisants pour réclamer cette promotion : il vous faut <strong>{pointsRequired} points</strong>, vous en avez <strong>{userPoints}</strong>. Passez des commandes et validez la livraison pour gagner des points.
                    </div>
                  )}
                  <PromoCard
                    promo={currentPromo}
                    onClaim={isLoggedIn === true ? claimPromotion : undefined}
                    claimDisabled={claimDisabled}
                    claimLoading={claiming}
                    loginRequired={isLoggedIn !== true}
                    isUpcoming={isUpcoming}
                  />
                </div>
              )}
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
