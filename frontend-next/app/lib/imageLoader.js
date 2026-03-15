/**
 * Image loader for Next.js next/image component with Vercel.Blob CDN
 * @param {object} params - loader params { src, width, quality }
 * @returns {string} optimized image URL
 */
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
 * Get blob image URL with optional width optimization
 */
export function getBlobImageUrl(imageUrl, width = null) {
  if (!imageUrl) return '/images/placeholder.svg';

  try {
    const url = new URL(imageUrl);
    if (width) {
      url.searchParams.set('w', width);
      url.searchParams.set('q', 80);
    }
    return url.toString();
  } catch {
    return imageUrl;
  }
}
