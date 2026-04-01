"use client"
import Sidebar from "@/components/Sidebar"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"

export default function AdminRolesPage() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/api/admin/roles', { method: 'GET' })
      .then((r) => setRoles(r?.data ?? []))
      .catch(() => { setError('Erreur chargement'); setRoles([]) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="page-section page-section--admin-tight min-h-screen bg-[#0b1220]">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Rôles et permissions</h1>
          <p className="text-white/70 mt-1">Vue des rôles et effectifs. Modifiez les rôles des utilisateurs depuis la section Utilisateurs.</p>
        </header>
        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            <div className="card p-6">
              {loading ? (
                <p className="text-white/60 py-8 text-center">Chargement...</p>
              ) : error ? (
                <p className="text-red-300 py-4">{error}</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {roles.map((r) => (
                      <div key={r.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">{r.label}</p>
                            <p className="text-white/60 text-sm mt-0.5">{r.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-cyan-300">{r.count ?? 0}</span>
                            <p className="text-white/50 text-xs">utilisateur(s)</p>
                          </div>
                        </div>
                        <Link
                          href={`/admin/users?role=${encodeURIComponent(r.id)}`}
                          className="inline-block mt-3 text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          Voir les utilisateurs →
                        </Link>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/70 text-sm">
                    Pour attribuer ou modifier un rôle : <Link href="/admin/users" className="text-cyan-400 hover:text-cyan-300 font-medium">Gérer les utilisateurs</Link>.
                  </p>
                </>
              )}
              <p className="mt-6 text-white/60 text-sm"><Link href="/admin" className="text-cyan-400 hover:text-cyan-300">← Tableau de bord</Link></p>
            </div>
          </main>
        </div>
    </section>
  )
}
