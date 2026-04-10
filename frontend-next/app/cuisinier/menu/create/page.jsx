"use client"
import { useState, useRef } from 'react'
import GoldButton from '@/components/GoldButton'
import { apiRequest, uploadImageFile } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function CreateChefMenu(){
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    image: null,
    is_available: true,
    is_popular: false
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
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
      await apiRequest('/api/menus', { method: 'POST', body: JSON.stringify(payload) })
      setSuccess('Plat soumis pour approbation')
      setTimeout(() => router.push('/cuisinier/menu'), 1500)
    } catch(err) {
      setError(err.message || 'Erreur lors de la création')
    }
    setLoading(false)
  }

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-600 mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Créer un nouveau plat</h1>
          <p className="text-white/70 mt-2">Votre plat sera examiné et approuvé par un administrateur</p>
        </header>

        <form onSubmit={submit} className="card space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-400 rounded text-red-200">{error}</div>}
          {success && <div className="p-3 bg-green-500/20 border border-green-400 rounded text-green-200">{success}</div>}

          <div>
            <label className="block text-sm font-semibold mb-2">Titre du plat *</label>
            <input
              required
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex: Poulet grillé aux épices"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Décrivez votre plat en détail et ses ingrédients"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Prix *</label>
              <input
                required
                type="number"
                step="0.01"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Devise</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-gold outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="CDF">CDF (FC)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Image du plat</label>
            {form.image && (
              <div className="mb-4">
                <img
                  src={form.image.startsWith('blob:') ? form.image : form.image}
                  alt={form.title || 'Aperçu'}
                  className="w-full h-40 object-cover rounded-lg border border-gold/30 mb-2"
                />
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
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    setError('Image max 5 Mo')
                    return
                  }
                  setUploading(true)
                  setError('')
                  try {
                    const { url } = await uploadImageFile(file, 'menus')
                    setForm(prev => ({ ...prev, image: url }))
                  } catch (err) {
                    setError(err.message || 'Erreur upload')
                  } finally {
                    setUploading(false)
                    e.target.value = ''
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded font-semibold text-sm disabled:opacity-50"
              >
                {uploading ? 'Upload…' : 'Uploader une image'}
              </button>
              <span className="text-white/50 text-sm self-center">JPEG, PNG, WebP · max 5 Mo</span>
            </div>
            <input
              type="url"
              name="image"
              value={form.image || ''}
              onChange={handleChange}
              placeholder="Ou collez l'URL de l'image (https://...)"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Nom du plat (optionnel)</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Si différent du titre"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:border-gold outline-none"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_available"
                checked={form.is_available}
                onChange={(e) => setForm(prev => ({ ...prev, is_available: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold">Plat disponible</span>
              <span className="text-xs text-white/50">(les clients peuvent commander)</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_popular"
                checked={form.is_popular}
                onChange={(e) => setForm(prev => ({ ...prev, is_popular: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold">🔥 Populaire</span>
              <span className="text-xs text-white/50">(afficher badge "Populaire")</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 disabled:opacity-50"
            >
              {loading ? 'Création…' : uploading ? 'Upload en cours…' : 'Soumettre pour approbation'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/cuisinier/menu')}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
