"use client";
import { useState, useEffect, useRef } from 'react';
import { apiRequest, uploadImageFile } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

function toDatetimeLocal(str) {
  if (!str) return '';
  const s = str.replace(' ', 'T');
  return s.slice(0, 16);
}

export default function EditPromotionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState({
    menu_id: '',
    image: '',
    title: '',
    description: '',
    discount: '',
    points_required: '',
    quantity_limit: '',
    start_at: '',
    end_at: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingPromo, setLoadingPromo] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (id) {
      loadPromotion();
    }
  }, [id]);

  useEffect(() => {
    loadMenus();
  }, []);

  async function loadMenus() {
    try {
      const data = await apiRequest('/api/menus?per_page=100', { method: 'GET' });
      setMenus(data.data || data || []);
    } catch (err) {
      console.error('Erreur chargement menus:', err);
    }
  }

  async function loadPromotion() {
    if (!id) return;
    try {
      setLoadingPromo(true);
      const promo = await apiRequest(`/api/promotions/${id}`, { method: 'GET' });
      setForm({
        menu_id: promo.menu_id != null ? String(promo.menu_id) : '',
        image: promo.image || '',
        title: promo.title || '',
        description: promo.description || '',
        discount: promo.discount != null ? String(promo.discount) : '',
        points_required: promo.points_required != null ? String(promo.points_required) : '',
        quantity_limit: promo.quantity_limit != null ? String(promo.quantity_limit) : '',
        start_at: toDatetimeLocal(promo.start_at),
        end_at: toDatetimeLocal(promo.end_at),
      });
    } catch (err) {
      setError(err.message || 'Promotion introuvable');
    } finally {
      setLoadingPromo(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop volumineuse (max 5 Mo).');
      return;
    }
    setUploadingImage(true);
    setError('');
    try {
      const result = await uploadImageFile(file, 'green-express/promotions');
      const url = result?.url;
      if (url) setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      setError(err.message || 'Échec de l\'upload de l\'image.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const submitData = {
        menu_id: form.menu_id ? parseInt(form.menu_id) : null,
        image: form.image?.trim() || null,
        title: form.title?.trim() || null,
        description: form.description?.trim() || null,
        discount: form.discount ? parseFloat(form.discount) : null,
        points_required: form.points_required ? parseInt(form.points_required) : null,
        quantity_limit: form.quantity_limit ? parseInt(form.quantity_limit) : null,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
      };
      await apiRequest(`/api/promotions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      setSuccess(true);
      setTimeout(() => router.push('/admin/promotions'), 1500);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  }

  if (loadingPromo) {
    return (
      <div className="p-6 bg-[#0b1220] text-white min-h-screen flex items-center justify-center">
        <p className="text-white/60">Chargement de la promotion...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#d4af37]">Modifier la promotion</h1>
          <Link href="/admin/promotions" className="text-white/70 hover:text-[#d4af37] text-sm">← Retour</Link>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-700 text-green-200 p-4 rounded-lg mb-6">
            Promotion enregistrée.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Image de la promotion</label>
            <p className="text-white/60 text-xs mb-2">Changer l&apos;image : upload vers Cloudinary ou modifiez l&apos;URL.</p>
            <div className="flex flex-wrap gap-3 items-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
                id="promo-image-upload-edit"
              />
              <label
                htmlFor="promo-image-upload-edit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white cursor-pointer hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#d4af37] border-t-transparent" />
                    Upload en cours...
                  </>
                ) : (
                  'Choisir une nouvelle image (Cloudinary)'
                )}
              </label>
            </div>
            <input
              type="url"
              className="w-full mt-2 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] transition"
              placeholder="URL de l'image (ex. https://res.cloudinary.com/...)"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            {form.image && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-white/20 max-w-xs">
                <img src={form.image} alt="Aperçu" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Titre de la promotion</label>
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] transition"
              placeholder="Ex: Menu spécial Saint-Valentin"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] transition"
              rows={3}
              placeholder="Décrivez ce repas spécial..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Plat du menu (optionnel)</label>
            <select
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] transition"
              value={form.menu_id}
              onChange={(e) => setForm({ ...form, menu_id: e.target.value })}
            >
              <option value="">-- Aucun --</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Réduction (%)</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] transition"
                placeholder="Ex: 15.50"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Points requis</label>
              <input
                type="number"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] transition"
                placeholder="Ex: 50"
                value={form.points_required}
                onChange={(e) => setForm({ ...form, points_required: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Date début</label>
              <input
                type="datetime-local"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] transition"
                value={form.start_at}
                onChange={(e) => setForm({ ...form, start_at: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Date fin</label>
              <input
                type="datetime-local"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] transition"
                value={form.end_at}
                onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Quantité disponible</label>
            <input
              type="number"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#d4af37] transition"
              placeholder="Laisser vide pour illimité"
              value={form.quantity_limit}
              onChange={(e) => setForm({ ...form, quantity_limit: e.target.value })}
              min="0"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#f5e08a] text-[#0b1220] font-bold py-3 rounded-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}
