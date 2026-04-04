'use client'

import LivreurSidebar from '@/components/LivreurSidebar'

export default function LivreurShell({ title, subtitle, children }) {
  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <a href="#livreur-main" className="skip-link">Aller au contenu principal</a>
      <div className="container">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ background: 'linear-gradient(135deg, #ff1493 0%, #ff00ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{title}</h1>
          {subtitle ? <p className="mt-2 text-white/70 text-base md:text-lg max-w-2xl">{subtitle}</p> : null}
        </header>
        <div className="dashboard-grid">
          <LivreurSidebar />
          <main id="livreur-main" tabIndex={-1} className="main-panel outline-none">{children}</main>
        </div>
      </div>
    </section>
  )
}

