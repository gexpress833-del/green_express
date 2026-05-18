'use client'

import Link from 'next/link'

export function LandingCtaPrimary({ href, children }) {
  return (
    <Link href={href} className="landing-cta landing-cta--primary">
      {children}
    </Link>
  )
}

export function LandingCtaSecondary({ href, children }) {
  return (
    <Link href={href} className="landing-cta landing-cta--secondary">
      {children}
    </Link>
  )
}

export function LandingCtaRow({ children, className = '' }) {
  return <div className={`landing-cta-row ${className}`.trim()}>{children}</div>
}
