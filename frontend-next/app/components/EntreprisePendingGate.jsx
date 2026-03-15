"use client"
import { useCompany } from '@/lib/useCompany'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Affiche la page "Compte en examen" tant que l'entreprise n'est pas activée par l'admin.
 * Sinon rend les children (tableau de bord, sidebar, etc.).
 */
export default function EntreprisePendingGate({ children }) {
  const { company, loading, error } = useCompany()
  const { logout } = useAuth()
  const router = useRouter()
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (loading) {
    return (
      <section className="page-section min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <p className="text-white/60">Chargement...</p>
        </div>
      </section>
    )
  }

  // Compte supprimé ou aucune entreprise associée
  if (!loading && !company && !error) {
    return (
      <section className="page-section min-h-screen flex items-center justify-center p-4 bg-[#0b1220]">
        <div className="card p-8 max-w-lg text-center">
          <div className="text-4xl mb-4" aria-hidden>⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Compte entreprise supprimé ou non associé</h1>
          <p className="text-white/80 mb-6">
            Votre compte utilisateur est toujours actif, mais l&apos;entreprise associée n&apos;existe plus ou a été supprimée par l&apos;administrateur. Vous ne pouvez plus accéder au tableau de bord entreprise.
          </p>
          <p className="text-white/70 text-sm mb-8">
            Pour toute question : <a href="mailto:gexpress833@gmail.com" className="underline" style={{ color: '#d4af37' }}>gexpress833@gmail.com</a> — <a href="tel:+243990292005" className="underline" style={{ color: '#d4af37' }}>+243 990 292 005</a>
          </p>
          <Link href="/profile" className="inline-block px-6 py-3 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition">Mon profil</Link>
          <p className="mt-6">
            <button type="button" onClick={handleLogout} className="text-white/70 hover:text-white text-sm underline bg-transparent border-none cursor-pointer">Se déconnecter</button>
          </p>
        </div>
      </section>
    )
  }

  // Demande rejetée
  if (!loading && company && company.status === 'rejected') {
    return (
      <section className="page-section min-h-screen flex items-center justify-center p-4 bg-[#0b1220]">
        <div className="card p-8 max-w-lg text-center">
          <div className="text-4xl mb-4" aria-hidden>❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Demande d&apos;accès entreprise rejetée</h1>
          <p className="text-white/80 mb-4">
            Votre demande d&apos;accès au portail entreprise n&apos;a pas été retenue.
          </p>
          {company.rejection_reason && (
            <div className="p-4 rounded-lg bg-white/10 border border-white/20 text-left text-white/90 text-sm mb-6">
              <span className="text-white/60 block text-xs uppercase tracking-wider mb-1">Motif indiqué</span>
              {company.rejection_reason}
            </div>
          )}
          <p className="text-white/70 text-sm mb-8">
            Pour toute question : <a href="mailto:gexpress833@gmail.com" className="underline" style={{ color: '#d4af37' }}>gexpress833@gmail.com</a> — <a href="tel:+243990292005" className="underline" style={{ color: '#d4af37' }}>+243 990 292 005</a>
          </p>
          <Link href="/profile" className="inline-block px-6 py-3 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition">Mon profil</Link>
          <p className="mt-6">
            <button type="button" onClick={handleLogout} className="text-white/70 hover:text-white text-sm underline bg-transparent border-none cursor-pointer">Se déconnecter</button>
          </p>
        </div>
      </section>
    )
  }

  // En attente de validation (examen en cours)
  const isPending = error || !company || (company.status !== 'active')
  if (isPending) {
    return (
      <section className="page-section min-h-screen flex items-center justify-center p-4 bg-[#0b1220]">
        <div className="card p-8 max-w-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-6" aria-hidden>
            <div className="relative shrink-0" style={{ width: 14, height: 14 }}>
              <svg className="w-full h-full" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="26" stroke="rgba(212,175,55,0.4)" strokeWidth="2" />
                <circle
                  cx="28" cy="28" r="26"
                  stroke="#d4af37"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="42 140"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '28px 28px', animation: 'examenSpin 1.5s linear infinite' }}
                />
              </svg>
            </div>
            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Examen en cours</p>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Compte en cours d&apos;examen
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Votre demande d&apos;accès entreprise a bien été reçue. Notre équipe examine votre dossier et activera votre compte sous <strong>48 heures</strong>.
          </p>
          <p className="text-white/70 mb-6">
            Vous serez notifié par email à l&apos;adresse fournie dès que votre compte sera activé. Vous pourrez alors accéder à votre tableau de bord et à toutes les fonctionnalités réservées aux entreprises.
          </p>
          <p className="text-white/80 text-sm mb-2">
            Pour toute question, contactez Green Express :
          </p>
          <ul className="list-none space-y-1 mb-8 text-white">
            <li><a href="mailto:gexpress833@gmail.com" className="underline hover:opacity-90" style={{ color: '#d4af37' }}>gexpress833@gmail.com</a></li>
            <li><a href="tel:+243990292005" className="underline hover:opacity-90" style={{ color: '#d4af37' }}>+243 990 292 005</a></li>
          </ul>
          <Link
            href="/profile"
            className="inline-block px-6 py-3 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition"
          >
            Mon profil
          </Link>
          <p className="mt-6">
            <button type="button" onClick={handleLogout} className="text-white/70 hover:text-white text-sm underline bg-transparent border-none cursor-pointer">
              Se déconnecter
            </button>
          </p>
        </div>
      </section>
    )
  }

  return children
}
