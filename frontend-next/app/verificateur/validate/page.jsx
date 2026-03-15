"use client"
import VerificateurSidebar from '@/components/VerificateurSidebar'
import { useState } from 'react'
import { apiRequest } from '@/lib/api'
import GoldButton from '@/components/GoldButton'

export default function VerificateurValidate(){
  const [ticketCode, setTicketCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState(null)

  function handleValidate(){
    if (!ticketCode.trim()) {
      setResult({ success: false, message: 'Veuillez saisir un code de ticket' })
      return
    }

    setValidating(true)
    setResult(null)

    apiRequest('/api/verificateur/validate-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_code: ticketCode.trim() })
    })
      .then(response => {
        const success = response.valid || false
        let message = response.message || (success ? 'Ticket validé avec succès' : '')
        if (success && response.claim) {
          const c = response.claim
          if (c.ticket_code || c.promotion) {
            message = `${message} — Ticket ${c.ticket_code || ''}${c.promotion ? ` · ${c.promotion}` : ''}`
          }
        }
        setResult({ success, message })
        if (success) setTicketCode('')
      })
      .catch(err => {
        setResult({ 
          success: false, 
          message: err.message || 'Erreur lors de la validation du ticket' 
        })
      })
      .finally(() => {
        setValidating(false)
      })
  }

  return (
    <section className="page-section min-h-screen">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #0096ff 0%, #00ffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Valider un ticket de promotion
          </h1>
          <p className="text-white/70 text-lg">Saisissez le code du ticket généré par le client pour réclamer une promotion</p>
        </header>

        <div className="dashboard-grid">
          <VerificateurSidebar />
          <main className="main-panel">
            <div className="max-w-2xl mx-auto">
              <div className="card">
                <h3 className="text-xl font-semibold mb-4" style={{
                  background: 'linear-gradient(135deg, #0096ff 0%, #00ffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  🔍 Validation de ticket
                </h3>

                <div className="mb-6">
                  <label className="block text-white/80 mb-2 font-semibold">
                    Code du ticket de promotion
                  </label>
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={(e) => {
                      setTicketCode(e.target.value)
                      setResult(null)
                    }}
                    placeholder="Entrez le code du ticket..."
                    className="w-full"
                    style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                  />
                  <p className="text-white/50 text-xs mt-2">
                    Le client génère ce ticket lorsqu'il réclame une promotion avec ses points
                  </p>
                </div>

                {result && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    result.success 
                      ? 'bg-green-500/20 border border-green-500/50' 
                      : 'bg-red-500/20 border border-red-500/50'
                  }`}>
                    <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                      {result.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <GoldButton 
                    onClick={handleValidate}
                    disabled={validating || !ticketCode.trim()}
                  >
                    {validating ? 'Validation...' : 'Valider le ticket'}
                  </GoldButton>
                </div>

                <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-white/70 text-sm">
                    <strong>Code ticket :</strong> Le client reçoit un code type <span className="font-mono text-cyan-400">GXT-XXXXXXXX</span> après avoir réclamé une promotion. Saisissez ce code ici pour valider l&apos;utilisation de l&apos;offre.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}
