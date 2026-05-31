'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiRequest } from '@/lib/api'
import { formatOrderMoney } from '@/lib/helpers'

const ROTATION_MS = 7000

function pickMenus(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

export default function LandingMenusCarousel({ poster }) {
  const [menus, setMenus] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const hoverRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiRequest('/api/menus/public/browse?status=approved', { method: 'GET' })
        if (cancelled) return
        const list = pickMenus(res).filter((m) => m && m.image)
        setMenus(list)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (menus.length <= 1) return undefined
    const id = setInterval(() => {
      if (hoverRef.current) return
      setIndex((i) => (i + 1) % menus.length)
    }, ROTATION_MS)
    return () => clearInterval(id)
  }, [menus.length])

  const current = menus[index]
  const goPrev = () => setIndex((i) => (i - 1 + menus.length) % menus.length)
  const goNext = () => setIndex((i) => (i + 1) % menus.length)

  return (
    <div
      className="landing-menus-carousel"
      onMouseEnter={() => {
        hoverRef.current = true
      }}
      onMouseLeave={() => {
        hoverRef.current = false
      }}
    >
      <div className="landing-menus-carousel__frame">
        {loading && (
          <div className="landing-menus-carousel__slide landing-menus-carousel__slide--center">
            <div className="landing-menus-carousel__spinner" aria-hidden />
            <p className="landing-menus-carousel__center-text">Chargement des menus…</p>
          </div>
        )}

        {!loading && (menus.length === 0 || error) && (
          <div className="landing-menus-carousel__slide">
            {poster ? (
              <img
                src={poster}
                alt="Green Express"
                className="landing-menus-carousel__img"
                style={{ objectFit: 'contain', background: '#07070a', padding: '1rem' }}
              />
            ) : (
              <div className="landing-menus-carousel__slide--solid" />
            )}
            <div className="landing-menus-carousel__scrim" aria-hidden />
            <div className="landing-menus-carousel__caption">
              <p className="landing-menus-carousel__name">
                Découvrez bientôt nos menus
              </p>
            </div>
          </div>
        )}

        {!loading && menus.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={current?.id ?? index}
              className="landing-menus-carousel__slide"
              initial={{ opacity: 0, scale: 1.08, x: 60 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.04, x: -60 }}
              transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.img
                src={current.image}
                alt={current.name || current.title || 'Menu Green Express'}
                className="landing-menus-carousel__img"
                loading="lazy"
                decoding="async"
                initial={{ scale: 1.12 }}
                animate={{ scale: 1 }}
                transition={{ duration: 6.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
              <div className="landing-menus-carousel__scrim" aria-hidden />
              <div className="landing-menus-carousel__caption">
                <p className="landing-menus-carousel__name">
                  {current.name || current.title || 'Plat du jour'}
                </p>
                {current.price != null && (
                  <p className="landing-menus-carousel__price">
                    {formatOrderMoney(current.price, current.currency || 'CDF')}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {menus.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="landing-menus-carousel__nav landing-menus-carousel__nav--prev"
              aria-label="Menu précédent"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="landing-menus-carousel__nav landing-menus-carousel__nav--next"
              aria-label="Menu suivant"
            >
              ›
            </button>
          </>
        )}
      </div>

      {menus.length > 1 && (
        <div className="landing-menus-carousel__dots" role="tablist" aria-label="Sélectionner un menu">
          {menus.map((m, i) => (
            <button
              key={m.id ?? i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Voir ${m.name || m.title || `menu ${i + 1}`}`}
              onClick={() => setIndex(i)}
              className={`landing-menus-carousel__dot${i === index ? ' is-active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
