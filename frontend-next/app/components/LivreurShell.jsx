'use client'

import { useEffect } from 'react'
import LivreurSidebar from '@/components/LivreurSidebar'

export default function LivreurShell({ title, subtitle, children }) {
  useEffect(() => {
    document.body.classList.add('has-livreur-bottom-nav')
    return () => document.body.classList.remove('has-livreur-bottom-nav')
  }, [])

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white livreur-section">
      <a href="#livreur-main" className="livreur-skip-link">Aller au contenu principal</a>
      <div className="container livreur-container">
        <header className="livreur-header">
          <h1 className="livreur-title">{title}</h1>
          {subtitle ? <p className="livreur-subtitle">{subtitle}</p> : null}
        </header>
        <div className="dashboard-grid livreur-dashboard">
          <LivreurSidebar />
          <main id="livreur-main" tabIndex={-1} className="main-panel outline-none">{children}</main>
        </div>
      </div>
    </section>
  )
}

