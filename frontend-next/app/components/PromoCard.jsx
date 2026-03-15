"use client"
import Image from 'next/image'
import Link from 'next/link'
import GoldButton from './GoldButton'

// Les promotions sont des repas spéciaux, distincts des plats du menu.
// Image, titre et description viennent d'abord de la promotion elle-même.
// Si loginRequired : afficher "Connectez-vous pour réclamer". Sinon si onClaim : bouton réclamation, sinon lien vers /client/promotions.
export default function PromoCard({ promo, onClaim, claimDisabled, claimLoading, loginRequired, isUpcoming }) {
  if (!promo) return null

  const menu = promo.menu || {}
  const pointsRequired = promo.points_required || 0
  const startAt = promo.start_at
  const endAt = promo.end_at
  const image = promo.image || menu.image
  const title = promo.title || menu.title || 'Promotion spéciale'
  const description = promo.description ?? menu.description

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Calculer le temps restant
  const getTimeRemaining = (endDate) => {
    if (!endDate) return null
    const now = new Date()
    const end = new Date(endDate)
    const diff = end - now
    
    if (diff <= 0) return 'Expirée'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`
    return 'Bientôt expirée'
  }

  return (
    <div className="featured-promo-card">
      {/* Image de la promotion (propre au repas spécial, non liée au menu) */}
      {image ? (
        <div className="promo-image-large">
          <Image
            src={image}
            alt={title}
            width={600}
            height={400}
            className="promo-img"
            unoptimized
          />
        </div>
      ) : (
        <div className="promo-image-placeholder">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-white/60">Image du plat</p>
        </div>
      )}

      <div className="promo-content-large">
        {/* Titre et description de la promotion (repas spécial) */}
        <h2 className="promo-title-large">
          {title}
        </h2>

        {description && (
          <p className="promo-description-large">
            {description}
          </p>
        )}

        {/* Promotion à venir */}
        {isUpcoming && startAt && (
          <div className="mb-4 p-4 bg-cyan-500/20 border border-cyan-500/50 rounded-xl text-cyan-200 text-center">
            <p className="font-medium">Disponible à partir du {formatDate(startAt)}</p>
            <p className="text-sm opacity-90">Vous pourrez réclamer cette promotion à partir de cette date.</p>
          </div>
        )}

        {/* Informations de la promotion */}
        <div className="promo-info-grid">
          {/* Points requis */}
          <div className="promo-info-item">
            <div className="info-icon">🎯</div>
            <div className="info-content">
              <span className="info-label">Points requis</span>
              <span className="info-value points-value">{pointsRequired} points</span>
            </div>
          </div>

          {/* Début (si à venir) */}
          {startAt && (
            <div className="promo-info-item">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <span className="info-label">Début</span>
                <span className="info-value date-value">{formatDate(startAt)}</span>
              </div>
            </div>
          )}

          {/* Échéance */}
          {endAt && (
            <div className="promo-info-item">
              <div className="info-icon">⏰</div>
              <div className="info-content">
                <span className="info-label">Échéance</span>
                <span className="info-value date-value">{formatDate(endAt)}</span>
                <span className="info-remaining">{getTimeRemaining(endAt)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="promo-action-large">
          {loginRequired ? (
            <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl text-center">
              <p className="text-amber-200 font-medium mb-3">Connectez-vous pour réclamer cette promotion.</p>
              <Link href="/login" className="gold inline-block px-6 py-3 rounded-xl font-semibold text-[#0b1220] no-underline">
                Se connecter
              </Link>
            </div>
          ) : onClaim ? (
            <GoldButton
              onClick={() => onClaim(promo)}
              disabled={claimDisabled}
            >
              {claimLoading ? 'Réclamation...' : 'Réclamer cette promotion'}
            </GoldButton>
          ) : (
            <GoldButton href="/client/promotions">
              Réclamer cette promotion
            </GoldButton>
          )}
        </div>
      </div>
    </div>
  )
}
