import './styles/globals.css'
import './styles/tailwind.css'
import './styles/theme.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toaster from './components/Toaster'
import Providers from './components/Providers'

export const metadata = {
  title: 'Green Express',
  description: 'Commandez vos repas, suivez vos livraisons et gérez votre abonnement Green Express en temps réel.',
  applicationName: 'Green Express',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Green Express',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#16a34a',
}

export default function RootLayout({ children }){
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className="app-bg" suppressHydrationWarning>
        <div className="grid-overlay"></div>
        <Providers>
          <Navbar />
          <div className="container">{children}</div>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
