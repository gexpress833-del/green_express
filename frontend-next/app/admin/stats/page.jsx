"use client"
import Sidebar from "@/components/Sidebar"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiRequest, API_BASE } from "@/lib/api"

function formatCurrency(amount, currency) {
  if (amount == null) return "—"
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "USD" }).format(Number(amount))
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    apiRequest("/api/admin/stats", { method: "GET" })
      .then((r) => { setStats(r); setError("") })
      .catch((e) => { setError(e?.message || "Erreur"); setStats(null) })
      .finally(() => setLoading(false))
  }, [])

  async function handleExportPdf() {
    setPdfLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats/export-pdf`, { credentials: "include", headers: { Accept: "application/pdf" } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || "Erreur export PDF")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "statistiques-admin.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e?.message || "Erreur PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Statistiques admin</h1>
          <p className="text-white/70 mt-1">Vue d'ensemble des indicateurs (commandes, revenus, entreprises, abonnements, livraisons).</p>
        </header>
        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card p-8 text-center"><p className="text-white/60">Chargement...</p></div>
            ) : error ? (
              <div className="card p-8 text-center">
                <p className="text-red-300 mb-2">{error}</p>
                <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 text-sm">Retour tableau de bord</Link>
              </div>
            ) : stats ? (
              <>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <button type="button" onClick={handleExportPdf} disabled={pdfLoading} className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50">
                    {pdfLoading ? "Génération…" : "Télécharger les statistiques en PDF"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="card p-4"><p className="text-white/60 text-sm">Commandes</p><p className="text-2xl font-bold text-white">{stats.orders ?? 0}</p></div>
                  <div className="card p-4"><p className="text-white/60 text-sm">Chiffre d'affaires</p><p className="text-2xl font-bold text-green-300">{formatCurrency(stats.revenue, stats.revenue_currency)}</p></div>
                  <div className="card p-4"><p className="text-white/60 text-sm">Abonnements (clients)</p><p className="text-2xl font-bold text-white">{stats.subscriptions ?? 0}</p></div>
                  <div className="card p-4"><p className="text-white/60 text-sm">Menus</p><p className="text-2xl font-bold text-white">{stats.menus ?? 0} <span className="text-sm font-normal text-white/60">({stats.pending_menus ?? 0} en attente)</span></p></div>
                  <div className="card p-4"><p className="text-white/60 text-sm">Entreprises (B2B)</p><p className="text-2xl font-bold text-white">{stats.companies ?? 0} <span className="text-sm font-normal text-amber-300">({stats.companies_pending ?? 0} en attente)</span></p></div>
                  <div className="card p-4"><p className="text-white/60 text-sm">Abonnements B2B</p><p className="text-2xl font-bold text-white">{stats.company_subscriptions ?? 0} <span className="text-sm font-normal text-amber-300">({stats.company_subscriptions_pending ?? 0} en attente)</span></p></div>
                  <div className="card p-4"><p className="text-white/60 text-sm">Livraisons en attente</p><p className="text-2xl font-bold text-white">{stats.deliveries_pending ?? 0}</p></div>
                </div>
                <p className="text-white/60 text-sm"><Link href="/admin" className="text-cyan-400 hover:text-cyan-300">← Tableau de bord</Link></p>
              </>
            ) : null}
          </main>
        </div>
      </div>
    </section>
  )
}
