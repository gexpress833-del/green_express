"use client"
import Sidebar from "@/components/Sidebar"
import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { apiRequest, getApiErrorMessage } from "@/lib/api"
import { pushToast } from "@/components/Toaster"

const STATUS_LABELS = { pending: "En attente", delivered: "Livré", failed: "Échec", cancelled: "Annulé" }

export default function AdminDeliveriesPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    if (dateFilter) params.set("date", dateFilter)
    const url = "/api/admin/deliveries" + (params.toString() ? "?" + params.toString() : "")
    apiRequest(url, { method: "GET" })
      .then((r) => setList(r?.data?.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [statusFilter, dateFilter])

  useEffect(() => { load() }, [load])

  async function handleMarkDelivered(delivery) {
    if (!delivery?.id) return
    setActioning(delivery.id)
    try {
      await apiRequest(`/api/deliveries/${delivery.id}/mark-delivered`, { method: "POST" })
      pushToast({ type: "success", message: "Livraison marquée comme effectuée." })
      load()
    } catch (err) {
      pushToast({ type: "error", message: getApiErrorMessage(err) || "Erreur" })
    } finally {
      setActioning(null)
    }
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—")

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Gestion des livraisons</h1>
          <p className="text-white/70 mt-1">Suivi et validation des livraisons par entreprise et par date.</p>
        </header>
        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            <div className="card p-6">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm">
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="delivered">Livré</option>
                  <option value="failed">Échec</option>
                </select>
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
                <Link href="/admin/company-subscriptions" className="text-cyan-400 hover:text-cyan-300 text-sm">Abonnements B2B →</Link>
              </div>
              {loading ? (
                <p className="text-white/60 py-8 text-center">Chargement...</p>
              ) : list.length === 0 ? (
                <p className="text-white/60 py-8 text-center">Aucune livraison.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-2 text-white/80 font-semibold">Date</th>
                        <th className="p-2 text-white/80 font-semibold">Entreprise</th>
                        <th className="p-2 text-white/80 font-semibold">Plan / Repas</th>
                        <th className="p-2 text-white/80 font-semibold">Statut</th>
                        <th className="p-2 text-white/80 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((d) => (
                        <tr key={d.id} className="border-b border-white/5">
                          <td className="p-2 text-white/90">{formatDate(d.delivery_date)}</td>
                          <td className="p-2 text-white/80">{d.company?.name ?? "—"}</td>
                          <td className="p-2 text-white/70 text-xs">{d.meal_plan?.meal?.name ?? d.meal_plan_id ?? "—"}</td>
                          <td className="p-2">
                            <span className={"px-2 py-1 rounded text-xs " + (d.status === "delivered" ? "bg-green-500/20 text-green-300" : d.status === "failed" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300")}>{STATUS_LABELS[d.status] ?? d.status}</span>
                          </td>
                          <td className="p-2">
                            {d.status === "pending" && (
                              <button type="button" onClick={() => handleMarkDelivered(d)} disabled={!!actioning} className="px-3 py-1.5 rounded-lg text-sm bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">{actioning === d.id ? "…" : "Marquer livré"}</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-4 text-white/60 text-sm"><Link href="/admin" className="text-cyan-400 hover:text-cyan-300">← Tableau de bord</Link></p>
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}
