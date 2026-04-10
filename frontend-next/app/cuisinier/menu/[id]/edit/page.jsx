"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiRequest, uploadImageFile } from '@/lib/api'

export default function EditMenuPage({ params }) {
  const router = useRouter()
  const { id } = params || {}
  const [form, setForm] = useState({
    title: '', name: '', description: '', price: '', currency: 'USD', image: null, is_available: true, is_popular: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (!id) return
    (async () => {
      try {
        const data = await apiRequest(`/api/menus/${id}`, { method: 'GET' })
        setForm({
          title: data.title || '',
          name: data.name || '',
          description: data.description || '',
          price: data.price || '',
          currency: data.currency || 'USD',
          image: data.image || null,
          is_available: data.is_available ?? true,
          is_popular: data.is_popular ?? false,
        })
      } catch (err) {
        setError(err.message || 'Erreur chargement')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        name: form.name || form.title,
        description: form.description,
        price: parseFloat(form.price),
        currency: form.currency,
        is_available: form.is_available,
        is_popular: form.is_popular,
        ...(form.image && { image: form.image })
      }
      await apiRequest(`/api/menus/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
      router.push('/cuisinier/menu')
    } catch (err) {
      setError(err.message || 'Erreur sauvegarde')
    }
    setSaving(false)
  }

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-600 mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Modifier le plat</h1>
        </header>

        {loading ? <div>Chargement…</div> : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            {error && <div className="p-3 bg-red-500/20 border border-red-400 rounded text-red-200">{error}</div>}

            <div>
              <label className="block text-sm font-semibold mb-2">Titre *</label>
              <input required type="text" name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Prix *</label>
                <input required type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Devise</label>
                <select name="currency" value={form.currency} onChange={handleChange} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white">
                  <option value="USD">USD ($)</option>
                  <option value="CDF">CDF (FC)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Image du plat</label>
              {form.image && (
                <div className="mb-4">
                  <img src={form.image} alt={form.title || 'Aperçu'} className="w-full h-40 object-cover rounded-lg border border-gold/30 mb-2" />
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setUploading(true); setError('');
                  try {
                    const { url } = await uploadImageFile(file, 'menus')
                    setForm(prev => ({ ...prev, image: url }))
                  } catch (err) {
                    setError(err.message || 'Erreur upload')
                  } finally { setUploading(false); e.target.value = '' }
                }} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded font-semibold">{uploading ? 'Upload…' : 'Uploader une image'}</button>
                <span className="text-white/50 text-sm self-center">JPEG, PNG, WebP · max 5 Mo</span>
              </div>

              <input type="url" name="image" value={form.image || ''} onChange={handleChange} placeholder="Ou collez l'URL de l'image (https://...)" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} className="w-4 h-4" />
                <span className="text-sm font-semibold">Plat disponible</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_popular" checked={form.is_popular} onChange={handleChange} className="w-4 h-4" />
                <span className="text-sm font-semibold">🔥 Populaire</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={saving || uploading} className="flex-1 px-4 py-2 bg-gold text-black font-semibold rounded">{saving ? 'Sauvegarde…' : uploading ? 'Upload en cours…' : 'Sauvegarder'}</button>
              <button type="button" onClick={() => router.push('/cuisinier/menu')} className="flex-1 px-4 py-2 bg-white/10 rounded">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
