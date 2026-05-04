"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { broadcastAnnouncement, fetchNotifications } from '@/lib/notifications'
import { formatDate } from '@/lib/helpers'
import Link from 'next/link'
import { pushToast } from '@/components/Toaster'
import { getNotificationType } from '@/lib/notificationCategories'
import { getNotificationField } from '@/lib/notificationPayload'

export default function AdminNotifications() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceMessage, setAnnounceMessage] = useState('')
  const [sendingAnnounce, setSendingAnnounce] = useState(false)

  async function loadAnnouncements() {
    try {
      setLoading(true)
      const data = await fetchNotifications(50)
      const list = Array.isArray(data?.notifications) ? data.notifications : []
      setAnnouncements(list.filter((n) => getNotificationType(n) === 'announcements').slice(0, 15))
    } catch {
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function handleBroadcast(e) {
    e.preventDefault()
    const t = announceTitle.trim()
    const m = announceMessage.trim()
    if (!t || !m) {
      pushToast({ type: 'error', message: 'Renseignez le titre et le message.' })
      return
    }
    setSendingAnnounce(true)
    try {
      const r = await broadcastAnnouncement(t, m)
      pushToast({
        type: 'success',
        message: r?.message || `Annonce envoyée (${r?.users_notified ?? '?'} utilisateurs).`,
      })
      setAnnounceTitle('')
      setAnnounceMessage('')
      loadAnnouncements()
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Envoi impossible.' })
    } finally {
      setSendingAnnounce(false)
    }
  }

  return (
    <section className="page-section page-section--admin-tight bg-[#0b1220] text-white min-h-screen">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Diffusion d'annonces</h1>
          <p className="text-white/70 mt-2">Le centre de notifications est désormais unifié sur une page dédiée.</p>
          <Link
            href="/notifications"
            className="inline-flex items-center mt-3 px-4 py-2 rounded-lg border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/10 transition"
          >
            Ouvrir le centre de notifications
          </Link>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            <div className="card mb-6 border border-emerald-500/30 bg-emerald-500/5">
              <h2 className="text-xl font-semibold mb-1 text-emerald-200">Annonce à tous les utilisateurs</h2>
              <p className="text-white/60 text-sm mb-4">
                Message d’information Green Express : chaque compte recevra une notification (onglet « Annonces » dans l’app).
              </p>
              <form onSubmit={handleBroadcast} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Titre</label>
                  <input
                    type="text"
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                    placeholder="Ex. : Horaires du 15 août"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Message</label>
                  <textarea
                    value={announceMessage}
                    onChange={(e) => setAnnounceMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                    placeholder="Texte visible par tous les utilisateurs connectés…"
                    maxLength={5000}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-5 py-2.5 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {sendingAnnounce ? 'Envoi…' : 'Diffuser l’annonce'}
                </button>
              </form>
            </div>

            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-1" style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Historique des annonces
              </h2>
              <p className="text-white/60 text-sm mb-6">Dernières annonces diffusées aux utilisateurs.</p>
              {loading ? (
                <p className="text-white/60 py-8 text-center">Chargement...</p>
              ) : announcements.length === 0 ? (
                <p className="text-white/50 py-8 text-center">Aucune annonce diffusée pour le moment.</p>
              ) : (
                <>
                  <div className="rounded-xl border border-white/10 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                      <thead>
                        <tr className="bg-white/5 text-white/80 text-sm font-semibold">
                          <th className="py-3 px-4">Titre</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Message</th>
                          <th className="py-3 px-4">État</th>
                        </tr>
                      </thead>
                      <tbody>
                        {announcements.map((notification) => (
                          <tr
                            key={notification.id}
                            className="border-t border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                          >
                            <td className="py-3 px-4 font-medium text-white">{getNotificationField(notification, 'title') || 'Annonce'}</td>
                            <td className="py-3 px-4 text-white/60 text-sm whitespace-nowrap">{formatDate(notification.created_at)}</td>
                            <td className="py-3 px-4 text-white/80 text-sm max-w-md">
                              <span className="line-clamp-2">{getNotificationField(notification, 'message') || notification.body || '—'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`badge ${notification.read_at ? 'badge-success' : 'badge-warning'}`}>{notification.read_at ? 'Lue' : 'Envoyée'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href="/notifications?tab=announcements" className="text-[#d4af37] hover:text-amber-300 font-semibold text-sm">
                      Voir toutes les annonces →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
    </section>
  )
}
