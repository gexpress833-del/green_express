/** @type {import('next').NextConfig} */
/** En dev, le navigateur doit appeler le même origine que la page (ex. :3000) pour /api et /sanctum.
 * Sinon les cookies XSRF / session sont posés par :8000 et ne sont pas lisibles via document.cookie sur :3000 → POST sans X-XSRF-TOKEN → 419. */
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_PROXY_TARGET || 'http://localhost:8000'

const nextConfig = {
  /** Masque le badge « N » / overlay en bas à gauche (uniquement en `next dev`). */
  devIndicators: process.env.NODE_ENV === 'development' ? false : undefined,
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost', '*.local'],
  /** Les navigateurs demandent souvent /favicon.ico alors que le projet n’a que public/favicon.svg */
  async rewrites() {
    const backend = API_PROXY_TARGET.replace(/\/$/, '')
    return [
      { source: '/favicon.ico', destination: '/favicon.svg' },
      // /api/* : proxy via app/api/[[...path]]/route.js (cookies + X-Forwarded-* pour Laravel)
      { source: '/storage/:path*', destination: `${backend}/storage/:path*` },
    ]
  },
  images: {
    loader: 'custom',
    loaderFile: './app/lib/imageLoader.js',
    domains: [
      'vercel.blob.greenexpress.app',
      'localhost',
      '127.0.0.1',
      'greenexpress.app',
      'res.cloudinary.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.blob.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  env: {
    // API_BASE should not include /api since paths in api.js already include it
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000',
    NEXT_PUBLIC_BLOB_BASE: process.env.NEXT_PUBLIC_BLOB_BASE || 'https://vercel.blob.greenexpress.app',
  },
};

module.exports = nextConfig;
