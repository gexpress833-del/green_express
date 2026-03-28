import Link from 'next/link'

/*
  Header unifié pour les sous-pages client.
  Utilise les classes CSS .mobile-only / .desktop-only (définis dans globals.css)
  car Tailwind n'est pas installé dans ce projet.

  Props :
    title        – titre de la page
    subtitle     – sous-titre optionnel
    icon         – emoji optionnel
    desktopExtra – contenu JSX supplémentaire (desktop uniquement)
    backHref     – lien retour (défaut : /client)
*/
export default function ClientSubpageHeader({
  title,
  subtitle,
  icon,
  desktopExtra = null,
  backHref = '/client',
}) {
  return (
    <>
      {/* MOBILE uniquement (< 640px) */}
      <div className="mobile-only" style={{ paddingBottom: 20 }}>

        <div style={{ marginBottom: 18 }}>
          <Link href={backHref} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.13)',
            color: 'rgba(255,255,255,0.72)',
            textDecoration: 'none', fontSize: 13, fontWeight: 600,
            WebkitTapHighlightColor: 'transparent',
          }}>
            ← Tableau de bord
          </Link>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.375rem, 5.5vw, 1.875rem)',
          fontWeight: 800, margin: '0 0 6px', lineHeight: 1.25,
          letterSpacing: '-0.01em',
          background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {icon} {title}
        </h1>

        {subtitle && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', margin: 0, lineHeight: 1.55 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* DESKTOP uniquement (>= 640px) */}
      <div className="desktop-only">

        <Link href={backHref} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)',
          textDecoration: 'none', fontSize: 13, fontWeight: 600,
          marginBottom: 24,
        }}>
          ← Tableau de bord
        </Link>

        <header className="mb-8 fade-in">
          <h1 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            fontWeight: 800, margin: '0 0 8px',
            background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {icon} {title}
          </h1>
          {subtitle && (
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', margin: 0, maxWidth: '640px', lineHeight: 1.6 }}>
              {subtitle}
            </p>
          )}
          {desktopExtra}
        </header>
      </div>
    </>
  )
}
