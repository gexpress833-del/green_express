'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { apiRequest, getCsrfCookie, uploadImageFile } from '@/lib/api'
import { pushToast } from '@/components/Toaster'
import Toaster from '@/components/Toaster'
import ConfirmModal from '@/components/ConfirmModal'
import Link from 'next/link'

const ROLE_LABELS = {
  admin: 'Administrateur',
  client: 'Client',
  cuisinier: 'Cuisinier',
  livreur: 'Livreur',
  entreprise: 'Entreprise',
  verificateur: 'Vérificateur',
}

/* Icônes SVG inline avec taille fixe — PAS de composants séparés */
const ICON = {
  back: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  pencil: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  camera: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  key: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>,
  bag: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  crown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M5 20l2-10 5 6 5-6 2 10"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  logout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

/* Styles réutilisables définis en objet (pas de Tailwind arbitraire) */
const S = {
  page: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#0b1220', overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  hero: { background: 'linear-gradient(180deg, #0d2340 0%, #0b1220 100%)', padding: '86px 20px 40px' },
  heroContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0, margin: '0 auto' },
  avatarWrap: { position: 'relative', display: 'inline-block', marginBottom: 14 },
  avatarCircle: { width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: '#1a2e4a', border: '2px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 26, fontWeight: 700, color: '#67e8f9' },
  cameraBtn: { position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: '#06b6d4', border: '2px solid #0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 1 },
  fileInput: { display: 'none', position: 'absolute', width: 0, height: 0, opacity: 0 },
  name: { fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 4, marginTop: 0 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 10 },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' },
  cardsWrap: { padding: '16px 16px 120px', maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 },
  card: { borderRadius: 16, background: 'rgba(15,28,46,0.95)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  iconBox: (bg, color) => ({ width: 32, height: 32, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
  infoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  infoRowLast: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px' },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 },
  value: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  linkCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', textDecoration: 'none', borderRadius: 16, background: 'rgba(15,28,46,0.95)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' },
  navBar: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'rgba(11,18,32,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px 16px', backdropFilter: 'blur(12px)' },
  navGrid: { maxWidth: 520, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  btnBlue: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, background: '#2563eb', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', textDecoration: 'none' },
  btnGreen: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(52,211,153,0.35)', color: '#6ee7b7', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  btnCyan: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  btnRed: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [nameDraft, setNameDraft] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)

  /* Accordéons des cartes */
  const [showOrders, setShowOrders] = useState(false)
  const [showSubscription, setShowSubscription] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  /* Lightbox photo */
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  useEffect(() => {
    if (!showPhotoModal) return
    const onKey = (e) => { if (e.key === 'Escape') setShowPhotoModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showPhotoModal])

  /* Responsive : détection de la largeur d'écran */
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 375))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const xs = vw < 380    /* iPhone SE / très petits écrans     */
  const md = vw >= 640   /* Tablette portrait                   */
  const lg = vw >= 1024  /* Desktop / tablette paysage          */

  useEffect(() => { setNameDraft(user?.name || '') }, [user?.name])
  useEffect(() => {
    if (!user) return
    setEmailDraft(user.email || '')
    setPhoneDraft(user.phone ? String(user.phone) : '')
  }, [user])
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?returnUrl=${encodeURIComponent('/profile')}`)
  }, [loading, user, router])

  /* Masquer le footer global uniquement sur cette page */
  useEffect(() => {
    const footer = document.querySelector('footer')
    if (footer) footer.style.display = 'none'
    return () => { if (footer) footer.style.display = '' }
  }, [])

  async function handleLogout() { await logout(); router.push('/') }

  async function handleAvatarChange(e) {
    const file = e.target?.files?.[0]
    if (!file || !file.type.startsWith('image/')) { pushToast({ type: 'error', message: 'Choisissez une image (JPG, PNG, WebP).' }); return }
    setUploadingAvatar(true)
    try {
      const { url } = await uploadImageFile(file, 'profiles')
      await getCsrfCookie()
      await apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify({ name: user?.name || nameDraft, avatar_url: url }) })
      await refreshUser()
      pushToast({ type: 'success', message: 'Photo mise à jour.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || "Échec de l'upload." })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function doRemoveAvatar() {
    setRemovingAvatar(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify({ name: user?.name || nameDraft, avatar_url: '' }) })
      await refreshUser()
      pushToast({ type: 'success', message: 'Photo supprimée.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Échec.' })
    } finally { setRemovingAvatar(false) }
  }

  function handleRemoveAvatar() {
    setConfirmModal({ title: 'Supprimer la photo', message: 'Cette action supprimera définitivement votre photo de profil.', variant: 'danger', confirmLabel: 'Supprimer', onConfirm: () => { setConfirmModal(null); doRemoveAvatar() } })
  }

  async function handleSaveName() {
    const trimmed = (nameDraft || '').trim()
    if (trimmed.length < 2) { pushToast({ type: 'error', message: 'Au moins 2 caractères.' }); return }
    setSavingName(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify({ name: trimmed, ...(user?.avatar_url && { avatar_url: user.avatar_url }) }) })
      await refreshUser()
      setIsEditingName(false)
      pushToast({ type: 'success', message: 'Nom mis à jour.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Échec.' })
    } finally { setSavingName(false) }
  }

  async function handleSavePersonalInfo() {
    const trimmedName = (nameDraft || '').trim()
    if (trimmedName.length < 2) { pushToast({ type: 'error', message: 'Au moins 2 caractères pour le nom.' }); return }
    const email = (emailDraft || '').trim()
    if (!email) { pushToast({ type: 'error', message: 'L’e-mail est requis.' }); return }
    setSavingPersonal(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: trimmedName,
          email,
          phone: (phoneDraft || '').trim() || null,
          ...(user?.avatar_url && { avatar_url: user.avatar_url }),
        }),
      })
      await refreshUser()
      setEditingPersonalInfo(false)
      setIsEditingName(false)
      pushToast({ type: 'success', message: 'Profil mis à jour.' })
    } catch (err) {
      const msg =
        err?.data?.errors?.phone?.[0] ??
        err?.data?.errors?.email?.[0] ??
        err?.data?.message ??
        err?.message ??
        'Échec de la mise à jour.'
      pushToast({ type: 'error', message: msg })
    } finally {
      setSavingPersonal(false)
    }
  }

  function cancelEditPersonalInfo() {
    setNameDraft(user?.name || '')
    setEmailDraft(user?.email || '')
    setPhoneDraft(user?.phone ? String(user.phone) : '')
    setEditingPersonalInfo(false)
  }

  async function doChangePassword() {
    setSavingPassword(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/profile/password', { method: 'PUT', body: JSON.stringify({ current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword }) })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordForm(false)
      pushToast({ type: 'success', message: 'Mot de passe mis à jour.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.data?.errors?.current_password?.[0] || err?.data?.message || err?.message || 'Échec.' })
    } finally { setSavingPassword(false) }
  }

  function handleChangePassword(e) {
    e?.preventDefault?.()
    if (!currentPassword || !newPassword || !confirmPassword) { pushToast({ type: 'error', message: 'Tous les champs sont requis.' }); return }
    if (newPassword.length < 8) { pushToast({ type: 'error', message: 'Min. 8 caractères.' }); return }
    if (newPassword !== confirmPassword) { pushToast({ type: 'error', message: 'Les mots de passe ne correspondent pas.' }); return }
    setConfirmModal({ title: 'Changer le mot de passe', message: 'Vous allez modifier votre mot de passe. Cette action est irréversible.', variant: 'warning', confirmLabel: 'Mettre à jour', onConfirm: () => { setConfirmModal(null); doChangePassword() } })
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220' }}><div style={{ width: 32, height: 32, border: '2px solid rgba(34,211,238,0.3)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Redirection…</div>

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase()
  const avatarUrl = user.avatar_url || null
  const roleLabel = ROLE_LABELS[user.role] || user.role || 'Utilisateur'
  const phoneDisplay = formatPhoneForProfile(user.phone)
  const dashboardHref = user.role ? `/${user.role}` : '/client'
  const subscriptionHref = user.role === 'entreprise' ? '/entreprise/subscriptions' : user.role === 'client' ? '/client/subscriptions' : null
  const ordersHref = user.role === 'client' ? '/client/orders' : user.role === 'livreur' ? '/livreur/assignments' : user.role === 'cuisinier' ? '/cuisinier/orders' : user.role === 'admin' ? '/admin/orders' : null

  return (
    <div style={S.page}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div style={{ ...S.hero, padding: xs ? '72px 16px 28px' : lg ? '100px 24px 52px' : '86px 20px 40px' }}>
        <Link href={dashboardHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
          {ICON.back} Retour
        </Link>

        <div style={{ ...S.heroContent, maxWidth: lg ? 780 : md ? 640 : 520 }}>
          {/* Avatar */}
          <div style={S.avatarWrap}>
            <div
              style={{ ...S.avatarCircle, cursor: avatarUrl ? 'zoom-in' : 'default' }}
              onClick={() => avatarUrl && setShowPhotoModal(true)}
              role={avatarUrl ? 'button' : undefined}
              aria-label={avatarUrl ? 'Voir la photo en grand' : undefined}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="Photo de profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={S.avatarInitial}>{initial}</span>
              }
            </div>
            {/* Bouton caméra avec position absolute via style inline */}
            <div
              onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
              style={S.cameraBtn}
              role="button"
              aria-label="Changer la photo"
            >
              {uploadingAvatar
                ? <div style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : ICON.camera
              }
            </div>
            {/* Input complètement retiré du flux */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={S.fileInput}
              tabIndex={-1}
              aria-hidden="true"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
          </div>

          {/* Nom */}
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <input
                type="text" value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setNameDraft(user?.name || ''); setIsEditingName(false) } }}
                autoFocus
                style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: 'white', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(34,211,238,0.4)', borderRadius: 10, padding: '5px 10px', outline: 'none', width: 160, margin: 0 }}
              />
              <button onClick={handleSaveName} disabled={savingName} style={{ padding: '5px 12px', borderRadius: 8, background: '#06b6d4', color: 'white', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                {savingName ? '…' : 'OK'}
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', marginBottom: 4 }}
            >
              <span style={S.name}>{user.name || user.email}</span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>{ICON.pencil}</span>
            </div>
          )}

          <p style={S.email}>{user.email}</p>
          <span style={S.badge}>{roleLabel}</span>

          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              disabled={removingAvatar}
              style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {removingAvatar ? 'Suppression…' : 'Supprimer la photo'}
            </button>
          )}
        </div>
      </div>

      {/* ── CARTES ───────────────────────────────────────── */}
      <div style={{
        ...S.cardsWrap,
        padding: xs ? '12px 10px 110px' : '16px 16px 120px',
        maxWidth: lg ? 780 : md ? 640 : 520,
      }}>

        {/* Ligne 1 : Infos + Sécurité côte à côte sur desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: lg ? '1fr 1fr' : '1fr',
          columnGap: lg ? 10 : 0,
          rowGap: 10,
        }}>
          {/* Informations personnelles */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.iconBox('rgba(59,130,246,0.15)', '#60a5fa')}>{ICON.user}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Informations personnelles</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {editingPersonalInfo ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSavePersonalInfo() }}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ padding: '12px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Nom</label>
                    <input type="text" value={nameDraft} onChange={e => setNameDraft(e.target.value)} disabled={savingPersonal} autoComplete="name"
                      style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, boxSizing: 'border-box', margin: 0 }} />
                  </div>
                  <div style={{ padding: '12px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>E-mail</label>
                    <input type="email" value={emailDraft} onChange={e => setEmailDraft(e.target.value)} disabled={savingPersonal} autoComplete="email"
                      style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, boxSizing: 'border-box', margin: 0 }} />
                  </div>
                  <div style={{ padding: '12px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Téléphone</label>
                    <input type="tel" value={phoneDraft} onChange={e => setPhoneDraft(e.target.value)} disabled={savingPersonal} autoComplete="tel" placeholder="08… ou +243…"
                      style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, boxSizing: 'border-box', margin: 0 }} />
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '6px 0 0', lineHeight: 1.4 }}>Optionnel. Laissez vide pour retirer le numéro. Format RDC (9 chiffres après 243).</p>
                  </div>
                  <Row label="Rôle" value={roleLabel} last />
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 18px 16px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={cancelEditPersonalInfo} disabled={savingPersonal} style={{ padding: '8px 14px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)', fontSize: 13, cursor: 'pointer' }}>
                      Annuler
                    </button>
                    <button type="submit" disabled={savingPersonal} style={{ padding: '8px 18px', borderRadius: 10, background: '#2563eb', color: 'white', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', opacity: savingPersonal ? 0.6 : 1 }}>
                      {savingPersonal ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <Row label="Nom" value={user.name || '—'} />
                  <Row label="Email" value={user.email || '—'} />
                  <Row label="Téléphone" value={phoneDisplay} />
                  <Row label="Rôle" value={roleLabel} last />
                  <div style={{ padding: '12px 18px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPersonalInfo(true)
                        setNameDraft(user.name || '')
                        setEmailDraft(user.email || '')
                        setPhoneDraft(user.phone ? String(user.phone) : '')
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.35)', color: '#93c5fd', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 10, cursor: 'pointer' }}
                    >
                      {ICON.pencil} Modifier les informations
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sécurité */}
          <div style={S.card}>
          <div
            onClick={() => setShowPasswordForm(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
          >
            <div style={S.iconBox('rgba(139,92,246,0.15)', '#a78bfa')}>{ICON.key}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Sécurité</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Modifier le mot de passe</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.25)', transform: showPasswordForm ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>{ICON.chevron}</span>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} style={{ padding: '4px 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Mot de passe actuel</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" disabled={savingPassword}
                  style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, boxSizing: 'border-box', margin: 0 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Nouveau</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 car." autoComplete="new-password" disabled={savingPassword}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 12, boxSizing: 'border-box', margin: 0 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Confirmer</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Répéter" autoComplete="new-password" disabled={savingPassword}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 12, boxSizing: 'border-box', margin: 0 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={savingPassword} style={{ padding: '8px 18px', borderRadius: 10, background: '#7c3aed', color: 'white', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', opacity: savingPassword ? 0.5 : 1 }}>
                  {savingPassword ? 'Mise à jour…' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          )}
          </div>
        </div>{/* fin grille ligne 1 */}

        {/* Grille de liens — 2 colonnes sur desktop, accordéons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: lg ? '1fr 1fr' : '1fr',
          columnGap: lg ? 10 : 0,
          rowGap: 10,
        }}>

          {/* ── Mes commandes ── */}
          {ordersHref && (
            <div style={S.card}>
              <div
                onClick={() => setShowOrders(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
              >
                <div style={S.iconBox('rgba(16,185,129,0.15)', '#34d399')}>{ICON.bag}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Mes commandes</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Historique et suivi</div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.25)', transform: showOrders ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>{ICON.chevron}</span>
              </div>
              {showOrders && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '14px 0 14px', lineHeight: 1.5 }}>
                    Consultez l'historique complet de vos commandes, suivez leur statut en temps réel et accédez aux détails de chaque livraison.
                  </p>
                  <Link href={ordersHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    {ICON.bag} Voir mes commandes
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Abonnement ── */}
          {subscriptionHref && (
            <div style={S.card}>
              <div
                onClick={() => setShowSubscription(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
              >
                <div style={S.iconBox('rgba(245,158,11,0.15)', '#fbbf24')}>{ICON.crown}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Abonnement</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Gérer votre plan actuel</div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.25)', transform: showSubscription ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>{ICON.chevron}</span>
              </div>
              {showSubscription && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '14px 0 14px', lineHeight: 1.5 }}>
                    Consultez les offres, suivez l’état de votre demande et renouvelez à l’échéance. La validation des abonnements est effectuée par l’équipe.
                  </p>
                  <Link href={subscriptionHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    {ICON.crown} Gérer l'abonnement
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Notifications ── */}
          <div style={S.card}>
            <div
              onClick={() => setShowNotifications(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
            >
              <div style={S.iconBox('rgba(6,182,212,0.15)', '#22d3ee')}>{ICON.bell}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Notifications</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Voir mes alertes et messages</div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.25)', transform: showNotifications ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>{ICON.chevron}</span>
            </div>
            {showNotifications && (
              <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '14px 0 14px', lineHeight: 1.5 }}>
                  Accédez à toutes vos alertes, messages système et notifications importantes liés à vos commandes et à votre compte.
                </p>
                <Link href="/notifications" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  {ICON.bell} Voir les notifications
                </Link>
              </div>
            )}
          </div>

          {/* ── Compte sécurisé ── */}
          <div style={S.linkCard}>
            <div style={S.iconBox('rgba(34,197,94,0.15)', '#4ade80')}>{ICON.shield}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Compte sécurisé</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Connexion par email + mot de passe</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', flexShrink: 0 }}>
              {ICON.check}
            </div>
          </div>

        </div>
      </div>

      {/* ── BARRE ACTIONS FIXE ───────────────────────────── */}
      <div style={{
        ...S.navBar,
        padding: xs ? '8px 10px 10px' : lg ? '14px 24px 18px' : '12px 16px 16px',
      }}>
        <div style={{
          ...S.navGrid,
          gap: xs ? 6 : lg ? 12 : 10,
          gridTemplateColumns: md ? '1fr 1fr 1fr 1fr' : '1fr 1fr',
          maxWidth: lg ? 780 : md ? 640 : 520,
        }}>
          <div onClick={() => setIsEditingName(true)} style={{
            ...S.btnBlue,
            padding: xs ? '9px 8px' : lg ? '12px 20px' : '11px 16px',
            fontSize: xs ? 11 : lg ? 14 : 13,
            gap: xs ? 4 : 8,
          }} role="button">
            {ICON.pencil} {xs ? 'Modifier' : 'Modifier le profil'}
          </div>

          {ordersHref
            ? <Link href={ordersHref} style={{
                ...S.btnGreen,
                padding: xs ? '9px 8px' : lg ? '12px 20px' : '11px 16px',
                fontSize: xs ? 11 : lg ? 14 : 13,
                gap: xs ? 4 : 8,
              }}>{ICON.bag} Commandes</Link>
            : <Link href={dashboardHref} style={{
                ...S.btnGreen,
                borderColor: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                padding: xs ? '9px 8px' : lg ? '12px 20px' : '11px 16px',
                fontSize: xs ? 11 : lg ? 14 : 13,
                gap: xs ? 4 : 8,
              }}>{xs ? 'Accueil' : 'Tableau de bord'}</Link>
          }

          <Link href="/notifications" style={{
            ...S.btnCyan,
            padding: xs ? '9px 8px' : lg ? '12px 20px' : '11px 16px',
            fontSize: xs ? 11 : lg ? 14 : 13,
            gap: xs ? 4 : 8,
          }}>{ICON.bell} {xs ? 'Notifs' : 'Notifications'}</Link>

          <div onClick={handleLogout} style={{
            ...S.btnRed,
            padding: xs ? '9px 8px' : lg ? '12px 20px' : '11px 16px',
            fontSize: xs ? 11 : lg ? 14 : 13,
            gap: xs ? 4 : 8,
          }} role="button">
            {ICON.logout} {xs ? 'Quitter' : 'Déconnexion'}
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX PHOTO ───────────────────────────────── */}
      {showPhotoModal && avatarUrl && (
        <div
          onClick={() => setShowPhotoModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, cursor: 'zoom-out',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo de profil en grand format"
        >
          {/* Bouton fermer */}
          <button
            onClick={() => setShowPhotoModal(false)}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
            aria-label="Fermer"
          >
            ✕
          </button>

          {/* Image */}
          <img
            src={avatarUrl}
            alt="Photo de profil"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              borderRadius: 20,
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
              objectFit: 'contain',
              cursor: 'default',
            }}
          />

          {/* Indication bas */}
          <p style={{
            position: 'absolute', bottom: 20,
            color: 'rgba(255,255,255,0.35)', fontSize: 12,
            pointerEvents: 'none',
          }}>
            Cliquez en dehors pour fermer
          </p>
        </div>
      )}

      <Toaster />
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)} />}
    </div>
  )
}

/** Affichage lisible du numéro (stocké en 243… côté API). */
function formatPhoneForProfile(phone) {
  if (phone == null || String(phone).trim() === '') return '—'
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('243') && digits.length >= 12) {
    const rest = digits.slice(3, 12)
    return `+243 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 9)}`
  }
  if (digits.startsWith('243') && digits.length > 3) {
    return `+${digits}`
  }
  return String(phone).trim()
}

/* Ligne d'info dans la carte */
function Row({ label, value, last }) {
  return (
    <div style={last ? S.infoRowLast : S.infoRow}>
      <span style={S.label}>{label}</span>
      <span style={S.value}>{value}</span>
    </div>
  )
}
