'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useCompany } from '@/lib/useCompany'
import { apiRequest } from '@/lib/api'
import GoldButton from '@/components/GoldButton'

const NEARING_END_DAYS = 7

function isNearingEnd(sub) {
  if (!sub || sub.status !== 'active' || !sub.end_date) return false
  const end = new Date(sub.end_date)
  const now = new Date()
  const daysLeft = Math.ceil((end - now) / (24 * 60 * 60 * 1000))
  return daysLeft <= NEARING_END_DAYS && daysLeft >= 0
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—'
}

const STATUS_LABELS = {
  pending: 'En attente de validation',
  active: 'Actif',
  expired: 'Expiré',
  cancelled: 'Annulé',
}

/**
 * Bloc principal « Abonnement entreprise » (dashboard uniquement si company.status === 'active').
 */
export default function EntrepriseSubscriptionSection() {
  const { company, loading: companyLoading } = useCompany()
  const [subscriptions, setSubscriptions] = useState({ data: [] })
  const [loading, setLoading] = useState(true)

  const loadSubscriptions = useCallback(() => {
    if (!company?.id || company.status !== 'active') {
      setLoading(false)
      return
    }
    setLoading(true)
    apiRequest(`/api/companies/${company.id}/subscriptions`, { method: 'GET' })
      .then((r) => {
        if (r?.success && r?.data) setSubscriptions(r.data)
      })
      .catch(() => setSubscriptions({ data: [] }))
      .finally(() => setLoading(false))
  }, [company?.id, company?.status])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  if (companyLoading) {
    return (
      <section className="card p-6 mb-6 border border-white/10" aria-busy="true">
        <h2 className="text-lg font-semibold text-white mb-2">Abonnement entreprise</h2>
        <p className="text-white/50 text-sm">Chargement…</p>
      </section>
    )
  }

  if (!company || company.status !== 'active') {
    return null
  }

  const list = Array.isArray(subscriptions?.data) ? subscriptions.data : []
  const currentSub = list.find((s) => s.status === 'active' || s.status === 'pending')
  const expiredSub = list.find((s) => s.status === 'expired')

  if (loading) {
    return (
      <section className="card p-6 mb-6 border border-cyan-500/20 bg-cyan-500/[0.03]" aria-busy="true">
        <h2 className="text-lg font-semibold text-white mb-2">Abonnement entreprise</h2>
        <p className="text-white/50 text-sm">Chargement de votre abonnement…</p>
      </section>
    )
  }

  // CAS 3 : abonnement actif (ou en attente d’activation par l’admin)
  if (currentSub) {
    const isActive = currentSub.status === 'active'
    const isPending = currentSub.status === 'pending'
    const nearing = isActive && isNearingEnd(currentSub)

    return (
      <section
        className={`card p-6 mb-6 border ${
          isPending
            ? 'border-amber-500/40 bg-amber-500/[0.06]'
            : nearing
              ? 'border-orange-500/40 bg-orange-500/[0.05]'
              : 'border-emerald-500/40 bg-emerald-500/[0.06]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Abonnement entreprise</h2>
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              {isPending ? '🟠 Demande en cours' : nearing ? '🟠 Bientôt à échéance' : '🟢 Abonnement actif'}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-lg ${
              isPending
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
            }`}
          >
            {STATUS_LABELS[currentSub.status] || currentSub.status}
          </span>
        </div>

        {isActive && (
          <div className="grid sm:grid-cols-3 gap-3 mb-5 text-sm">
            <div className="rounded-lg bg-black/20 px-3 py-2 border border-white/10">
              <span className="text-white/50 block text-xs mb-0.5">Début</span>
              <span className="text-white font-medium">{formatDate(currentSub.start_date)}</span>
            </div>
            <div className="rounded-lg bg-black/20 px-3 py-2 border border-white/10">
              <span className="text-white/50 block text-xs mb-0.5">Fin</span>
              <span className="text-white font-medium">{formatDate(currentSub.end_date)}</span>
            </div>
            <div className="rounded-lg bg-black/20 px-3 py-2 border border-white/10">
              <span className="text-white/50 block text-xs mb-0.5">Statut</span>
              <span className="text-emerald-300 font-medium">{nearing ? 'Actif (échéance proche)' : 'Actif'}</span>
            </div>
          </div>
        )}

        {isPending && (
          <p className="text-amber-100/90 text-sm mb-5">
            Votre demande a été enregistrée. L’abonnement sera activé après validation du paiement par Green Express.
          </p>
        )}

        {isActive && nearing && (
          <p className="text-orange-200/90 text-sm mb-5">
            Votre période se termine bientôt — pensez à renouveler pour éviter une interruption.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/entreprise/subscriptions"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold bg-cyan-600 hover:bg-cyan-500 text-white text-sm transition shadow-lg shadow-cyan-900/30"
          >
            {isPending ? 'Voir ma demande' : 'Voir abonnement'}
          </Link>
          {isActive && (
            <GoldButton href="/entreprise/subscriptions" className="text-sm">
              Renouveler
            </GoldButton>
          )}
        </div>
      </section>
    )
  }

  // CAS 2 : aucun abonnement actif / en attente (éventuellement un ancien expiré)
  return (
    <section className="card p-6 mb-6 border border-cyan-500/35 bg-gradient-to-br from-cyan-500/[0.07] to-transparent">
      <h2 className="text-lg font-semibold text-white mb-2">Abonnement entreprise</h2>
      <p className="text-xs font-medium uppercase tracking-wider text-cyan-300/90 mb-2">🔵 Aucun abonnement actif</p>
      <p className="text-white/75 text-sm mb-5 max-w-xl">
        Souscrivez à un abonnement pour couvrir les repas de votre équipe. La tarification dépend de l’effectif déclaré
        (validation administrative).
      </p>
      {expiredSub && (
        <p className="text-red-300/90 text-sm mb-4">
          Un précédent abonnement est expiré ({formatDate(expiredSub.end_date)}). Vous pouvez souscrire à nouveau ou
          renouveler depuis la page abonnements.
        </p>
      )}
      <GoldButton href="/entreprise/subscriptions">Souscrire à un abonnement</GoldButton>
    </section>
  )
}
