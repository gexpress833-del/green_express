'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import useGeolocation from '@/hooks/useGeolocation'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function LandingMap() {
  const [started, setStarted] = useState(false)
  const { position, loading, error, requestPosition } = useGeolocation({
    watch: false,
    autoStart: false,
  })

  const handleStart = () => {
    setStarted(true)
    requestPosition()
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            📍 Où êtes-vous ?
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
            Localisez-vous sur la carte pour voir les restaurants et services disponibles près de chez vous.
          </p>
        </div>

        {!started ? (
          <div className="flex flex-col items-center justify-center gap-5 bg-slate-800/60 rounded-2xl border border-white/10 p-10 sm:p-14">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-3xl">
              🗺️
            </div>
            <p className="text-white/70 text-center max-w-md">
              Cliquez ci-dessous pour afficher votre position actuelle sur la carte. Aucune donnée n'est enregistrée.
            </p>
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg flex items-center gap-2"
            >
              <span>📍</span> Voir ma position sur la carte
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {loading && !position && (
              <div className="flex flex-col items-center justify-center gap-3 bg-slate-800/60 rounded-2xl border border-white/10 p-10">
                <span className="inline-block w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-white/70 text-sm">Récupération de votre position…</p>
              </div>
            )}

            {error && !position && (
              <div className="flex flex-col items-center justify-center gap-3 bg-slate-800/60 rounded-2xl border border-red-500/20 p-10">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-2xl">⚠️</div>
                <p className="text-red-300 text-center max-w-md">{error}</p>
                <button
                  onClick={requestPosition}
                  className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition"
                >
                  Réessayer
                </button>
              </div>
            )}

            {position && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 rounded-xl border border-white/10 px-5 py-4">
                  <div className="space-y-1">
                    <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                      <span>✅</span>
                      Position trouvée ({position.latitude.toFixed(5)}, {position.longitude.toFixed(5)})
                    </p>
                    {position.accuracy ? (
                      <p className="text-white/45 text-xs">
                        Précision estimée : ±{Math.round(position.accuracy)} m
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={requestPosition}
                    disabled={loading}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition flex items-center gap-2 border border-white/10"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>↻</span>
                    )}
                    {loading ? 'Actualisation…' : 'Actualiser'}
                  </button>
                </div>
                <Map
                  userPosition={position}
                  height="420px"
                  zoom={15}
                  className="w-full"
                />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
