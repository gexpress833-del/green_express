'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { linkGoogleAccount } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/api'
import { getDashboardPathForRole } from '@/lib/permissions'
import { isSafeInternalPath } from '@/lib/guestEntry'
import Link from 'next/link'

function GoogleCompleteInner() {
  const { data: session, status } = useSession()
  const { refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (status === 'loading' || started.current) return

    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }

    const idToken = session?.googleIdToken
    if (!idToken) {
      setError('Connexion Google incomplète. Réessayez.')
      return
    }

    started.current = true

    ;(async () => {
      try {
        const data = await linkGoogleAccount(idToken)
        await refreshUser()
        await signOut({ redirect: false })

        const returnUrl = searchParams.get('returnUrl')
        let dest = '/'
        if (isSafeInternalPath(returnUrl) && returnUrl !== '/') {
          dest = returnUrl
        } else if (data?.user?.role) {
          dest = getDashboardPathForRole(data.user.role)
        }
        router.replace(dest)
      } catch (err) {
        started.current = false
        await signOut({ redirect: false }).catch(() => {})
        setError(getApiErrorMessage(err) || 'Impossible de finaliser la connexion Google.')
      }
    })()
  }, [status, session, router, searchParams, refreshUser])

  return (
    <section className="page-section min-h-screen flex items-center justify-center bg-[#0b1220] text-white px-4">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <p className="text-red-300 mb-4" role="alert">
              {error}
            </p>
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 underline">
              Retour à la connexion
            </Link>
          </>
        ) : (
          <p className="text-white/70">Finalisation de la connexion Google…</p>
        )}
      </div>
    </section>
  )
}

export default function GoogleCompletePage() {
  return (
    <Suspense
      fallback={
        <section className="page-section min-h-screen flex items-center justify-center bg-[#0b1220]">
          <p className="text-white/70">Chargement…</p>
        </section>
      }
    >
      <GoogleCompleteInner />
    </Suspense>
  )
}
