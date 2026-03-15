import './styles/globals.css'
import './styles/theme.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toaster from './components/Toaster'
import Providers from './components/Providers'

export const metadata = {
  title: 'Green Express',
  description: 'Food ordering system',
}

export default function RootLayout({ children }){
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className="app-bg">
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
