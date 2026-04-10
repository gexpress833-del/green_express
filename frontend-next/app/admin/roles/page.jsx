"use client"

import Sidebar from "@/components/Sidebar"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"

export default function AdminRolesPage() {
  const [roles, setRoles] = useState([])
  const [registry, setRegistry] = useState(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedPerms, setSelectedPerms] = useState(new Set())
  const [readonlyRole, setReadonlyRole] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadRoles = useCallback(() => {
    return apiRequest("/api/admin/roles", { method: "GET" })
      .then((r) => setRoles(r?.data ?? []))
      .catch(() => setRoles([]))
  }, [])

  const loadRegistry = useCallback(() => {
    return apiRequest("/api/admin/permissions/registry", { method: "GET" })
      .then((r) => setRegistry(r?.data ?? null))
      .catch(() => setRegistry(null))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError("")
    Promise.all([loadRoles(), loadRegistry()])
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false))
  }, [loadRoles, loadRegistry])

  const loadRolePermissions = useCallback(async (roleId) => {
    if (!roleId) return
    setError("")
    setSuccess("")
    try {
      const res = await apiRequest(`/api/admin/roles/${encodeURIComponent(roleId)}/permissions`, {
        method: "GET",
      })
      const data = res?.data
      setReadonlyRole(!!data?.readonly)
      setSelectedPerms(new Set(data?.permissions ?? []))
    } catch (e) {
      setError(e?.message || "Impossible de charger les permissions du rôle")
      setSelectedPerms(new Set())
    }
  }, [])

  useEffect(() => {
    if (selectedRole) loadRolePermissions(selectedRole)
  }, [selectedRole, loadRolePermissions])

  function togglePermission(name) {
    if (readonlyRole) return
    setSelectedPerms((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function savePermissions() {
    if (!selectedRole || readonlyRole) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await apiRequest(`/api/admin/roles/${encodeURIComponent(selectedRole)}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: Array.from(selectedPerms) }),
      })
      setSuccess("Permissions enregistrées.")
      await loadRoles()
    } catch (e) {
      setError(e?.message || "Enregistrement impossible")
    } finally {
      setSaving(false)
    }
  }

  const editableRoles = registry?.editable_roles ?? []
  const groups = registry?.groups ?? []

  return (
    <section className="page-section page-section--admin-tight min-h-screen bg-[#0b1220]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Rôles et permissions</h1>
        <p className="text-white/70 mt-1 max-w-3xl">
          Attribuez ou restreignez les actions et vues par type de rôle (Spatie). Le rôle{" "}
          <strong className="text-white/90">administrateur</strong> conserve toutes les permissions ; les autres rôles
          sont modifiables ci-dessous. Les utilisateurs héritent des permissions de leur rôle après synchronisation
          (connexion / rafraîchissement de session).
        </p>
      </header>
      <div className="dashboard-grid">
        <Sidebar />
        <main className="main-panel space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Effectifs par rôle</h2>
            {loading ? (
              <p className="text-white/60 py-8 text-center">Chargement...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
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
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Configurer les permissions par rôle</h2>
            <p className="text-white/60 text-sm mb-4">
              Nécessite la permission <code className="text-cyan-300/90">roles.manage_permissions</code>. Cochez uniquement
              ce que ce rôle peut faire ou voir dans l&apos;application.
            </p>

            {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
            {success && <p className="text-emerald-300 text-sm mb-3">{success}</p>}

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-6">
              <div className="flex-1">
                <label className="block text-white/70 text-sm mb-1">Rôle à modifier</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2"
                >
                  <option value="">— Choisir —</option>
                  {editableRoles.map((id) => {
                    const meta = roles.find((x) => x.id === id)
                    return (
                      <option key={id} value={id}>
                        {meta?.label || id}
                      </option>
                    )
                  })}
                  <option value="admin">Administrateur (lecture seule)</option>
                </select>
              </div>
              <button
                type="button"
                disabled={!selectedRole || readonlyRole || saving}
                onClick={savePermissions}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>

            {readonlyRole && selectedRole === "admin" && (
              <p className="text-amber-200/90 text-sm mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                Le rôle administrateur a toujours l&apos;ensemble des permissions système ; elles ne peuvent pas être
                retirées depuis cet écran.
              </p>
            )}

            {!registry && !loading && (
              <p className="text-white/50 text-sm">
                Registre des permissions indisponible. Vérifiez que vous avez exécuté{" "}
                <code className="text-cyan-300/90">php artisan db:seed --class=RolesAndPermissionsSeeder</code> et que
                votre compte admin possède <code className="text-cyan-300/90">roles.manage_permissions</code>.
              </p>
            )}

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {groups.map((g) => (
                <div key={g.id} className="border border-white/10 rounded-lg p-4 bg-white/[0.03]">
                  <h3 className="text-white font-medium mb-3">{g.label}</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {g.permissions.map((p) => (
                      <li key={p.name} className="flex gap-2 items-start">
                        <input
                          type="checkbox"
                          id={`perm-${p.name}`}
                          checked={selectedPerms.has(p.name)}
                          disabled={readonlyRole}
                          onChange={() => togglePermission(p.name)}
                          className="mt-1 rounded border-white/30"
                        />
                        <label htmlFor={`perm-${p.name}`} className="text-sm text-white/85 cursor-pointer">
                          <span className="font-mono text-cyan-200/80 text-xs block">{p.name}</span>
                          {p.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/60 text-sm">
            Pour attribuer un rôle à un utilisateur :{" "}
            <Link href="/admin/users" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Gérer les utilisateurs
            </Link>
            .{" "}
            <Link href="/admin" className="text-cyan-400 hover:text-cyan-300">
              ← Tableau de bord
            </Link>
          </p>
        </main>
      </div>
    </section>
  )
}
