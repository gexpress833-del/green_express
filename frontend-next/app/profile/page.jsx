'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { apiRequest, getCsrfCookie, uploadImageFile } from '@/lib/api'
import { pushToast } from '@/components/Toaster'
import ProfileSidebar from './components/ProfileSidebar'
import ProfileCard from './components/ProfileCard'
import ProfileForm from './components/ProfileForm'

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [nameDraft, setNameDraft] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
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
        body: JSON.stringify({ name: trimmed, ...(user?.avatar_url && { avatar_url: user.avatar_url }) }),
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

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container py-8">
        <div className="dashboard-grid gap-6 lg:gap-8">
          <ProfileSidebar
            onLogout={handleLogout}
            dashboardHref={user.role ? `/${user.role}` : '/client'}
          />

          <main className="main-panel space-y-6 lg:space-y-8">
            <header>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                Mon compte
              </h1>
              <p className="mt-1 text-sm text-white/50">Identité et sécurité</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[280px,1fr] lg:gap-8">
              <ProfileCard
                user={user}
                avatarUrl={avatarUrl}
                initial={initial}
                fileInputRef={fileInputRef}
                onAvatarChange={handleAvatarChange}
                onRemoveAvatar={handleRemoveAvatar}
                uploadingAvatar={uploadingAvatar}
                removingAvatar={removingAvatar}
              />

              <div className="space-y-6">
                <ProfileForm
                  nameDraft={nameDraft}
                  setNameDraft={setNameDraft}
                  user={user}
                  isEditingName={isEditingName}
                  setIsEditingName={setIsEditingName}
                  savingName={savingName}
                  onSaveName={handleSaveName}
                  onCancelName={handleCancelName}
                />

                <div className="rounded-xl border border-white/10 bg-[#0f172a]/80 p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-white">Mot de passe</h3>
                      <p className="text-sm text-white/50 mt-0.5">Modifiez votre mot de passe de connexion.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm((v) => !v)}
                      className="shrink-0 px-4 py-2.5 rounded-xl border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                    >
                      {showPasswordForm ? 'Fermer' : 'Changer le mot de passe'}
                    </button>
                  </div>
                  {showPasswordForm && (
                    <form onSubmit={handleChangePassword} className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                          Mot de passe actuel
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={savingPassword}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 outline-none transition disabled:opacity-70"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                          Nouveau
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={savingPassword}
                          placeholder="Min. 8 caractères"
                          autoComplete="new-password"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 outline-none transition disabled:opacity-70"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                          Confirmer
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={savingPassword}
                          placeholder="Répéter"
                          autoComplete="new-password"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 outline-none transition disabled:opacity-70"
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={savingPassword}
                          className="px-4 py-2.5 rounded-xl font-semibold text-[#0b1220] bg-[#d4af37] hover:bg-[#e5c048] transition-colors disabled:opacity-60"
                        >
                          {savingPassword ? 'Mise à jour…' : 'Mettre à jour'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}
