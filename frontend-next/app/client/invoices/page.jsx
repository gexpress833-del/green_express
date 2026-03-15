"use client"
import ClientSidebar from '@/components/ClientSidebar'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/helpers'
import GoldButton from '@/components/GoldButton'

export default function ClientInvoices(){
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/invoices', { method:'GET' })
      .then(r => {
        setInvoices(Array.isArray(r) ? r : [])
        setLoading(false)
      })
      .catch(() => {
        setInvoices([])
        setLoading(false)
      })
  }, [])

  return (
    <ReadOnlyGuard allowedActions={['view', 'read']} showWarning={false}>
      <section className="page-section min-h-screen">
        <div className="container">
          <header className="mb-8 fade-in">
            <h1 className="text-4xl font-extrabold mb-2" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 40px rgba(0, 255, 255, 0.5)'
            }}>
              Mes factures
            </h1>
            <p className="text-white/70 text-lg">Consultez et téléchargez vos factures</p>
          </header>

          <div className="dashboard-grid">
            <ClientSidebar />
            <main className="main-panel">
              {loading ? (
                <div className="card text-center">
                  <p className="text-white/60">Chargement...</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="card text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-white/60 text-lg">Aucune facture disponible.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map(i => (
                    <div key={i.id} className="card fade-in">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-1" style={{ 
                            background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>
                            Facture #{i.id}
                          </h3>
                          <p className="text-white/60 text-sm">
                            {formatDate(i.created_at || i.date)}
                          </p>
                        </div>
                        {i.amount && (
                          <p className="text-white/80 font-semibold">
                            {formatCurrency(i.amount)}
                          </p>
                        )}
                      </div>
                      {i.pdf_url && (
                        <a 
                          href={i.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="gold"
                          style={{ display: 'inline-block', textDecoration: 'none' }}
                        >
                          📥 Télécharger le PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
