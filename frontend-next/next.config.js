/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Masque le badge « N » / overlay en bas à gauche (uniquement en `next dev`). */
  devIndicators: false,
  reactStrictMode: true,
  /** Les navigateurs demandent souvent /favicon.ico alors que le projet n’a que public/favicon.svg */
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/favicon.svg' }]
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
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000',
    NEXT_PUBLIC_BLOB_BASE: process.env.NEXT_PUBLIC_BLOB_BASE || 'https://vercel.blob.greenexpress.app',
  },
};

module.exports = nextConfig;
