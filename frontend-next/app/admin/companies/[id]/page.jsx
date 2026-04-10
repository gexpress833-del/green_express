"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { apiRequest, API_BASE, getApiErrorMessage } from '@/lib/api'
import { pushToast } from '@/components/Toaster'

function getXsrfToken() {
  if (typeof document === 'undefined') return null
  const name = 'XSRF-TOKEN'
  const decodedCookie = decodeURIComponent(document.cookie)
  const cookieArray = decodedCookie.split(';')
  for (let cookie of cookieArray) {
    cookie = cookie.trim()
    if (cookie.startsWith(name + '=')) return cookie.substring(name.length + 1)
  }
  return null
}

export default function AdminCompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pendingListText, setPendingListText] = useState('')
  const [savingList, setSavingList] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiRequest(`/api/companies/${id}`, { method: 'GET' })
      .then((r) => setCompany(r?.data ?? r))
      .catch((err) => {
        setError(err?.data?.message || err?.message || 'Erreur de chargement')
        setCompany(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleDownloadAgentsPdf() {
    if (!id || pdfLoading) return
    setPdfLoading(true)
    try {
      const url = `${API_BASE}/api/companies/${id}/agents-pdf`
      const headers = { Accept: 'application/pdf' }
      const xsrf = getXsrfToken()
      if (xsrf) headers['X-XSRF-TOKEN'] = xsrf
      const res = await fetch(url, { method: 'GET', credentials: 'include', headers })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.message || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const disposition = res.headers.get('content-disposition')
      let filename = `liste_agents_${id}.pdf`
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/)
        if (match) filename = match[1]
      }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
      pushToast({ type: 'success', message: 'PDF téléchargé.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Erreur lors du téléchargement du PDF.' })
    } finally {
      setPdfLoading(false)
    }
  }

  const employees = company?.employees ?? []
  const pendingEmployees = company?.pending_employees ?? []
  const agentsList = pendingEmployees.length > 0 ? pendingEmployees : employees.map((e) => ({ matricule: e.matricule, full_name: e.full_name, function: e.function, phone: e.phone }))
  const needsAgentList = company?.status === 'pending' && pendingEmployees.length === 0 && employees.length === 0
  const statusLabel = company?.status === 'pending' ? 'En attente' : company?.status === 'active' ? 'Active' : company?.status === 'rejected' ? 'Rejetée' : company?.status ?? '—'

  async function handleSavePendingList() {
    const lines = pendingListText.split(/\n/).map((s) => s.trim()).filter(Boolean)
    if (lines.length === 0) {
      pushToast({ type: 'error', message: 'Saisissez au moins un nom d\'agent (un par ligne).' })
      return
    }
    setSavingList(true)
    try {
      await apiRequest(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending_employees: lines.map((full_name) => ({ full_name })) }),
      })
      pushToast({ type: 'success', message: 'Liste des agents enregistrée. Vous pouvez maintenant approuver l\'entreprise depuis la liste.' })
      setCompany((c) => c ? { ...c, pending_employees: lines.map((f) => ({ full_name: f })), employee_count: lines.length } : null)
      setPendingListText('')
    } catch (err) {
      pushToast({ type: 'error', message: err?.data?.message || err?.message || 'Erreur lors de l\'enregistrement.' })
    } finally {
      setSavingList(false)
    }
  }

  async function handleDeleteCompany() {
    if (!id || deleteSubmitting) return
    setDeleteSubmitting(true)
    try {
      await apiRequest(`/api/companies/${id}`, { method: 'DELETE' })
      pushToast({ type: 'success', message: 'Entreprise supprimée.' })
      router.push('/admin/companies')
    } catch (err) {
      pushToast({ type: 'error', message: getApiErrorMessage(err) || 'Erreur lors de la suppression.' })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <section className="page-section page-section--admin-tight min-h-screen bg-[#0b1220]">
        <header className="mb-8">
          <Link href="/admin/companies" className="text-cyan-400 hover:underline text-sm mb-2 inline-block">← Liste des entreprises</Link>
          <h1 className="text-3xl font-bold text-white mb-2">Détail entreprise</h1>
          <p className="text-white/70">Informations et liste des agents.</p>
        </header>
        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card p-8 text-center text-white/60">Chargement...</div>
            ) : error || !company ? (
              <div className="card p-6 text-red-300">{error || 'Entreprise introuvable.'}</div>
            ) : (
              <>
                <div className="card p-6 mb-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Informations</h2>
                  <dl className="grid gap-2 text-sm">
                    <div><dt className="text-white/60">Nom</dt><dd className="text-white font-medium">{company.name}</dd></div>
                    <div><dt className="text-white/60">Email</dt><dd className="text-white">{company.email ?? '—'}</dd></div>
                    <div><dt className="text-white/60">Téléphone</dt><dd className="text-white">{company.phone ?? '—'}</dd></div>
                    <div><dt className="text-white/60">Adresse</dt><dd className="text-white">{company.address ?? '—'}</dd></div>
                    <div><dt className="text-white/60">Type</dt><dd className="text-white">{company.institution_type ?? '—'}</dd></div>
                    <div><dt className="text-white/60">Statut</dt><dd><span className={`px-2 py-1 rounded text-sm ${company.status === 'active' ? 'bg-green-500/20 text-green-300' : company.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : company.status === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-white/10'}`}>{statusLabel}</span></dd></div>
                    <div><dt className="text-white/60">Contact</dt><dd className="text-white">{company.contact_user ? (company.contact_user.name || company.contact_user.email) : '—'}</dd></div>
                    <div><dt className="text-white/60">Nombre d&apos;agents</dt><dd className="text-white">{company.employee_count ?? agentsList.length}</dd></div>
                  </dl>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleDownloadAgentsPdf}
                      disabled={pdfLoading}
                      className="px-4 py-2 rounded-lg bg-[#d4af37] text-[#0b1220] font-semibold hover:bg-[#e5c048] disabled:opacity-50"
                    >
                      {pdfLoading ? 'Génération…' : 'Télécharger PDF pour livreurs (liste des agents)'}
                    </button>
                  </div>
                </div>
                {needsAgentList && (
                  <div className="card p-6 mb-6 border-amber-500/30 bg-amber-500/5">
                    <h2 className="text-lg font-semibold text-amber-200 mb-2">Liste des agents requise pour l&apos;approbation</h2>
                    <p className="text-white/80 text-sm mb-4">
                      Cette entreprise n&apos;a pas fourni la liste des agents à l&apos;inscription. Saisissez un nom par ligne ci-dessous, enregistrez, puis approuvez depuis la liste des entreprises.
                    </p>
                    <textarea
                      value={pendingListText}
                      onChange={(e) => setPendingListText(e.target.value)}
                      placeholder="Nom Agent 1&#10;Nom Agent 2&#10;..."
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm mb-3"
                    />
                    <button
                      type="button"
                      onClick={handleSavePendingList}
                      disabled={savingList}
                      className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-500 disabled:opacity-50"
                    >
                      {savingList ? 'Enregistrement…' : 'Enregistrer la liste des agents'}
                    </button>
                  </div>
                )}
                {company?.status === 'pending' && pendingEmployees.length > 0 && employees.length === 0 && (
                  <div className="card p-4 mb-6 border-cyan-500/20 bg-cyan-500/5">
                    <p className="text-cyan-200 text-sm">
                      Liste fournie à l&apos;inscription : {pendingEmployees.length} agent(s). Vous pouvez approuver cette entreprise depuis la <Link href="/admin/companies" className="underline font-medium">liste des entreprises</Link>.
                    </p>
                  </div>
                )}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Liste des agents — référence livraison ({agentsList.length})</h2>
                  <p className="text-white/60 text-sm mb-3">Codes uniques par entreprise (ex. C{company?.id}-E1). Aucun compte créé.</p>
                  {agentsList.length === 0 ? (
                    <p className="text-white/60">Aucun agent enregistré.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="p-2 text-white/80 font-semibold">Matricule</th>
                            <th className="p-2 text-white/80 font-semibold">Nom</th>
                            <th className="p-2 text-white/80 font-semibold">Fonction</th>
                            <th className="p-2 text-white/80 font-semibold">Téléphone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agentsList.map((emp, idx) => (
                            <tr key={emp.matricule || emp.id || idx} className="border-b border-white/5">
                              <td className="p-2 text-white/90 font-mono">{emp.matricule ?? '—'}</td>
                              <td className="p-2 text-white/90">{emp.full_name}</td>
                              <td className="p-2 text-white/70">{emp.function ?? '—'}</td>
                              <td className="p-2 text-white/70">{emp.phone ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="card p-6 mt-6 border-red-500/30 bg-red-500/5">
                  <h2 className="text-lg font-semibold text-red-200 mb-2">Zone danger</h2>
                  <p className="text-white/80 text-sm mb-4">
                    La suppression de l&apos;entreprise est irréversible (données, liste des agents, abonnements associés).
                  </p>
                  <button
                    type="button"
                    onClick={() => setDeleteModal(true)}
                    className="px-4 py-2 rounded-lg bg-red-600/80 text-white font-medium hover:bg-red-600 border border-red-500/50"
                  >
                    Supprimer l&apos;entreprise
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !deleteSubmitting && setDeleteModal(false)}>
          <div className="bg-[#0b1220] border border-red-500/30 rounded-xl max-w-md w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Supprimer l&apos;entreprise</h3>
            <p className="text-white/70 text-sm mb-4">
              Êtes-vous sûr de vouloir supprimer <strong className="text-white">{company?.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteModal(false)} className="px-4 py-2 rounded-lg bg-white/10 text-white">Annuler</button>
              <button type="button" onClick={handleDeleteCompany} disabled={deleteSubmitting} className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50">
                {deleteSubmitting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
