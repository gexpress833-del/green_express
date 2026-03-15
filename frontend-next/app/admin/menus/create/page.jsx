"use client"
import { useState, useRef } from 'react'
import GoldButton from '@/components/GoldButton'
import { apiRequest, uploadImageFile } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function AdminCreateMenu(){
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', description: '', price: '', currency: 'USD', status: 'draft', image: null
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const {name, value} = e.target
    setForm(prev => ({...prev, [name]: value}))
    setError('')
  }

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try{
      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        currency: form.currency,
        status: form.status,
        ...(form.image && { image: form.image })
      }
      await apiRequest('/api/menus', { method:'POST', body: JSON.stringify(payload) })
      setSuccess('Menu créé avec succès')
      setTimeout(() => router.push('/admin/menus'), 1500)
    }catch(err){ 
      setError(err.message || 'Erreur lors de la création')
    }
    setLoading(false)
  }

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-600 mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Créer un nouveau menu</h1>
          <p className="text-white/70 mt-2">Ajoutez un plat proposé par un chef</p>
        </header>

        <form onSubmit={submit} className="card space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-400 rounded text-red-200">{error}</div>}
          {success && <div className="p-3 bg-green-500/20 border border-green-400 rounded text-green-200">{success}</div>}

          <div>
            <label className="block text-sm font-semibold mb-2">Titre du menu *</label>
            <input required name="title" value={form.title} onChange={handleChange} placeholder="Ex: Burger Gourmet" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Décrivez le plat en détail" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none" rows={3}></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Prix *</label>
              <input required name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none" />
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
              <option value="pending">En attente de validation</option>
              <option value="approved">Approuvé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Image du menu</label>
            {form.image && (
              <div className="mb-4">
                <img src={form.image} alt={form.title || 'Preview'} className="w-full h-40 object-cover rounded-lg border border-gold/30 mb-2" />
                <p className="text-sm text-white/60">Aperçu</p>
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
            <input type="url" name="image" value={form.image || ''} onChange={handleChange} placeholder="Ou URL de l'image (https://...)" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 disabled:opacity-50">
              {loading ? 'Création…' : 'Créer le menu'}
            </button>
            <button type="button" onClick={() => router.push('/admin/menus')} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded font-semibold">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
