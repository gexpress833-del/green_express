"use client"
import EntrepriseSidebar from '@/components/EntrepriseSidebar'
import GoldButton from '@/components/GoldButton'
import { useCompany } from '@/lib/useCompany'
import { apiRequest } from '@/lib/api'
import { useEffect, useState } from 'react'

export default function EntrepriseEmployeesPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany()
  const [employees, setEmployees] = useState({ data: [] })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!company?.id) return
    setLoading(true)
    apiRequest(`/api/companies/${company.id}/employees`, { method: 'GET' })
      .then((r) => { if (r?.success && r?.data) setEmployees(r.data) })
      .catch(() => setEmployees({ data: [] }))
      .finally(() => setLoading(false))
  }, [company?.id])

  // Liste officielle : uniquement après validation admin (company.status === 'active')
  const apiList = Array.isArray(employees?.data) ? employees.data : []
  const validatedList = company?.status === 'active' && Array.isArray(company?.pending_employees) ? company.pending_employees : []
  const displayList = apiList.length > 0 ? apiList : validatedList
  const isPending = company?.status !== 'active'

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
            Gérer les employés
          </h1>
          <p className="text-white/70 text-lg mb-4">
            Liste des agents pour livraisons et abonnement — <strong className="text-white/90">effective après validation</strong> Green Express.
          </p>
          <ul className="text-white/75 text-sm sm:text-base space-y-2 mb-2 max-w-2xl list-none pl-0">
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">•</span><span>Cette liste sert de référence pour les livraisons et le calcul d&apos;abonnement.</span></li>
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">•</span><span>Si votre compte est <em>en attente</em>, les effectifs complets s&apos;affichent après validation.</span></li>
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">•</span><span>La validation des fiches est effectuée par l&apos;administrateur Green Express.</span></li>
          </ul>
        </header>

        <div className="dashboard-grid">
          <EntrepriseSidebar />
          <main className="main-panel">
            {companyLoading ? (
              <div className="card p-6 text-center"><p className="text-white/60">Chargement...</p></div>
            ) : companyError || !company ? (
              <div className="card p-6">
                <p className="text-white/80 mb-4">{companyError || "Aucune entreprise associée. En attente de validation."}</p>
                <GoldButton href="/entreprise">Retour au tableau de bord</GoldButton>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">{company.name} — Liste des agents</h2>

                <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200/90 text-sm mb-6">
                  <strong>Important :</strong> effectif et abonnement ne sont pris en compte qu&apos;après validation de votre entreprise par l&apos;administrateur.
                </div>

                {isPending ? (
                  <p className="text-white/70 mb-4">Votre structure est en cours d&apos;examen. Le répertoire des agents (identités complètes) sera publié après validation administrative.</p>
                ) : loading ? (
                  <p className="text-white/60">Chargement des données…</p>
                ) : displayList.length === 0 ? (
                  <p className="text-white/70 mb-4">Aucun agent n&apos;est actuellement enregistré. La liste est établie par l&apos;administrateur lors de la validation de l&apos;entreprise.</p>
                ) : (
                  <>
                    <p className="text-white/70 text-sm mb-3">Répertoire des {displayList.length} agent(s) validé(s) — référence pour les livraisons et le calcul de l&apos;abonnement.</p>
                    <div className="md:hidden space-y-3 mb-4">
                      {displayList.map((emp, idx) => (
                        <div
                          key={emp.id || emp.matricule || idx}
                          className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
                        >
                          <p className="font-mono text-cyan-300 font-semibold mb-1">{emp.matricule || emp.code || '—'}</p>
                          <p className="text-white font-medium">{emp.full_name || '—'}</p>
                          <p className="text-white/70 mt-2">{emp.function ?? '—'}</p>
                          <p className="text-white/60 mt-1">{emp.phone ?? '—'}</p>
                          {apiList.length > 0 && (
                            <>
                              <p className="text-white/70 mt-2">{emp.email ?? '—'}</p>
                              <p className="mt-2">
                                <span className={'text-xs px-2 py-0.5 rounded ' + (emp.account_status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/70')}>
                                  {emp.account_status === 'active' ? 'Actif' : emp.account_status === 'pending' ? 'En attente' : 'Inactif'}
                                </span>
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="py-2 px-2 text-cyan-400 font-semibold">Matricule</th>
                            <th className="py-2 px-2 text-cyan-400 font-semibold">Nom complet</th>
                            <th className="py-2 px-2 text-cyan-400 font-semibold">Fonction</th>
                            <th className="py-2 px-2 text-cyan-400 font-semibold">Téléphone</th>
                            {apiList.length > 0 && <th className="py-2 px-2 text-cyan-400 font-semibold">Email</th>}
                            {apiList.length > 0 && <th className="py-2 px-2 text-cyan-400 font-semibold">Statut</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {displayList.map((emp, idx) => (
                            <tr key={emp.id || emp.matricule || idx} className="border-b border-white/10">
                              <td className="py-2 px-2 font-mono text-white/90">{emp.matricule || emp.code || '—'}</td>
                              <td className="py-2 px-2 font-medium text-white/90">{emp.full_name || '—'}</td>
                              <td className="py-2 px-2 text-white/80">{emp.function ?? '—'}</td>
                              <td className="py-2 px-2 text-white/80">{emp.phone ?? '—'}</td>
                              {apiList.length > 0 && <td className="py-2 px-2 text-white/70">{emp.email ?? '—'}</td>}
                              {apiList.length > 0 && (
                                <td className="py-2 px-2">
                                  <span className={"text-xs px-2 py-0.5 rounded " + (emp.account_status === "active" ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/70")}>
                                    {emp.account_status === "active" ? "Actif" : emp.account_status === "pending" ? "En attente" : "Inactif"}
                                  </span>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                <GoldButton href="/entreprise" className="mt-6">Retour au tableau de bord</GoldButton>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
