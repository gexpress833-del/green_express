"use client"
import Sidebar from '@/components/Sidebar'
import GoldButton from '@/components/GoldButton'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { broadcastAnnouncement } from '@/lib/notifications'
import { formatDate } from '@/lib/helpers'
import Link from 'next/link'
import { pushToast } from '@/components/Toaster'

function getStatusLabel(status) {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'pending_payment': return 'En attente de paiement'
    case 'pending': return 'En attente de livraison'
    case 'out_for_delivery': return 'En cours de livraison'
    case 'delivered': return 'Livrée'
    default: return status || '—'
  }
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'pending_payment': return 'badge-error'
    case 'pending': return 'badge-warning'
    case 'out_for_delivery': return 'badge-warning'
    case 'delivered': return 'badge-success'
    default: return 'badge-error'
  }
}

export default function AdminNotifications() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceMessage, setAnnounceMessage] = useState('')
  const [sendingAnnounce, setSendingAnnounce] = useState(false)

  const goToOrder = (orderId) => {
    const url = `/admin/orders?order=${orderId}`
    router.push(url)
    // Fallback au cas où le routeur ne navigue pas (ex. auth)
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname === '/admin/notifications') {
        window.location.href = url
      }
    }, 300)
  }

  useEffect(() => {
    apiRequest('/api/orders', { method: 'GET' })
      .then((r) => {
        const list = Array.isArray(r) ? r : []
        setOrders(list.slice(0, 15))
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleBroadcast(e) {
    e.preventDefault()
    const t = announceTitle.trim()
    const m = announceMessage.trim()
    if (!t || !m) {
      pushToast({ type: 'error', message: 'Renseignez le titre et le message.' })
      return
    }
    setSendingAnnounce(true)
    try {
      const r = await broadcastAnnouncement(t, m)
      pushToast({
        type: 'success',
        message: r?.message || `Annonce envoyée (${r?.users_notified ?? '?'} utilisateurs).`,
      })
      setAnnounceTitle('')
      setAnnounceMessage('')
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Envoi impossible.' })
    } finally {
      setSendingAnnounce(false)
    }
  }

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="container">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Notifications</h1>
          <p className="text-white/70 mt-2">Centre des notifications — commandes, paiements, alertes système.</p>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            <div className="card mb-6 border border-emerald-500/30 bg-emerald-500/5">
              <h2 className="text-xl font-semibold mb-1 text-emerald-200">Annonce à tous les utilisateurs</h2>
              <p className="text-white/60 text-sm mb-4">
                Message d’information Green Express : chaque compte recevra une notification (onglet « Annonces » dans l’app).
              </p>
              <form onSubmit={handleBroadcast} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Titre</label>
                  <input
                    type="text"
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                    placeholder="Ex. : Horaires du 15 août"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Message</label>
                  <textarea
                    value={announceMessage}
                    onChange={(e) => setAnnounceMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                    placeholder="Texte visible par tous les utilisateurs connectés…"
                    maxLength={5000}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-5 py-2.5 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {sendingAnnounce ? 'Envoi…' : 'Diffuser l’annonce'}
                </button>
              </form>
            </div>

            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-1" style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Commandes soumises
              </h2>
              <p className="text-white/60 text-sm mb-6">Dernières commandes reçues.</p>
              {loading ? (
                <p className="text-white/60 py-8 text-center">Chargement...</p>
              ) : orders.length === 0 ? (
                <p className="text-white/50 py-8 text-center">Aucune commande pour le moment.</p>
              ) : (
                <>
                  <div className="rounded-xl border border-white/10 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                      <thead>
                        <tr className="bg-white/5 text-white/80 text-sm font-semibold">
                          <th className="py-3 px-4">Commande</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Client</th>
                          <th className="py-3 px-4 text-right">Montant</th>
                          <th className="py-3 px-4">Statut</th>
                          <th className="py-3 px-4 text-right min-w-[100px] w-28">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-t border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                          >
                            <td className="py-3 px-4 font-medium text-white">#{order.id}</td>
                            <td className="py-3 px-4 text-white/60 text-sm whitespace-nowrap">{formatDate(order.created_at)}</td>
                            <td className="py-3 px-4 text-white/80 text-sm">{order.user?.name || order.user?.email || '—'}</td>
                            <td className="py-3 px-4 text-right text-white/90 tabular-nums text-sm">
                              {order.total_amount != null ? Number(order.total_amount).toLocaleString('fr-FR') : '—'} {order.items?.[0]?.menu?.currency || 'USD'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`badge ${getStatusBadge(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right min-w-[100px] whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => goToOrder(order.id)}
                                className="inline-flex items-center justify-center min-w-[100px] px-4 py-2 rounded-lg text-sm font-bold cursor-pointer border-0 transition hover:opacity-90"
                                style={{ backgroundColor: '#06b6d4', color: '#0b1220' }}
                              >
                                Voir la commande
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <GoldButton href="/admin/orders">Voir toutes les commandes</GoldButton>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}
