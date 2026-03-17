"use client"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { apiRequest, getCsrfCookie, uploadImageFile } from '@/lib/api'
import { pushToast } from '@/components/Toaster'

const ROLE_LABELS = {
  admin: 'Administrateur',
  client: 'Client',
  cuisinier: 'Cuisinier',
  livreur: 'Livreur',
  verificateur: 'Vérificateur',
  entreprise: 'Entreprise',
}

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setNameDraft(user?.name || '')
  }, [user?.name])

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?returnUrl=${encodeURIComponent('/profile')}`)
    }
  }, [loading, user, router])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  async function handleAvatarChange(e) {
    const file = e.target?.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      pushToast({ type: 'error', message: 'Choisissez une image (JPG, PNG, WebP).' })
      return
    }
    setUploadingAvatar(true)
    try {
      const { url } = await uploadImageFile(file, 'profiles')
      await getCsrfCookie()
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: user?.name || nameDraft, avatar_url: url }),
      })
      await refreshUser()
      pushToast({ type: 'success', message: 'Photo de profil mise à jour.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Échec de l\'upload.' })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveAvatar() {
    setRemovingAvatar(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: user?.name || nameDraft, avatar_url: '' }),
      })
      await refreshUser()
      pushToast({ type: 'success', message: 'Photo supprimée.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Échec.' })
    } finally {
      setRemovingAvatar(false)
    }
  }

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-[#0b1220]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-white/60">Chargement du profil...</p>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0b1220] text-white/80">
        <p>Accès réservé aux utilisateurs connectés.</p>
        <p className="text-sm text-white/50">Redirection…</p>
      </section>
    )
  }

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase()
  const avatarUrl = user.avatar_url || null
  const roleLabel = ROLE_LABELS[user.role] || user.role
  const dashboardHref = user.role ? `/${user.role}` : '/client'

  async function handleSaveName() {
    const trimmed = (nameDraft || '').trim()
    if (trimmed.length < 2) {
      pushToast({ type: 'error', message: 'Le nom doit contenir au moins 2 caractères.' })
      return
    }
    setSavingName(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: trimmed, ...(user.avatar_url && { avatar_url: user.avatar_url }) }),
      })
      await refreshUser()
      setIsEditingName(false)
      pushToast({ type: 'success', message: 'Profil mis à jour.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Échec de la mise à jour du profil.' })
    } finally {
      setSavingName(false)
    }
  }

  function handleCancelName() {
    setNameDraft(user?.name || '')
    setIsEditingName(false)
  }

  async function handleChangePassword(e) {
    e?.preventDefault?.()
    if (!currentPassword || !newPassword || !confirmPassword) {
      pushToast({ type: 'error', message: 'Veuillez remplir tous les champs.' })
      return
    }
    if (newPassword.length < 8) {
      pushToast({ type: 'error', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    if (newPassword !== confirmPassword) {
      pushToast({ type: 'error', message: 'La confirmation ne correspond pas.' })
      return
    }
    setSavingPassword(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/profile/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      pushToast({ type: 'success', message: 'Mot de passe mis à jour.' })
    } catch (err) {
      const msg =
        err?.data?.errors?.current_password?.[0] ||
        err?.data?.message ||
        err?.message ||
        'Échec de la mise à jour du mot de passe.'
      pushToast({ type: 'error', message: msg })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <section className="min-h-screen bg-[#0b1220]">
      {/* En-tête sobre avec dégradé discret */}
      <div className="border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white/80 transition">Accueil</Link>
            <span aria-hidden>/</span>
            <span className="text-white/80">Mon profil</span>
          </nav>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Mon compte</h1>
          <p className="mt-1 text-sm text-white/50">Identité et sécurité</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[320px,1fr]">
          {/* Carte identité — photo + rôle + actions */}
          <aside className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-sm overflow-hidden shadow-xl">
              <div className="p-8 flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 bg-[#1e293b] flex items-center justify-center text-4xl font-semibold text-white/90 shadow-inner">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleAvatarChange}
                      disabled={uploadingAvatar}
                    />
                    <span className="text-white text-sm font-medium px-3 py-1.5 rounded-lg bg-white/20">
                      {uploadingAvatar ? 'Upload…' : 'Changer'}
                    </span>
                  </label>
                </div>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={removingAvatar}
                    className="mt-2 text-xs text-white/50 hover:text-red-300 transition disabled:opacity-50"
                  >
                    {removingAvatar ? 'Suppression…' : 'Supprimer la photo'}
                  </button>
                )}
                <h2 className="mt-5 text-xl font-semibold text-white truncate max-w-full px-2">
                  {user.name || user.email}
                </h2>
                <p className="mt-0.5 text-sm text-white/50 break-all px-2">{user.email}</p>
                <span className="mt-3 inline-flex items-center rounded-full bg-white/5 border border-[#d4af37]/30 px-3 py-1 text-xs font-medium text-[#d4af37]">
                  {roleLabel}
                </span>
              </div>
              <div className="border-t border-white/10 p-4 space-y-3">
                <Link
                  href={dashboardHref}
                  className="flex items-center justify-center w-full py-2.5 rounded-xl font-medium text-[#0b1220] bg-gradient-to-r from-[#d4af37] to-[#e5c048] hover:from-[#e5c048] hover:to-[#d4af37] transition"
                >
                  Tableau de bord
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center w-full py-2.5 rounded-xl font-medium text-red-200/90 border border-red-400/30 hover:bg-red-500/10 transition"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-8">
            {/* Informations personnelles */}
            <section className="rounded-2xl border border-white/10 bg-[#0f172a]/60 backdrop-blur-sm p-6 shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Informations personnelles</h3>
                  <p className="text-sm text-white/50 mt-0.5">Nom et email liés à votre compte.</p>
                </div>
                {!isEditingName ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="shrink-0 px-4 py-2 rounded-lg border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition"
                  >
                    Modifier
                  </button>
                ) : (
                  <div className="shrink-0 flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelName}
                      disabled={savingName}
                      className="px-3 py-2 rounded-lg border border-white/15 text-sm font-medium text-white/80 hover:bg-white/10 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-[#0b1220] bg-[#d4af37] hover:bg-[#e5c048] transition disabled:opacity-60"
                    >
                      {savingName ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">Nom</label>
                  <input
                    type="text"
                    value={isEditingName ? nameDraft : (user.name || '')}
                    onChange={(e) => setNameDraft(e.target.value)}
                    disabled={!isEditingName || savingName}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-white/40 focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white/80 cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-white/40">
                Votre photo de profil est visible par l’équipe (admin, cuisinier) sur les commandes.
              </p>
            </section>

            {/* Sécurité */}
            <section className="rounded-2xl border border-white/10 bg-[#0f172a]/60 backdrop-blur-sm p-6 shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Mot de passe</h3>
                  <p className="text-sm text-white/50 mt-0.5">Modifiez votre mot de passe de connexion.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((v) => !v)}
                  className="shrink-0 px-4 py-2 rounded-lg border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  {showPasswordForm ? 'Fermer' : 'Changer le mot de passe'}
                </button>
              </div>
              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={savingPassword}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-white/40 focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">Nouveau</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={savingPassword}
                      placeholder="Min. 8 caractères"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-white/40 focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">Confirmer</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={savingPassword}
                      placeholder="Répéter"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-white/40 focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-4 py-2.5 rounded-xl font-semibold text-[#0b1220] bg-[#d4af37] hover:bg-[#e5c048] transition disabled:opacity-60"
                    >
                      {savingPassword ? 'Mise à jour…' : 'Mettre à jour'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </main>
        </div>
      </div>
    </section>
  )
}
