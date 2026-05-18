export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer footer-modern">
      <div className="container">
        <p className="footer-modern__legal">
          © {year} Green Express — Tous droits réservés.
        </p>
        <p className="footer-modern__tagline">Livraison de repas à Kolwezi, RDC</p>
      </div>
    </footer>
  )
}
