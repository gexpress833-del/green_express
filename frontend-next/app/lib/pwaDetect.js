/** Appareil iOS (iPhone, iPad, iPod) y compris iPadOS « Macintosh » + touch. */
export function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** Safari iOS (installation « Sur l'écran d'accueil »). Exclut Chrome/Firefox/Edge iOS. */
export function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  if (!isIosDevice()) return false
  const ua = navigator.userAgent
  return /safari/i.test(ua) && !/crios|fxios|edgios|opr\//i.test(ua)
}

/** Déjà lancé en mode PWA (écran d'accueil). */
export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  )
}
