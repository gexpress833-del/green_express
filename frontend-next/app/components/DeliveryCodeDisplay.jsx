'use client'

import { useState } from 'react'

export default function DeliveryCodeDisplay({ code, subtitle, showCopy = true }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silently
    }
  }

  if (!code) {
    return (
      <div className="delivery-code-card delivery-code-card--loading">
        <div className="delivery-code-shimmer" />
        <p className="delivery-code-label">Génération du code de livraison…</p>
      </div>
    )
  }

  return (
    <div className="delivery-code-card">
      <div className="delivery-code-glow" />
      <div className="delivery-code-content">
        <div className="delivery-code-badge">
          <span className="delivery-code-icon">🔐</span>
          <span className="delivery-code-status">Paiement confirmé</span>
        </div>

        <p className="delivery-code-label">{subtitle || 'Code de livraison'}</p>

        <div className="delivery-code-value-wrapper">
          <code className="delivery-code-value">{code}</code>
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className={`delivery-code-copy-btn${copied ? ' copied' : ''}`}
              aria-label="Copier le code"
            >
              {copied ? 'Copié !' : 'Copier'}
            </button>
          )}
        </div>

        <p className="delivery-code-hint">
          Présente ce code au livreur lors de la remise de votre commande.
        </p>
      </div>
    </div>
  )
}
