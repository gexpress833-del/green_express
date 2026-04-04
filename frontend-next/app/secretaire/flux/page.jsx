'use client'

import SecretaireSidebar from '@/components/SecretaireSidebar'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/helpers'
import { getOrderStatusLabel } from '@/lib/orderStatus'

export default function SecretaireFluxPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/livreur/assignments', { method: 'GET' })
      .then((r) => setOrders(Array.isArray(r) ? r : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="secretaire-dashboard page-section page-section--admin-tight min-h-screen bg-[#0b1220] text-white pb-12 sm:pb-16">
      <div className="mx-auto w-full max-w-6xl px-0 pb-0">
        <header className="border-b border-white/10 pb-6 pt-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/75">Secrétariat</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Flux livraisons</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Commandes payées avec code de livraison (tous livreurs). Pour attribuer un livreur, ouvrez la fiche depuis la page Commandes.
          </p>
        </header>

        <div className="dashboard-grid mt-8">
          <SecretaireSidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/65">Aucune commande en cours dans ce flux.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-sm text-white/85">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th scope="col" className="px-4 py-3 font-semibold">
                        ID
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Client
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Statut
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Livreur
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="px-4 py-3 tabular-nums font-medium text-cyan-200/90">#{o.id}</td>
                        <td className="px-4 py-3 text-white/55">{formatDate(o.created_at)}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate">{o.user?.name || o.user?.email || '—'}</td>
                        <td className="px-4 py-3">{getOrderStatusLabel(o.status)}</td>
                        <td className="px-4 py-3 text-white/60">
                          {o.delivery_driver?.name || o.delivery_driver?.email || (
                            <span className="text-amber-300/90">Non assigné</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/secretaire/orders?order=${o.id}`}
                            className="text-cyan-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
                          >
                            Fiche
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
