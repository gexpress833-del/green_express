"use client"
import GoldButton from '@/components/GoldButton'
import { useEffect, useState, useRef } from 'react'
import { apiRequest, uploadImageFile } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'

export default function EditMenuPage(){
  const router = useRouter()
  const params = useParams()
  const [menuId, setMenuId] = useState(null)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    status: 'draft',
    image: null
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // Récupérer l'ID depuis les params
  useEffect(() => {
    if (params?.id) {
      console.log('Menu ID from params:', params.id);
      setMenuId(params.id);
    }
  }, [params])

  useEffect(() => {
    if (!menuId) {
      console.log('No menuId yet');
      return;
    }
    console.log('Loading menu:', menuId);
    apiRequest(`/api/menus/${menuId}`, { method: 'GET' })
      .then(menu => {
        console.log('Menu loaded:', menu);
        setForm({
          title: menu.title || '',
          description: menu.description || '',
          price: menu.price || '',
          currency: menu.currency || 'USD',
          status: menu.status || 'draft',
          image: menu.image || null
        })
      })
      .catch(err => {
        console.error('Error loading menu:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false))
  }, [menuId])

  const handleChange = (e) => {
    const {name, value} = e.target
    setForm(prev => ({...prev, [name]: value}))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!menuId) {
      setError('ID du menu introuvable');
      return;
    }
    setSubmitting(true)
    setError('')
    try {
      console.log('Updating menu:', menuId);
      await apiRequest(`/api/menus/${menuId}`, {
        method: 'PUT',
        body: JSON.stringify(form)
      })
      console.log('Menu updated successfully');
      router.push('/admin/menus')
    } catch (err) {
      console.error('Error updating menu:', err);
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-section page-section--admin-tight bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-600 mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Éditer le menu</h1>
          <p className="text-white/70 mt-2">Modifiez les informations du menu</p>
        </header>

        {loading ? (
          <div className="card text-center py-8"><p>Chargement…</p></div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            {error && <div className="p-3 bg-red-500/20 border border-red-400 rounded text-red-200">{error}</div>}

            <div>
              <label className="block text-sm font-semibold mb-2">Titre *</label>
              <input required type="text" name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none" placeholder="Ex: Burger Gourmet" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none" placeholder="Description du menu" rows={3}></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Prix *</label>
                <input required type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Devise</label>
                <select name="currency" value={form.currency} onChange={handleChange} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-gold outline-none">
                  <option value="USD">USD ($)</option>
                  <option value="CDF">CDF (FC)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Statut</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-gold outline-none">
                <option value="draft">Brouillon</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Image du menu</label>
              {form.image && (
                <div className="mb-4">
                  <img src={form.image} alt={form.title} className="w-full h-40 object-cover rounded-lg border border-gold/30 mb-2" />
                  <p className="text-sm text-white/60">Image actuelle</p>
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || file.size > 5 * 1024 * 1024) { setError(file ? 'Image max 5 Mo' : ''); return }
                    setUploading(true); setError('')
                    try {
                      const { url } = await uploadImageFile(file, 'menus')
                      setForm(prev => ({ ...prev, image: url }))
                    } catch (err) { setError(err.message || 'Erreur upload') }
                    finally { setUploading(false); e.target.value = '' }
                    }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded font-semibold text-sm disabled:opacity-50">
                  {uploading ? 'Upload…' : 'Uploader une image'}
                </button>
              </div>
              <input type="url" name="image" value={form.image || ''} onChange={handleChange} placeholder="Ou URL (https://...)" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none" />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 disabled:opacity-50">
                {submitting ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => router.push('/admin/menus')} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded font-semibold">
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
