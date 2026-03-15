"use client"
import Sidebar from '@/components/Sidebar'
import GoldButton from '@/components/GoldButton'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/helpers'
import Link from 'next/link'

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
