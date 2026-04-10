'use client'

import Image from 'next/image'

/**
 * Bandeau des moyens de paiement acceptés (cartes + Mobile Money RDC).
 * Le visuel PNG inclut le bandeau texte — pas de doublon ; accessibilité via sr-only.
 */
export default function PaymentMethodsBanner({
  className = '',
  compact = false,
  /** Afficher un titre au-dessus (ex. page formules). En modal : false par défaut. */
  showHeading = false,
  id = 'payment-methods-banner',
}) {
  return (
    <div
      id={id}
      className={`payment-methods-banner w-full min-w-0 ${compact ? 'payment-methods-banner--compact' : ''} ${className}`.trim()}
    >
      {showHeading ? (
        <p className="payment-methods-banner__title">Moyens de paiement acceptés</p>
      ) : (
        <span className="sr-only">
          Moyens de paiement : Visa, Mastercard, M-Pesa, Orange Money, Airtel Money, Afrimoney, Visa Pay, Mosolo
        </span>
      )}
      <div className="payment-methods-banner__frame">
        <div className="payment-methods-banner__img-wrap">
          <Image
            src="/images/payment-methods-banner.png"
            alt=""
            width={1200}
            height={220}
            className="payment-methods-banner__img"
            sizes="(max-width: 512px) calc(100vw - 3rem), 480px"
            priority={false}
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}
