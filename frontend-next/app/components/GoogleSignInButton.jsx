'use client'

import { signIn } from 'next-auth/react'
import GoogleBrandIcon from '@/components/GoogleBrandIcon'

/**
 * Lance OAuth Google via NextAuth ; la session Laravel est créée sur /auth/google-complete.
 */
export default function GoogleSignInButton({ returnUrl, className, disabled }) {
  const qs = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
  const callbackUrl = `/auth/google-complete${qs}`

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => signIn('google', { callbackUrl })}
    >
      <span className="google-sign-in-btn__icon">
        <GoogleBrandIcon size={20} />
      </span>
      Continuer avec Google
    </button>
  )
}
