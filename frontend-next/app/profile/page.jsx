"use client"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest, getCsrfCookie } from '@/lib/api'
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
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setNameDraft(user?.name || '')
  }, [user?.name])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  useEffect(() => {
    if (!loading && !user) {
      const returnUrl = encodeURIComponent('/profile')
      router.replace(`/login?returnUrl=${returnUrl}`)
    }
  }, [loading, user, router])

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
        body: JSON.stringify({ name: trimmed }),
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
    <section className="min-h-screen py-12 px-4 bg-[#0b1220]">
      <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-[280px,1fr]">
        {/* Colonne gauche : carte identité */}
        <aside className="bg-[#020617]/80 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-[#0b1220] bg-gradient-to-br from-cyan-500 to-emerald-400 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
              {initial}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white">{user.name || user.email}</h1>
            <p className="mt-1 text-sm text-white/60 break-all">{user.email}</p>
            <span className="mt-3 inline-flex items-center rounded-full border border-[#d4af37]/40 bg-[#1e293b] px-3 py-1 text-xs font-semibold text-[#d4af37]">
              {roleLabel}
            </span>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 space-y-2 text-sm text-white/70">
            <div className="flex justify-between">
              <span>ID utilisateur</span>
              <span className="font-mono">{user.id ?? user.uuid ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Tableau de bord</span>
              <Link href={dashboardHref} className="text-cyan-300 hover:text-cyan-200">
                Ouvrir
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={dashboardHref}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-[#0b1220] bg-gradient-to-r from-[#d4af37] to-[#f5e08a] hover:scale-[1.02] transition"
            >
              Aller au tableau de bord
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold border border-red-400/70 text-red-200 hover:bg-red-500/10 transition"
            >
              Se déconnecter
            </button>
            <Link
              href="/"
              className="text-xs text-white/50 hover:text-white/80 text-center underline-offset-2 hover:underline"
            >
              Retour à l’accueil
            </Link>
          </div>
        </aside>

        {/* Colonne droite : “page compte” */}
        <main className="space-y-6">
          {/* Infos personnelles */}
          <section className="bg-[#020617]/80 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Informations personnelles</h2>
                <p className="text-sm text-white/60">
                  Ces informations sont liées à votre compte Green Express.
                </p>
              </div>
              {!isEditingName ? (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  Modifier
                </button>
              ) : (
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelName}
                    disabled={savingName}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-white/15 text-sm font-medium text-white/80 hover:bg-white/10 transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-[#0b1220] bg-gradient-to-r from-[#d4af37] to-[#f5e08a] hover:scale-[1.02] transition disabled:opacity-60"
                  >
                    {savingName ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </div>
            <div className="h-4" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-white/50">Nom complet</label>
                <input
                  type="text"
                  value={isEditingName ? nameDraft : (user.name || '')}
                  onChange={(e) => setNameDraft(e.target.value)}
                  disabled={!isEditingName || savingName}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 disabled:opacity-70"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-white/50">Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
                />
              </div>
            </div>
          </section>

          {/* Sécurité & connexion */}
          <section className="bg-[#020617]/80 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Sécurité & connexion</h2>
                <p className="text-sm text-white/60">
                  Gérez la façon dont vous accédez à votre compte.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordForm(v => !v)}
                className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                {showPasswordForm ? 'Fermer' : 'Modifier le mot de passe'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs uppercase tracking-wide text-white/50">Mot de passe actuel</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={savingPassword}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-white/50">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={savingPassword}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
                    placeholder="Min. 8 caractères"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-white/50">Confirmer</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={savingPassword}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
                    placeholder="Répéter"
                    autoComplete="new-password"
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-[#0b1220] bg-gradient-to-r from-[#d4af37] to-[#f5e08a] hover:scale-[1.02] transition disabled:opacity-60"
                  >
                    {savingPassword ? 'Mise à jour…' : 'Mettre à jour'}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Préférences (placeholder futur) */}
          <section className="bg-[#020617]/80 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-1">Préférences</h2>
            <p className="text-sm text-white/60">
              À l’avenir, vous pourrez personnaliser ici votre expérience (notifications, langue, thème…).
            </p>
          </section>
        </main>
      </div>
    </section>
  )
}
