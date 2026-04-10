/**
 * Médias landing — fichiers dans `frontend-next/public/`
 *
 * Logo : placez par ex. `public/logo.png` ou `public/Logo_gexpress.png`
 * Vidéo : placez par ex. `public/video/landing.mp4` (dossier **video** à la racine de public)
 */

/** Ordre de tentative pour <img onError> : aligné sur les fichiers réels dans public/ */
export const LOGO_CANDIDATES = [
  '/Logo_gexpress.png',
  '/logo.png',
  '/logo.jpg',
  '/Logo_gexpress.jpg',
  '/favicon.svg',
]

export const PRIMARY_LOGO = LOGO_CANDIDATES[0]

/**
 * Passe au candidat suivant si l’image a échoué à charger
 */
export function nextLogoSrc(prev) {
  const i = LOGO_CANDIDATES.indexOf(prev)
  if (i >= 0 && i < LOGO_CANDIDATES.length - 1) {
    return LOGO_CANDIDATES[i + 1]
  }
  return prev
}

/** Sources MP4 locales (ordre = première disponible pour le navigateur) */
export const VIDEO_SOURCES_MP4 = [
  '/video/greenexpress.mp4',
  '/video/landing.mp4',
  '/videos/landing.mp4',
  '/video/hero.mp4',
]

export const DEMO_LANDING_VIDEO_MP4 =
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
