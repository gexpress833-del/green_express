'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
}

/**
 * Hook réutilisable pour la géolocalisation du navigateur.
 * @param {boolean} watch - Si true, utilise watchPosition (temps réel). Sinon getCurrentPosition (one-shot).
 * @param {number} intervalMs - Intervalle minimum entre mises à jour en mode watch (défaut: 5000ms).
 */
export default function useGeolocation({ watch = false, intervalMs = 5000, autoStart = true } = {}) {
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permission, setPermission] = useState('prompt') // 'prompt' | 'granted' | 'denied'
  const watchRef = useRef(null)
  const lastUpdateRef = useRef(0)

  const handleSuccess = useCallback((geoPosition) => {
    const now = Date.now()
    if (now - lastUpdateRef.current < intervalMs) return
    lastUpdateRef.current = now

    const { latitude, longitude, accuracy, altitude, heading, speed } = geoPosition.coords
    setPosition({
      latitude,
      longitude,
      accuracy,
      altitude: altitude || null,
      heading: heading || null,
      speed: speed || null,
      timestamp: geoPosition.timestamp,
    })
    setLoading(false)
    setError(null)
  }, [intervalMs])

  const handleError = useCallback((geoError) => {
    setLoading(false)
    switch (geoError.code) {
      case geoError.PERMISSION_DENIED:
        setPermission('denied')
        setError('Permission de localisation refusée. Veuillez autoriser l\'accès au GPS dans les paramètres de votre navigateur.')
        break
      case geoError.POSITION_UNAVAILABLE:
        setPermission('denied')
        setError('Position GPS indisponible. Vérifiez que le GPS est activé sur votre appareil.')
        break
      case geoError.TIMEOUT:
        setError('Délai de récupération de la position dépassé. Réessayez.')
        break
      default:
        setError('Erreur de géolocalisation inconnue.')
    }
  }, [])

  const requestPosition = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLoading(false)
      setError('La géolocalisation n\'est pas supportée par ce navigateur.')
      return
    }

    setLoading(true)
    setError(null)

    if (watch) {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, GEO_OPTIONS)
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, GEO_OPTIONS)
    }
  }, [watch, handleSuccess, handleError])

  useEffect(() => {
    // Vérifier l'état de la permission via l'API Permissions si disponible
    if (typeof window !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state)
        result.onchange = () => setPermission(result.state)
      }).catch(() => {
        // Permissions API non supportée, continuer quand même
      })
    }

    if (autoStart) {
      requestPosition()
    }

    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
      }
    }
  }, [requestPosition, autoStart])

  return { position, loading, error, permission, requestPosition }
}
