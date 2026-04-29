export const metadata = {
  title: 'Hors ligne — Green Express',
}

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>📶</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Vous êtes hors ligne</h1>
      <p style={{ maxWidth: 480, opacity: 0.8, marginBottom: 24 }}>
        Impossible de joindre Green Express. Vérifiez votre connexion Internet,
        puis réessayez. Vos commandes en cours restent enregistrées dès que vous
        êtes reconnecté.
      </p>
      <a
        href="/"
        style={{
          background: '#16a34a',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 10,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Réessayer
      </a>
    </main>
  )
}
