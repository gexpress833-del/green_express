'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { getDashboardPathForRole } from '@/lib/permissions'
import { getLoginHref, isSafeInternalPath } from '@/lib/guestEntry'
import { PRIMARY_LOGO } from '@/lib/landingMedia'
import LandingHero from '@/components/landing/LandingHero'
import LandingStats from '@/components/landing/LandingStats'
import LandingHowItWorks from '@/components/landing/LandingHowItWorks'
import LandingPromotion from '@/components/landing/LandingPromotion'
import LandingSubscriptions from '@/components/landing/LandingSubscriptions'
import LandingEnterprise from '@/components/landing/LandingEnterprise'
import LandingServices from '@/components/landing/LandingServices'
import LandingPayments from '@/components/landing/LandingPayments'
import LandingFinalCta from '@/components/landing/LandingFinalCta'

function HomePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const publicLanding = searchParams.get('from') === 'brand'
  const returnUrl = searchParams.get('returnUrl') || ''
  const safeReturnUrl = isSafeInternalPath(returnUrl) ? returnUrl : ''
  const { user, initialised } = useAuth()
  const [logoSrc, setLogoSrc] = useState(PRIMARY_LOGO)
  const [currentPromo, setCurrentPromo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    if (!initialised || !user?.role) return
    if (publicLanding) return

    if (safeReturnUrl) {
      const rolePrefix = `/${user.role}`
      const mayUseReturn =
        user.role === 'client' ||
        safeReturnUrl === rolePrefix ||
        safeReturnUrl.startsWith(`${rolePrefix}/`)
      if (mayUseReturn) {
        router.replace(safeReturnUrl)
        return
      }
    }

    if (user.role === 'client') return

    const target = getDashboardPathForRole(user.role)
    router.replace(target)
  }, [initialised, user, router, publicLanding, safeReturnUrl])

  useEffect(() => {
    apiRequest('/api/subscription-plans/public', { method: 'GET' })
      .then((r) => setPlans(Array.isArray(r) ? r : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false))
  }, [])

  useEffect(() => {
    apiRequest('/api/promotions?active_only=1&current=1', { method: 'GET' })
      .then((r) => {
        const promo = r && typeof r === 'object' && !Array.isArray(r) && r.id ? r : null
        setCurrentPromo(promo)
        setLoading(false)
      })
      .catch(() => {
        apiRequest('/api/promotions?active_only=1&per_page=1', { method: 'GET' })
          .then((r) => {
            const arr = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : []
            setCurrentPromo(arr.length > 0 ? arr[0] : null)
            setLoading(false)
          })
          .catch(() => {
            setCurrentPromo(null)
            setLoading(false)
          })
      })
  }, [])

  const dashboardHref = user ? getDashboardPathForRole(user.role) : null
  const loginHref = getLoginHref(safeReturnUrl || '/client/subscriptions')
  const subscriptionPlanHref = !user
    ? getLoginHref('/client/subscriptions')
    : user.role === 'client'
      ? '/client/subscriptions'
      : dashboardHref

  if (initialised && user?.role && user.role !== 'client' && !publicLanding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 landing-modern-redirect">
        <p className="text-white/80 text-center">Ouverture de votre espace…</p>
        <p className="text-white/45 text-sm mt-2 text-center">
          Redirection selon votre profil ({user.role})
        </p>
      </div>
    )
  }

  const primaryCtaHref = user ? dashboardHref : '/register'
  const primaryCtaLabel = user
    ? user.role === 'client'
      ? 'Accéder à mes commandes'
      : 'Mon espace'
    : 'Créer mon compte gratuit'
  const secondaryCtaHref = user && user.role === 'client' ? '/client/menus' : '/menus'

  return (
    <div className="min-h-screen landing-modern-page">
      {initialised && !user && safeReturnUrl ? (
        <div className="landing-return-banner" role="status">
          <p className="landing-return-banner__text">
            Connectez-vous pour accéder à la page demandée.
          </p>
          <Link href={getLoginHref(safeReturnUrl)} className="landing-return-banner__cta">
            Se connecter
            </Link>
        </div>
      ) : null}
      <LandingHero
        logoSrc={logoSrc}
        setLogoSrc={setLogoSrc}
        primaryCtaHref={primaryCtaHref}
        primaryCtaLabel={primaryCtaLabel}
        secondaryCtaHref={secondaryCtaHref}
      />
      <LandingStats />
      <LandingHowItWorks />
      <LandingPromotion
        loading={loading}
        currentPromo={currentPromo}
        loginRequired={initialised && !user}
      />
      <LandingSubscriptions
        plans={plans}
        loadingPlans={loadingPlans}
        subscriptionPlanHref={subscriptionPlanHref}
      />
      <LandingEnterprise
        initialised={initialised}
        user={user}
        dashboardHref={dashboardHref}
        loginHref={loginHref}
      />
      <LandingServices />
      <LandingPayments />
      <LandingFinalCta
        primaryCtaHref={primaryCtaHref}
        primaryCtaLabel={primaryCtaLabel}
        secondaryCtaHref={secondaryCtaHref}
      />
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
