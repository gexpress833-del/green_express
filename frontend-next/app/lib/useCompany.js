"use client"
import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'

/**
 * Récupère l'entreprise du contact connecté (rôle entreprise).
 * @returns {{ company: object | null, loading: boolean, error: string | null }}
 */
export function useCompany() {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiRequest('/api/entreprise/company', { method: 'GET' })
      .then((r) => {
        setCompany(r?.company ?? null)
        setError(null)
      })
      .catch((err) => {
        const msg = err?.data?.message || err?.message || 'Erreur chargement entreprise'
        setCompany(null)
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  return { company, loading, error }
}
