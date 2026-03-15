"use client"
import LivreurSidebar from '@/components/LivreurSidebar'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import GoldButton from '@/components/GoldButton'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'

export default function LivreurAssignments(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [validatingCode, setValidatingCode] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [validationResult, setValidationResult] = useState(null) // { success, message, points?, orderId }

  useEffect(() => {
    loadAssignments()
  }, [])

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

  function handleValidateCode(orderId){
    const code = (codeInput || '').trim().toUpperCase()
    if (!code || code.length !== 9) {
      setValidationResult({ success: false, message: 'Le code doit faire exactement 9 caractères (format GX-XXXXXX).', orderId })
      return
    }

    setValidatingCode(orderId)
    setValidationResult(null)

    apiRequest('/api/livreur/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
      .then(result => {
        setValidationResult({ 
          success: true, 
          message: result.message || 'Code validé. Points crédités au client.',
          points: result.points_earned,
          orderId
        })
        setCodeInput('')
        setTimeout(() => loadAssignments(), 1500)
      })
      .catch(err => {
        const msg = err.message || err.data?.message || `Erreur ${err.status || ''} lors de la validation du code.`
        setValidationResult({ success: false, message: msg, orderId })
      })
      .finally(() => {
        setValidatingCode(null)
      })
  }

  return (
    <section className="page-section min-h-screen">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #ff1493 0%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Mes missions de livraison
          </h1>
          <p className="text-white/70 text-lg">Validez les codes de livraison pour compléter les commandes</p>
        </header>

        <div className="dashboard-grid">
          <LivreurSidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-5xl mb-4">📦</div>
                <p className="text-white/60 text-lg">Aucune commande assignée pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <div key={order.id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1" style={{
                          background: 'linear-gradient(135deg, #ff1493 0%, #ff00ff 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          Commande #{order.uuid?.substring(0, 8)}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {formatDate(order.created_at)}
                        </p>
                        <p className="text-white/70 mt-2">
                          📍 {order.delivery_address}
                        </p>
                      </div>
                      <span className={`badge ${
                        order.status === 'pending' ? 'badge-warning' : 'badge-warning'
                      }`}>
                        {order.status === 'pending' ? 'En attente' : order.status}
                      </span>
                    </div>

                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white/80 text-sm font-semibold mb-3">Plats à livrer</p>
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

                    {/* Validation du code : le livreur saisit le code que le client lui donne (le code n'est pas affiché ici) */}
                    <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-lg">
                      <p className="text-white/70 text-sm mb-3 font-semibold">
                        Demandez le code de livraison au client, puis saisissez-le ci-dessous pour valider la remise.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <input
                          type="text"
                          placeholder="Code donné par le client (GX-XXXXXX)"
                          value={codeInput}
                          onChange={(e) => {
                            setCodeInput(e.target.value.toUpperCase())
                            setValidationResult(null)
                          }}
                          className="flex-1"
                          maxLength={9}
                          style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                        />
                        <GoldButton 
                          onClick={() => handleValidateCode(order.id)}
                          disabled={validatingCode === order.id || !codeInput.trim()}
                        >
                          {validatingCode === order.id ? 'Validation...' : 'Valider'}
                        </GoldButton>
                      </div>

                      {validationResult && validationResult.orderId === order.id && (
                        <div className={`mt-3 p-3 rounded-lg ${
                          validationResult.success 
                            ? 'bg-green-500/20 border border-green-500/50' 
                            : 'bg-red-500/20 border border-red-500/50'
                        }`}>
                          <p className={validationResult.success ? 'text-green-400' : 'text-red-400'}>
                            {validationResult.message}
                            {validationResult.points && (
                              <span className="block mt-1 text-sm">
                                Points crédités: {validationResult.points}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-2">
                      <span className="text-white/80 text-sm">
                        Total : <span className="font-bold text-cyan-400 tabular-nums">
                          {(() => {
                            const cur = String(order.currency || order.items?.[0]?.menu?.currency || 'USD').replace(/[^A-Za-z]/g, '') || 'USD'
                            const curNorm = cur.toUpperCase() === 'CDF' || cur.toUpperCase() === 'FC' ? 'CDF' : cur
                            const amount = Number(order.total_amount)
                            return curNorm === 'CDF' ? formatCurrencyCDF(amount) : `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${curNorm}`
                          })()}
                        </span>
                      </span>
                      {order.points_earned != null && (
                        <>
                          <span className="text-white/40 text-sm">•</span>
                          <span className="text-white/60 text-sm">
                            Points à créditer : {order.points_earned}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
