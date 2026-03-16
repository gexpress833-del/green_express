"use client"
import GoldButton from '@/components/GoldButton'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { getBlobImageUrl } from '@/lib/imageLoader'

function formatCurrency(amount, currency){
  if (typeof amount !== 'number') return '—'
  if (!['USD','CDF'].includes(currency)) return '—'
  const locale = currency === 'USD' ? 'en-US' : 'fr-CD'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

function StatusBadge({status}){
  const colors = {
    'draft': 'bg-gray-600', 'pending': 'bg-yellow-600', 'approved': 'bg-green-600', 'rejected': 'bg-red-600'
  }
  return <span className={`px-2 py-1 text-xs rounded font-semibold ${colors[status]||'bg-gray-500'}`}>{status||'—'}</span>
}

export default function AdminMenus(){
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [approving, setApproving] = useState(null)

  const loadMenus = ()=>{
    let mounted = true
    apiRequest('/api/menus',{ method: 'GET' })
      .then(res => { if (!mounted) return; setMenus(Array.isArray(res)? res : (res.data||[])) })
      .catch(()=>{ if (!mounted) return; setMenus([]) })
      .finally(()=> { if (mounted) setLoading(false) })
    return ()=> mounted = false
  }

  useEffect(loadMenus,[])

  const filteredMenus = statusFilter === 'all' ? menus : menus.filter(m => m.status === statusFilter)

  const handleDelete = async (menuId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce menu ?')) return
    setDeleting(menuId)
    try{
      await apiRequest(`/api/menus/${menuId}`,{ method: 'DELETE' })
      setMenus(menus.filter(m=>m.id!==menuId))
      setShowDetail(false)
    }catch(err){
      alert('Erreur lors de la suppression: ' + err.message)
    }finally{
      setDeleting(null)
    }
  }

  const handleApprove = async (menuId) => {
    setApproving(menuId)
    try {
      const updated = await apiRequest(`/api/menus/${menuId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' })
      })
      setMenus(menus.map(m => m.id === menuId ? updated : m))
      setSelectedMenu(updated)
    } catch(err) {
      alert('Erreur lors de l\'approbation: ' + err.message)
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (menuId) => {
    setApproving(menuId)
    try {
      const updated = await apiRequest(`/api/menus/${menuId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected' })
      })
      setMenus(menus.map(m => m.id === menuId ? updated : m))
      setSelectedMenu(updated)
    } catch(err) {
      alert('Erreur lors du rejet: ' + err.message)
    } finally {
      setApproving(null)
    }
  }

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-1000 mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Gestion des Menus</h1>
          <p className="text-white/70 mt-2">Validez, modifiez et publiez les plats proposés par les chefs.</p>
        </header>

        <div className="mb-6 flex gap-3">
          <GoldButton href="/admin/menus/create">+ Ajouter un menu</GoldButton>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-gold outline-none"
          >
            <option value="pending">En attente d'approbation</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
            <option value="draft">Brouillon</option>
            <option value="all">Tous</option>
          </select>
          {menus.length>0 && <p className="text-white/60 self-center text-sm">{filteredMenus.length}/{menus.length} menu(s)</p>}
        </div>

        {loading ? (
          <div className="card text-center py-12"><p className="text-white/60">Chargement des menus…</p></div>
        ) : filteredMenus.length===0 ? (
          <div className="card text-center py-12">
            <p className="text-white/60 mb-4">
              {menus.length === 0 
                ? <>Aucun menu trouvé. <Link href="/admin/menus/create" className="text-gold underline font-semibold">Créer le premier</Link></>
                : 'Aucun menu avec ce statut.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenus.map(m=> (
              <div key={m.id} className="card border border-white/10 hover:border-gold/30 transition-all">
                <div className="flex flex-col">
                  {/* Image : responsive + coins arrondis */}
                  <div className="flex-shrink-0 mb-3 w-full overflow-hidden rounded-2xl h-28 sm:h-36 md:h-40">
                    {m.image ? (
                      <img src={getBlobImageUrl(m.image, 200)} alt={m.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                        <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white truncate flex-1">{m.title}</h3>
                      <StatusBadge status={m.status}/>
                    </div>
                    <div className="text-gold font-bold mb-3">
                      {(m.price != null && ['USD','CDF'].includes(m.currency)) ? formatCurrency(Number(m.price), m.currency) : '—'}
                    </div>
                    {/* Actions : Voir détails ouvre le modal */}
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={()=>{setSelectedMenu(m);setShowDetail(true)}} 
                        className="px-3 py-1.5 text-xs font-semibold bg-gold/20 text-gold hover:bg-gold/30 rounded transition"
                      >
                        Voir détails
                      </button>
                      <button 
                        onClick={() => router.push(`/admin/menus/${m.id}/edit`)}
                        className="px-3 py-1.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded transition"
                      >
                        ✎ Éditer
                      </button>
                      {m.status === 'pending' && (
                        <>
                          <button 
                            onClick={()=>handleApprove(m.id)} 
                            disabled={approving===m.id} 
                            className="px-3 py-1.5 text-xs font-semibold bg-green-600/20 text-green-300 hover:bg-green-600/30 rounded transition disabled:opacity-50"
                          >
                            {approving===m.id ? '⌛' : '✓'} Approuver
                          </button>
                          <button 
                            onClick={()=>handleReject(m.id)} 
                            disabled={approving===m.id} 
                            className="px-3 py-1.5 text-xs font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/30 rounded transition disabled:opacity-50"
                          >
                            {approving===m.id ? '⌛' : '✕'} Rejeter
                          </button>
                        </>
                      )}
                      <button 
                        onClick={()=>handleDelete(m.id)} 
                        disabled={deleting===m.id} 
                        className="px-3 py-1.5 text-xs font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/30 rounded transition disabled:opacity-50"
                      >
                        {deleting===m.id ? '⌛' : '🗑'} Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetail && selectedMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-messagebox-overlay"
          onClick={() => setShowDetail(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-menu-title"
        >
          <div 
            className="bg-[#0b1220] border-2 border-gold/40 rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl modal-messagebox-box"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.2)' }}
          >
            {/* En-tête modal : titre + fermer */}
            <div className="flex items-start justify-between gap-2">
              <h2 id="modal-menu-title" className="text-xl font-bold text-gold">Détails du menu</h2>
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="p-1.5 rounded text-white/70 hover:bg-white/10 hover:text-white transition"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Image */}
            {selectedMenu.image && (
              <img src={getBlobImageUrl(selectedMenu.image, 400)} alt={selectedMenu.title} className="w-full h-44 object-cover rounded-lg shadow" />
            )}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">{selectedMenu.title}</h3>
                <p className="text-white/70">Par <span className="text-white font-semibold">{selectedMenu.creator?.name || 'Inconnu'}</span></p>
              </div>
              <StatusBadge status={selectedMenu.status}/>
            </div>

            {/* Description */}
            {selectedMenu.description && (
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-2 uppercase">Description</h3>
                <p className="text-white/80 leading-relaxed">{selectedMenu.description}</p>
              </div>
            )}

            {/* Grille d'informations */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10">
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase mb-1">Prix</p>
                <p className="text-2xl font-bold text-gold">
                  {(selectedMenu.price != null && ['USD','CDF'].includes(selectedMenu.currency)) 
                    ? formatCurrency(Number(selectedMenu.price), selectedMenu.currency) 
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase mb-1">Créé le</p>
                <p className="text-white font-semibold">{new Date(selectedMenu.created_at).toLocaleDateString('fr-CD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 flex-wrap">
              {selectedMenu.status === 'pending' && (
                <>
                  <button 
                    onClick={()=>{handleApprove(selectedMenu.id); if (approving !== selectedMenu.id) setShowDetail(false);}} 
                    disabled={approving===selectedMenu.id} 
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {approving===selectedMenu.id ? '⌛ Approbation...' : '✓ Approuver'}
                  </button>
                  <button 
                    onClick={()=>{handleReject(selectedMenu.id); if (approving !== selectedMenu.id) setShowDetail(false);}} 
                    disabled={approving===selectedMenu.id} 
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {approving===selectedMenu.id ? '⌛ Rejet...' : '✕ Rejeter'}
                  </button>
                </>
              )}
              <Link href={`/admin/menus/${selectedMenu.id}/edit`} className="flex-1">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition">
                  ✎ Éditer
                </button>
              </Link>
              <button 
                onClick={()=>{handleDelete(selectedMenu.id); if (deleting !== selectedMenu.id) setShowDetail(false);}} 
                disabled={deleting===selectedMenu.id} 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {deleting===selectedMenu.id ? '⌛ Suppression...' : '🗑 Supprimer'}
              </button>
              <button 
                onClick={()=>setShowDetail(false)} 
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
              >
                ✕ Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
