"use client"
import LivreurShell from '@/components/LivreurShell'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import GoldButton from '@/components/GoldButton'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'
import { getOrderStatusLabel } from '@/lib/orderStatus'
import { useAuth } from '@/contexts/AuthContext'
import { useEchoChannel } from '@/lib/useEchoChannel'
import { pushRealtimePing } from '@/lib/realtimePing'

export default function LivreurAssignments(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    loadAssignments()
  }, [])

  useEchoChannel({
    enabled: !!user?.id,
    channel: user?.id ? `orders.livreur.${user.id}` : null,
    event: '.order.updated',
    onEvent: (payload) => {
      const orderRef = payload?.order_id ? `#${payload.order_id}` : ''
      const message = payload?.action === 'livreur_assigned'
        ? `Nouvelle mission ${orderRef}`.trim()
        : `Mission ${orderRef} mise à jour`.trim()
      pushRealtimePing(message)
      loadAssignments()
    },
  })

  function loadAssignments(){
    setLoading(true)
    apiRequest('/api/livreur/assignments', { method: 'GET' })
      .then(r => {
        setOrders(Array.isArray(r) ? r : [])
        setLoading(false)
      })
      .catch(() => {
        setOrders([])
        setLoading(false)
      })
  }

  function handleValidateCode(){
    const code = (codeInput || '').trim().toUpperCase()
    if (!code || code.length !== 9) {
      setValidationResult({ success: false, message: 'Le code doit faire exactement 9 caracteres (format GX-XXXXXX).' })
      return
    }

    setValidatingCode(true)
    setValidationResult(null)

    apiRequest('/api/livreur/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
      .then(result => {
        setValidationResult({
          success: true,
          message: result.message || 'Code valide. Points credites au client.',
          points: result.points_earned,
          orderId: result.order?.id,
        })
        setCodeInput('')
        setTimeout(() => loadAssignments(), 1200)
      })
      .catch(err => {
        const msg = err.message || err.data?.message || 'Erreur lors de la validation du code.'
        setValidationResult({ success: false, message: msg })
      })
      .finally(() => {
        setValidatingCode(false)
      })
  }

  return (
    <LivreurShell
      title="Missions de livraison"
      subtitle="Verifiez l'adresse, puis saisissez le code GX-XXXXXX communique par le client une fois la remise effectuee."
    >
            {loading ? (
              <div className="card text-center py-12 border border-white/10">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="card text-center py-12 border border-white/10">
                <div className="text-5xl mb-4" aria-hidden>📦</div>
                <p className="text-white/65 text-lg">Aucune commande assignee pour le moment.</p>
                <p className="text-white/45 text-sm mt-2">Les nouvelles missions apparaitront ici des qu'un code livraison est genere et que vous etes designe.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="livreur-validation-card">
                  <div className="livreur-validation-header">
                    <span className="livreur-validation-icon">🔐</span>
                    <div>
                      <p className="livreur-validation-title">Valider la remise</p>
                      <p className="livreur-validation-desc">
                        Saisissez le code GX-XXXXXX communiqué par le client pour confirmer la livraison.
                      </p>
                    </div>
                  </div>

                  <div className="livreur-validation-form">
                    <label className="sr-only" htmlFor="livreur-code-gx">Code GX-</label>
                    <input
                      id="livreur-code-gx"
                      type="text"
                      autoComplete="off"
                      placeholder="GX-XXXXXX"
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value.toUpperCase())
                        setValidationResult(null)
                      }}
                      className="livreur-validation-input"
                      maxLength={9}
                    />
                    <GoldButton
                      type="button"
                      onClick={handleValidateCode}
                      disabled={validatingCode || !codeInput.trim()}
                    >
                      {validatingCode ? 'Validation...' : 'Valider'}
                    </GoldButton>
                  </div>

                  {validationResult && (
                    <div
                      className={`livreur-validation-result${validationResult.success ? ' success' : ' error'}`}
                      role="status"
                    >
                      <span className="livreur-validation-result-icon">
                        {validationResult.success ? '✓' : '✗'}
                      </span>
                      <div>
                        <p>{validationResult.message}</p>
                        {validationResult.points != null && (
                          <p className="livreur-validation-points">
                            Points crédités au client : <strong>{validationResult.points}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {orders.map(order => (
                  <article key={order.id} className="card border border-white/10 rounded-xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Commande #{order.id}
                          {order.uuid && (
                            <span className="ml-2 font-normal text-white/40 text-sm">· {order.uuid.substring(0, 8)}</span>
                          )}
                        </h2>
                        <p className="text-white/55 text-sm">{formatDate(order.created_at)}</p>
                        <p className="text-white/75 mt-2 text-sm flex gap-2">
                          <span aria-hidden>📍</span>
                          <span>{order.delivery_address}</span>
                        </p>
                        {order.user && (
                          <p className="text-white/60 text-sm mt-1">
                            Client : {order.user.name || order.user.email}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className={`badge ${order.status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                        <GoldButton href={`/livreur/order/${order.id}`} className="text-sm">Détail commande</GoldButton>
                        {order.status === 'assigned' || order.status === 'out_for_delivery' ? (
                          <a
                            href={`/livreur/track?order=${order.id}`}
                            className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition shadow-lg inline-block text-center"
                          >
                            🗺️ Suivre sur la carte
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white/80 text-sm font-semibold mb-3">Plats a livrer</p>
                        <ul className="space-y-2 list-none pl-0 m-0">
                          {order.items.map((item, idx) => {
                            const qty = Math.max(1, Number(item.quantity) || 1)
                            const unitPrice = Number(item.price) || 0
                            const lineTotal = unitPrice * qty
                            const cur = (item.menu?.currency || order.currency || 'CDF').toString().replace(/[^A-Za-z]/g, '') || 'CDF'
                            const curNorm = cur.toUpperCase() === 'CDF' || cur.toUpperCase() === 'FC' ? 'CDF' : cur
                            const fmt = (n) => curNorm === 'CDF' ? formatCurrencyCDF(n) : `${Number(n).toLocaleString('fr-FR')} ${curNorm}`
                            return (
                              <li key={idx} className="flex justify-between items-baseline text-sm py-1.5 border-b border-white/10 last:border-0">
                                <span className="text-white/90">
                                  {item.menu?.title || 'Plat'} × {qty}
                                </span>
                                <span className="text-white/80 font-medium tabular-nums">{fmt(lineTotal)}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-2">
                      <span className="text-white/80 text-sm">
                        Total :{' '}
                        <span className="font-bold text-cyan-400 tabular-nums">
                          {(() => {
                            const cur = String(order.currency || order.items?.[0]?.menu?.currency || 'USD').replace(/[^A-Za-z]/g, '') || 'USD'
                            const curNorm = cur.toUpperCase() === 'CDF' || cur.toUpperCase() === 'FC' ? 'CDF' : cur
                            const amount = Number(order.total_amount)
                            return curNorm === 'CDF' ? formatCurrencyCDF(amount) : `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${curNorm}`
                          })()}
                        </span>
                      </span>
                      {order.points_earned != null && (
                        <span className="text-white/60 text-sm">Points prevus : {order.points_earned}</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
    </LivreurShell>
  )
}
