"use client"
// Using native <img> for consistent sizing in cards
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

function formatCurrency(amount, currency) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount)
  if (Number.isNaN(num)) return '—'
  const curr = currency || 'USD'
  if (['USD', 'CDF'].includes(curr)) {
    const locale = curr === 'USD' ? 'en-US' : 'fr-CD'
    return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(num)
  }
  return `${num.toFixed(2)} ${curr}`
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
  
  return (
    <article
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1 border border-slate-200 dark:border-slate-700"
    >
      {/* Image Container : responsive + coins arrondis (voir .card-image-fixed dans globals.css) */}
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
            <span className="text-slate-500 dark:text-slate-400 text-sm">Pas d'image</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex gap-2 flex-wrap">
          {isPopular && (
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
              🔥 Populaire
            </span>
          )}
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
            isAvailable 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500/80 text-white'
          }`}>
            {isAvailable ? '✓ Disponible' : '✗ Indisponible'}
          </span>
        </div>

        {/* Price Badge - Top Right */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-bold text-lg shadow-lg">
          {formatCurrency(menu.price, menu.currency)}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 sm:p-5">
        {/* Title */}
        <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white mb-1 line-clamp-2">
          {menu.name || menu.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 h-10">
          {menu.description || 'Pas de description'}
        </p>

        {/* Prix bien visible pour le client (sous la description) */}
        {variant === 'client' && (
          <p className="text-lg font-bold text-amber-500 dark:text-amber-400 mb-3">
            {formatCurrency(menu.price, menu.currency)}
          </p>
        )}

        {/* Footer - Action Buttons (client: panier + commander seul) */}
        {variant === 'client' ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
                isAvailable
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black shadow-md hover:shadow-lg active:scale-95'
                  : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
            >
              {addedFeedback ? '✓ Ajouté au panier' : (isAvailable ? '🛒 Ajouter au panier' : '❌ Non disponible')}
            </button>
            {isAvailable && (
              <Link href={linkHref} className="block text-center text-sm text-cyan-400 hover:text-cyan-300">
                Commander ce plat seul →
              </Link>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect?.(menu) }}
            disabled={!isAvailable}
            className={isAvailable ? 'btn-primary w-full text-center' : 'btn-secondary w-full text-center cursor-not-allowed'}
          >
            {isAvailable ? '🛒 Sélectionner' : '❌ Non disponible'}
          </button>
        )}
      </div>
      {/* Cuisinier actions */}
      {variant === 'cuisinier' && (
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <a href={`/cuisinier/menu/${menu.id}/edit`} className="flex-1 inline-block text-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded font-semibold">Modifier</a>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(menu.id) }} className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold">Supprimer</button>
        </div>
      )}
    </article>
  )
}
