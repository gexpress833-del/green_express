"use client"

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { setStoredUsdCdfRate } from '@/lib/currencyPreference'

export default function AdminSettingsPage() {
  const [rate, setRate] = useState('2800')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    apiRequest('/api/currency/rate', { method: 'GET' })
      .then((response) => {
        const nextRate = Number(response?.usd_cdf_rate || 2800)
        setRate(String(nextRate))
        setStoredUsdCdfRate(nextRate)
        setUpdatedAt(response?.updated_at || null)
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const numericRate = Number(rate)
    if (!Number.isFinite(numericRate) || numericRate <= 0) {
      setError('Entrez un taux valide supérieur à 0.')
      return
    }
    setSaving(true)
    try {
      const response = await apiRequest('/api/admin/currency/rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usd_cdf_rate: numericRate }),
      })
      const nextRate = Number(response?.usd_cdf_rate || numericRate)
      setRate(String(nextRate))
      setStoredUsdCdfRate(nextRate)
      setUpdatedAt(response?.updated_at || null)
      setSuccess('Taux de conversion mis à jour.')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-section page-section--admin-tight min-h-screen bg-[#0b1220] text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#d4af37]">Paramètres</h1>
        <p className="text-white/70 mt-2">Configurez les paramètres globaux de Green Express.</p>
      </header>

      <div className="dashboard-grid">
        <Sidebar />
        <main className="main-panel space-y-6">
          <form onSubmit={handleSubmit} className="card max-w-2xl">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75 font-semibold">Devise</p>
              <h2 className="text-2xl font-bold text-white mt-2">Taux de conversion USD vers FC</h2>
              <p className="text-white/60 text-sm mt-2">
                Ce taux est utilisé pour convertir les prix des menus entre dollars et francs congolais.
              </p>
            </div>

            {loading ? (
              <p className="text-white/60">Chargement...</p>
            ) : (
              <>
                <label className="block text-sm font-semibold text-white/80 mb-2" htmlFor="usd-cdf-rate">
                  1 USD équivaut à combien de FC ?
                </label>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <input
                    id="usd-cdf-rate"
                    type="number"
                    min="1"
                    step="0.0001"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    className="w-full sm:max-w-xs px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#d4af37] outline-none"
                    placeholder="2800"
                  />
                  <span className="text-white/65 text-sm">FC pour 1 USD</span>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-white/70 text-sm">Aperçu</p>
                  <p className="text-xl font-bold text-cyan-300 mt-1">
                    10 USD = {(Number(rate || 0) * 10).toLocaleString('fr-FR')} FC
                  </p>
                  {updatedAt && <p className="text-white/40 text-xs mt-2">Dernière mise à jour : {new Date(updatedAt).toLocaleString('fr-FR')}</p>}
                </div>

                {error && <p className="text-red-300 text-sm mt-4">{error}</p>}
                {success && <p className="text-emerald-300 text-sm mt-4">{success}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 px-5 py-3 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f5e08a] text-[#0b1220] font-bold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer le taux'}
                </button>
              </>
            )}
          </form>
        </main>
      </div>
    </section>
  )
}
