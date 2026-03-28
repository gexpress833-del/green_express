"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

function formatCurrency(amount, currency) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount)
  if (Number.isNaN(num)) return '—'
  const curr = currency || 'USD'
  /* CDF : affichage en francs entiers (évite « 8 500,01 FC » type artefact technique) */
  if (curr === 'CDF') {
    const rounded = Math.round(num)
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rounded)
  }
  if (curr === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
  }
  const intish = Math.abs(num - Math.round(num)) < 0.001
  return intish ? `${Math.round(num)} ${curr}` : `${num.toFixed(2)} ${curr}`
}

export default function MenuCard({ menu, onSelect, variant = 'default', onDelete, onCommand }) {
  const [imageError, setImageError] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const { addItem } = useCart()

  if (!menu) return null

  const isAvailable = menu.is_available !== false && menu.status === 'approved'
  const isPopular = menu.is_popular === true
  const linkHref = `/client/orders/create?menu_id=${menu.id}`

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (!isAvailable) return
    addItem(menu, 1)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1500)
  }

  /* ─── Variante client : styles réels (globals.css .client-menu-card*) ─── */
  if (variant === 'client') {
    return (
      <article className="client-menu-card">
        <div className="card-image-fixed client-menu-card__media">
          {menu.image && !imageError ? (
            <img
              src={menu.image}
              alt={menu.name || menu.title || ''}
              className="client-menu-card__img"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="client-menu-card__placeholder">Pas d&apos;image</div>
          )}

          <div className="client-menu-card__badges">
            {isPopular && (
              <span className="client-menu-card__badge client-menu-card__badge--hot">Populaire</span>
            )}
            <span
              className={`client-menu-card__badge ${
                isAvailable ? 'client-menu-card__badge--ok' : 'client-menu-card__badge--off'
              }`}
            >
              {isAvailable ? 'Dispo' : 'Indispo'}
            </span>
          </div>

          <div className="client-menu-card__price-float">{formatCurrency(menu.price, menu.currency)}</div>
        </div>

        <div className="client-menu-card__body">
          <h3 className="client-menu-card__title">{menu.name || menu.title}</h3>
          <p className="client-menu-card__desc">{menu.description || 'Découvrez ce plat de la maison.'}</p>

          <div className="client-menu-card__actions">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className="client-menu-card__btn client-menu-card__btn--primary"
            >
              {addedFeedback
                ? '✓ Ajouté au panier'
                : isAvailable
                  ? '🛒 Ajouter au panier'
                  : 'Non disponible'}
            </button>
            {isAvailable && (
              <div className="client-menu-card__secondary">
                <p className="client-menu-card__secondary-hint">Paiement direct</p>
                <Link href={linkHref} className="client-menu-card__link">
                  Commander ce plat seul
                  <span aria-hidden>→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>
    )
  }

  /* ─── Autres variantes (admin / cuisinier) : classes legacy ─── */
  return (
    <article className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 border border-slate-200 dark:border-slate-700">
      <div className="relative card-image-fixed w-full bg-gray-200 dark:bg-slate-700">
        {menu.image && !imageError ? (
          <img
            src={menu.image}
            alt={menu.name || menu.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-300 dark:bg-slate-600 rounded-t-2xl">
            <span className="text-slate-500 dark:text-slate-400 text-sm">Pas d&apos;image</span>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 flex gap-2 flex-wrap">
          {isPopular && (
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
              🔥 Populaire
            </span>
          )}
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
              isAvailable ? 'bg-green-500 text-white' : 'bg-red-500/80 text-white'
            }`}
          >
            {isAvailable ? '✓ Disponible' : '✗ Indisponible'}
          </span>
        </div>

        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-bold text-lg shadow-lg">
          {formatCurrency(menu.price, menu.currency)}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white mb-1 line-clamp-2">
          {menu.name || menu.title}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 h-10">
          {menu.description || 'Pas de description'}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(menu)
          }}
          disabled={!isAvailable}
          className={
            isAvailable
              ? 'btn-primary w-full text-center'
              : 'btn-secondary w-full text-center cursor-not-allowed'
          }
        >
          {isAvailable ? '🛒 Sélectionner' : '❌ Non disponible'}
        </button>
      </div>

      {variant === 'cuisinier' && (
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <a
            href={`/cuisinier/menu/${menu.id}/edit`}
            className="flex-1 inline-block text-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded font-semibold"
          >
            Modifier
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(menu.id)
            }}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
          >
            Supprimer
          </button>
        </div>
      )}
    </article>
  )
}
