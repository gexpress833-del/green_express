'use client'
import Link from 'next/link'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PromoCard from '@/components/PromoCard'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { formatCurrencyCDF } from '@/lib/helpers'
import { getDashboardPathForRole } from '@/lib/permissions'
import {
  DEMO_LANDING_VIDEO_MP4,
  PRIMARY_LOGO,
  VIDEO_SOURCES_MP4,
  nextLogoSrc,
} from '@/lib/landingMedia'
import PaymentMethodsBanner from '@/components/PaymentMethodsBanner'

/** `/?from=brand` : accès volontaire à la landing (logo navbar) — sans redirection vers /{role}. */
function HomePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const publicLanding = searchParams.get('from') === 'brand'
  const { user, initialised } = useAuth()
  const heroVideoRef = useRef(null)
  const [logoSrc, setLogoSrc] = useState(PRIMARY_LOGO)
  const [currentPromo, setCurrentPromo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  /** Parcours marketing : invités + clients. Autres rôles → /{role} sauf si arrivée depuis le logo (publicLanding). */
  useEffect(() => {
    if (publicLanding) return
    if (!initialised || !user?.role) return
    if (user.role === 'client') return
    const target = getDashboardPathForRole(user.role)
    router.replace(target)
  }, [initialised, user, router, publicLanding])

  useEffect(() => {
    apiRequest('/api/subscription-plans/public', { method: 'GET' })
      .then(r => setPlans(Array.isArray(r) ? r : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false))
  }, [])

  useEffect(() => {
    // Page d'accueil : afficher uniquement la promotion en cours (entre date début et date fin)
    apiRequest('/api/promotions?active_only=1&current=1', { method: 'GET' })
      .then(r => {
        const promo = r && typeof r === 'object' && !Array.isArray(r) && r.id ? r : null
        setCurrentPromo(promo)
        setLoading(false)
      })
      .catch(() => {
        apiRequest('/api/promotions?active_only=1&per_page=1', { method: 'GET' })
          .then(r => {
            const arr = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : [])
            setCurrentPromo(arr.length > 0 ? arr[0] : null)
            setLoading(false)
          })
          .catch(() => {
            setCurrentPromo(null)
            setLoading(false)
          })
      })
  }, [])

  useEffect(() => {
    const el = heroVideoRef.current
    if (!el) return
    const enforceMutedAndPlay = () => {
      el.muted = true
      el.defaultMuted = true
      el.loop = true
      void el.play().catch(() => {})
    }
    enforceMutedAndPlay()
    el.addEventListener('loadeddata', enforceMutedAndPlay)
    el.addEventListener('canplay', enforceMutedAndPlay)
    return () => {
      el.removeEventListener('loadeddata', enforceMutedAndPlay)
      el.removeEventListener('canplay', enforceMutedAndPlay)
    }
  }, [])

  const dashboardHref = user ? getDashboardPathForRole(user.role) : null
  const subscriptionPlanHref = !user
    ? '/login?returnUrl=/client/subscriptions'
    : user.role === 'client'
      ? '/client/subscriptions'
      : dashboardHref
  const subscriptionPlanLabel =
    !user || user.role === 'client' ? 'Voir les abonnements' : 'Mon espace'

  if (initialised && user?.role && user.role !== 'client' && !publicLanding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0b1220' }}>
        <p className="text-white/80 text-center">Ouverture de votre espace…</p>
        <p className="text-white/45 text-sm mt-2 text-center">Redirection selon votre profil ({user.role})</p>
      </div>
    )
  }

  const primaryCtaHref = user
    ? dashboardHref
    : '/register'
  const primaryCtaLabel = user
    ? (user.role === 'client' ? 'Accéder à mes commandes' : 'Mon espace')
    : 'Créer mon compte gratuit'
  const secondaryCtaHref = user && user.role === 'client'
    ? '/client/menus'
    : '/menus'
  const secondaryCtaLabel = 'Découvrir les menus'

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="landing hero-anim-bg">
        <div className="landing-inner">
          <div className="landing-hero-column">
            <div className="hero-ambient-motion">
              <div className="mb-8 hero-anim-logo">
                <img
                  key={logoSrc}
                  src={logoSrc}
                  alt="Green Express"
                  decoding="async"
                  fetchPriority="high"
                  className="mx-auto block h-auto w-auto max-h-[min(220px,36vh)] max-w-[min(240px,72vw)] object-contain"
                  style={{
                    borderRadius: 20,
                    boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
                    border: '2px solid rgba(0, 255, 255, 0.3)',
                  }}
                  onError={() => setLogoSrc((s) => nextLogoSrc(s))}
                />
              </div>
              <h1 className="title hero-anim-title">
                Vos repas préférés, livrés en un clin d&apos;œil.
              </h1>
              <p className="subtitle hero-anim-subtitle" style={{ maxWidth: 640, margin: '20px auto 0' }}>
                Green Express, la plateforme de commande et livraison de repas en RDC.
                Commandez en quelques secondes, suivez votre livreur en temps réel
                et gagnez des points fidélité à chaque commande.
              </p>

              {/* CTAs */}
              <div
                className="hero-anim-subtitle"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  justifyContent: 'center',
                  marginTop: 28,
                }}
              >
                <Link
                  href={primaryCtaHref || '/register'}
                  className="inline-flex items-center justify-center"
                  style={{
                    minHeight: 48,
                    padding: '12px 26px',
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#0b1220',
                    background: 'linear-gradient(135deg, #39ff14 0%, #22d3ee 100%)',
                    border: '1px solid rgba(57, 255, 20, 0.5)',
                    boxShadow: '0 10px 30px rgba(34, 211, 238, 0.25)',
                  }}
                >
                  {primaryCtaLabel}
                </Link>
                <Link
                  href={secondaryCtaHref}
                  className="inline-flex items-center justify-center"
                  style={{
                    minHeight: 48,
                    padding: '12px 26px',
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#a5f3fc',
                    background: 'rgba(34, 211, 238, 0.14)',
                    border: '1px solid rgba(34, 211, 238, 0.55)',
                  }}
                >
                  {secondaryCtaLabel}
                </Link>
              </div>

              {/* Trust badges */}
              <div
                className="hero-anim-subtitle"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 14,
                  justifyContent: 'center',
                  marginTop: 24,
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#39ff14' }}>●</span> Livraison rapide
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#22d3ee' }}>●</span> Paiement sécurisé
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#a78bfa' }}>●</span> Points fidélité
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#fbbf24' }}>●</span> Service 7j/7
                </span>
              </div>
            </div>

            <div className="landing-hero-video-wrap">
              <div className="landing-hero-video-frame">
                <video
                  ref={heroVideoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster={logoSrc}
                >
                  {VIDEO_SOURCES_MP4.map((src) => (
                    <source key={src} src={src} type="video/mp4" />
                  ))}
                  <source src={DEMO_LANDING_VIDEO_MP4} type="video/mp4" />
                  Votre navigateur ne prend pas en charge la lecture vidéo HTML5.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres clés / Social proof */}
      <section className="py-12 px-6">
        <div className="container" style={{ maxWidth: 1100 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            <div className="stat-card">
              <h4>Commandes livrées</h4>
              <p>10 000+</p>
            </div>
            <div className="stat-card">
              <h4>Clients satisfaits</h4>
              <p>95 %</p>
            </div>
            <div className="stat-card">
              <h4>Délai moyen</h4>
              <p>&lt; 45 min</p>
            </div>
            <div className="stat-card">
              <h4>Partenaires</h4>
              <p>+30 restaurants</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(34, 211, 238, 0.04) 50%, transparent 100%)' }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Comment ça marche
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Commander un repas n&apos;a jamais été aussi simple : trois étapes, c&apos;est tout.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 24,
              maxWidth: 960,
              margin: '0 auto',
            }}
          >
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🍽️</div>
              <h3 className="step-title">Choisissez vos plats</h3>
              <p className="step-desc">
                Parcourez les menus de nos restaurants partenaires et composez votre commande selon vos envies.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">💳</div>
              <h3 className="step-title">Payez en toute sécurité</h3>
              <p className="step-desc">
                Carte bancaire ou Mobile Money (Orange Money, M-Pesa, Airtel Money). Paiement protégé, facture automatique.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🛵</div>
              <h3 className="step-title">Recevez & savourez</h3>
              <p className="step-desc">
                Suivez votre livreur en temps réel. Votre repas arrive chaud, à l&apos;heure, et vous gagnez des points fidélité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Actuelle Section */}
      <section className="py-20 px-6" style={{background: 'linear-gradient(180deg, transparent 0%, rgba(0, 255, 255, 0.03) 50%, transparent 100%)'}}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Promotion du Moment
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Profitez de notre offre exclusive du moment et réclamez-la avec vos points fidélité.
            </p>
          </div>
          
          {loading ? (
            <div className="card text-center py-16 max-w-4xl mx-auto">
              <p className="text-white/60">Chargement de la promotion...</p>
            </div>
          ) : currentPromo ? (
            <div className="max-w-5xl mx-auto">
              <PromoCard promo={currentPromo} loginRequired={initialised && !user} />
            </div>
          ) : (
            <div className="card text-center py-16 max-w-4xl mx-auto">
              <div className="text-5xl mb-4">🎁</div>
              <p className="text-white/60 text-lg mb-2">Aucune promotion disponible pour le moment.</p>
              <p className="text-white/40 text-sm">Revenez bientôt pour découvrir nos offres exclusives !</p>
            </div>
          )}
        </div>
      </section>

      {/* Types d'abonnement Green Express */}
      <section className="py-20 px-6" style={{background: 'linear-gradient(180deg, transparent 0%, rgba(157, 78, 221, 0.04) 50%, transparent 100%)'}}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Nos abonnements
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Mangez bien, tous les jours, sans y penser. Choisissez la formule
              hebdomadaire ou mensuelle qui colle à votre rythme — déjà en FC.
            </p>
          </div>
          {loadingPlans ? (
            <div className="card text-center py-12 max-w-4xl mx-auto">
              <p className="text-white/60">Chargement des offres...</p>
            </div>
          ) : plans.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div key={plan.id} className="card p-6 border border-white/10 hover:border-cyan-500/30 transition">
                  <h3 className="text-xl font-semibold text-cyan-400 mb-2">{plan.name}</h3>
                  {plan.description && <p className="text-white/70 text-sm mb-4">{plan.description}</p>}
                  <div className="space-y-1 text-white/90">
                    <p>{formatCurrencyCDF(Number(plan.price_week))} / semaine</p>
                    <p>{formatCurrencyCDF(Number(plan.price_month))} / mois</p>
                  </div>
                  <Link
                    href={subscriptionPlanHref}
                    className="link-visible-cyan mt-4 inline-block px-4 py-2 rounded-lg text-sm font-semibold border transition"
                  >
                    {subscriptionPlanLabel}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12 max-w-4xl mx-auto">
              <p className="text-white/60">Aucun plan d&apos;abonnement disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Entreprises — orientation B2B (mêmes routes login / register) */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(180deg, rgba(57, 255, 20, 0.06) 0%, transparent 100%)' }}>
        <div className="container max-w-3xl mx-auto">
          <div className="card p-8 sm:p-10 text-center border border-white/10" style={{ background: 'rgba(15, 28, 46, 0.85)' }}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{
              background: 'linear-gradient(135deg, #39ff14 0%, #00ffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Vous représentez une entreprise ?
            </h2>
            <p className="text-white/80 text-base sm:text-lg mb-6 max-w-xl mx-auto leading-relaxed">
              Offrez à vos équipes des repas de qualité, gérez un budget cantine,
              suivez les commandes et la facturation depuis un espace entreprise dédié.
              Idéal pour administrations, hôpitaux, écoles et sociétés privées.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              {!initialised ? (
                <div
                  className="mx-auto h-11 w-full max-w-md rounded-xl bg-white/5 animate-pulse sm:max-w-lg"
                  aria-busy="true"
                  aria-label="Chargement"
                />
              ) : !user ? (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-xl text-sm font-semibold border transition"
                    style={{ color: '#0b1220', background: 'linear-gradient(135deg, #39ff14, #22d3ee)', borderColor: 'rgba(57, 255, 20, 0.5)' }}
                  >
                    Connexion entreprise
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-xl text-sm font-semibold border border-white/25 text-white/95 hover:bg-white/10 transition"
                  >
                    Créer un compte
                  </Link>
                </>
              ) : user.role === 'entreprise' ? (
                <Link
                  href="/entreprise"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-xl text-sm font-semibold border transition"
                  style={{ color: '#0b1220', background: 'linear-gradient(135deg, #39ff14, #22d3ee)', borderColor: 'rgba(57, 255, 20, 0.5)' }}
                >
                  Mon espace entreprise
                </Link>
              ) : (
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-xl text-sm font-semibold border border-white/25 text-white/95 hover:bg-white/10 transition"
                >
                  Mon tableau de bord
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Nos Services */}
      <section className="py-20 px-6 container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{
            background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Nos Services
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Du repas du quotidien aux grandes occasions, Green Express
            s&apos;adapte à tous vos besoins.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="service-card">
            <div className="service-icon">
              <span className="text-5xl">👤</span>
            </div>
            <h3 className="service-title" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #0096ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Pour les particuliers
            </h3>
            <p className="service-description">
              Composez votre commande en quelques clics, payez en toute sécurité
              et recevez votre repas à domicile ou au bureau. Votre fidélité est récompensée à chaque commande.
            </p>
            <ul className="service-features">
              <li className="service-feature"><span className="feature-check">✓</span> Commandes en ligne</li>
              <li className="service-feature"><span className="feature-check">✓</span> Suivi en temps réel</li>
              <li className="service-feature"><span className="feature-check">✓</span> Points fidélité</li>
              <li className="service-feature"><span className="feature-check">✓</span> Abonnements flexibles</li>
            </ul>
          </div>

          <div className="service-card">
            <div className="service-icon">
              <span className="text-5xl">🎉</span>
            </div>
            <h3 className="service-title" style={{
              background: 'linear-gradient(135deg, #9d4edd 0%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Service événementiel
            </h3>
            <p className="service-description">
              Mariage, conférence, séminaire, anniversaire : notre équipe traiteur
              compose un menu sur mesure, adapté à votre budget, au nombre d&apos;invités
              et à votre thématique. Devis rapide, service impeccable.
            </p>
            <ul className="service-features">
              <li className="service-feature"><span className="feature-check">✓</span> Mariages et réceptions</li>
              <li className="service-feature"><span className="feature-check">✓</span> Conférences et séminaires</li>
              <li className="service-feature"><span className="feature-check">✓</span> Événements privés</li>
              <li className="service-feature"><span className="feature-check">✓</span> Devis sur mesure</li>
            </ul>
            <Link
              href="/evenements"
              className="link-visible-cyan mt-4 inline-block px-4 py-2 rounded-lg text-sm font-semibold border transition"
              style={{ color: '#a5f3fc', backgroundColor: 'rgba(34, 211, 238, 0.25)', borderColor: 'rgba(34, 211, 238, 0.6)' }}
            >
              Demander un devis événement
            </Link>
          </div>
        </div>
      </section>

      {/* Paiements sécurisés — réassurance visuelle */}
      <section
        className="py-16 px-6"
        style={{
          background:
            'linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(0, 255, 255, 0.04) 45%, rgba(15, 23, 42, 0.5) 100%)',
        }}
      >
        <div className="container max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{
              background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 55%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Paiements en toute sécurité
          </h2>
          <p className="text-white/75 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Réglez vos commandes et abonnements en toute confiance : cartes bancaires et Mobile Money (RDC) pris en charge
            pour un parcours de paiement clair et protégé.
          </p>
          <div className="mx-auto max-w-2xl w-full payment-methods-banner--landing">
            <PaymentMethodsBanner />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6" style={{background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(157, 78, 221, 0.05) 100%)'}}>
        <div className="container text-center" style={{ maxWidth: 760 }}>
          <h2 className="text-4xl font-bold mb-4" style={{
            background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Prêt à passer à table ?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d&apos;utilisateurs qui ont adopté Green Express pour
            leurs repas du quotidien. Inscription gratuite, aucun engagement.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            <Link
              href={primaryCtaHref || '/register'}
              className="inline-flex items-center justify-center"
              style={{
                minHeight: 48,
                padding: '12px 28px',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                color: '#0b1220',
                background: 'linear-gradient(135deg, #39ff14 0%, #22d3ee 100%)',
                border: '1px solid rgba(57, 255, 20, 0.5)',
                boxShadow: '0 10px 30px rgba(34, 211, 238, 0.25)',
              }}
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={secondaryCtaHref}
              className="inline-flex items-center justify-center"
              style={{
                minHeight: 48,
                padding: '12px 28px',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                color: '#a5f3fc',
                background: 'rgba(34, 211, 238, 0.14)',
                border: '1px solid rgba(34, 211, 238, 0.55)',
              }}
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen app-bg flex items-center justify-center" aria-busy="true" aria-label="Chargement">
          <p className="text-white/40 text-sm">Chargement…</p>
        </div>
      }
    >
      <HomePageInner />
    </Suspense>
  )
}
