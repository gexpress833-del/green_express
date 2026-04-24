/**
 * Image loader for Next.js next/image component with Vercel.Blob CDN
 * @param {object} params - loader params { src, width, quality }
 * @returns {string} optimized image URL
 */
import { API_BASE } from './apiBase';

export default function imageLoader({ src, width, quality }) {
  // If src is already a full URL (from Vercel.Blob), use it directly
  if (src.startsWith('http://') || src.startsWith('https://')) {
    const url = new URL(src);
    url.searchParams.set('w', width);
    url.searchParams.set('q', quality || 75);
    return url.toString();
  }

  // For local/placeholder images
  return src;
}

/**
 * URL absolue pour afficher une ressource hébergée sur l’API (storage, uploads, etc.)
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.startsWith('//')) return `https:${t}`;
  // Fichiers servis par Next (dossier public/) — ne pas préfixer l’API Laravel
  if (t.startsWith('/images/')) return t;
  if (t.startsWith('/video/') || t.startsWith('/videos/')) return t;
  // Fichier à la racine de public : logo.png, favicon.svg, etc.
  if (/^\/[^/]+\.(png|jpg|jpeg|webp|svg|gif|ico|mp4|webm)$/i.test(t)) return t;
  if (/^\/(favicon|logo)/i.test(t)) return t;
  if (t.startsWith('/')) return `${API_BASE}${t}`;
  return `${API_BASE}/${t}`;
}

/**
 * Get blob image URL with optional width optimization
 */
export function getBlobImageUrl(imageUrl, width = null) {
  if (!imageUrl) return '/images/placeholder.svg';

  const absolute = resolveMediaUrl(imageUrl);
  if (!absolute) return '/images/placeholder.svg';

  if (absolute.startsWith('/images/')) return absolute;

  try {
    const url = new URL(absolute);
    if (width) {
      url.searchParams.set('w', width);
      url.searchParams.set('q', 80);
    }
    return url.toString();
  } catch {
    return absolute;
  }
}
