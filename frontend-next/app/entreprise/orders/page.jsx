"use client"
import EntrepriseSidebar from '@/components/EntrepriseSidebar'
import GoldButton from '@/components/GoldButton'
import { apiRequest } from '@/lib/api'
import { useEffect, useState } from 'react'

export default function EntrepriseOrdersPage() {
  const [orders, setOrders] = useState({ data: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/entreprise/orders', { method: 'GET' })
      .then((r) => { setOrders(r?.data ? r : Array.isArray(r) ? { data: r } : { data: [] }) })
      .catch(() => setOrders({ data: [] }))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
  const formatMoney = (v) => (v != null ? Number(v).toLocaleString('fr-FR') : '—')

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #39ff14 0%, #00ffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Commandes entreprise
          </h1>
          <p className="text-white/70 text-lg">Commandes liées à votre entreprise.</p>
        </header>

        <div className="dashboard-grid">
          <EntrepriseSidebar />
          <main className="main-panel">
            <div className="card p-6">
              {loading ? <p className="text-white/60">Chargement...</p> : !orders.data?.length ? (
                <p className="text-white/70 mb-4">Aucune commande pour le moment.</p>
              ) : (
                <ul className="space-y-4">
                  {orders.data.map((order) => (
                    <li key={order.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-medium text-cyan-400">Commande #{order.id}</span>
                        <span className={`text-sm px-2 py-1 rounded ${order.status === 'delivered' ? 'bg-green-500/20 text-green-300' : order.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10'}`}>
                          {order.status === 'pending_payment' ? 'En attente paiement' : order.status === 'pending' ? 'En cours' : order.status === 'delivered' ? 'Livrée' : order.status}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mt-2">
                        {formatDate(order.created_at)} · {formatMoney(order.total_amount)} total
                        {order.delivery_code && <span className="ml-2">· Code {order.delivery_code}</span>}
                      </p>
                      {order.user && <p className="text-white/50 text-xs mt-1">{order.user.name}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <GoldButton href="/entreprise" className="mt-6">Retour au tableau de bord</GoldButton>
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}
