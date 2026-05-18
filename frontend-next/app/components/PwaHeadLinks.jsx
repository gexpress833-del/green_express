/**
 * Balises PWA explicites pour iOS Safari (complète les metadata Next.js).
 * https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
 */
export default function PwaHeadLinks() {
  return (
    <>
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
      <link rel="apple-touch-icon-precomposed" href="/icons/apple-touch-icon.png" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Green Express" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </>
  )
}
