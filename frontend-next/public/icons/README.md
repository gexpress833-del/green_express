# Icônes PWA Green Express

Placez ici les icônes suivantes (générées depuis `public/Logo_gexpress.png`) :

| Fichier                    | Taille    | Usage                                |
|----------------------------|-----------|--------------------------------------|
| `icon-192.png`             | 192x192   | Manifest `purpose: any`              |
| `icon-512.png`             | 512x512   | Manifest `purpose: any` (splash)     |
| `icon-maskable-192.png`    | 192x192   | Manifest `purpose: maskable`         |
| `icon-maskable-512.png`    | 512x512   | Manifest `purpose: maskable`         |
| `apple-touch-icon.png`     | 180x180   | iOS Safari home screen               |
| `badge-72.png`             | 72x72     | Badge des notifications push (mono)  |

## Génération rapide

### Option 1 — En ligne (le plus simple)

1. https://realfavicongenerator.net/ ou https://maskable.app/editor
2. Uploadez `public/Logo_gexpress.png`
3. Téléchargez le pack et placez les fichiers ici.

### Option 2 — Avec sharp (Node)

```powershell
cd frontend-next
npm i -D sharp
node scripts/generate-pwa-icons.mjs
```

### Option 3 — Avec ImageMagick

```powershell
magick public/Logo_gexpress.png -resize 192x192 public/icons/icon-192.png
magick public/Logo_gexpress.png -resize 512x512 public/icons/icon-512.png
magick public/Logo_gexpress.png -resize 180x180 public/icons/apple-touch-icon.png
magick public/Logo_gexpress.png -resize 72x72   -colorspace Gray public/icons/badge-72.png
# Pour maskable : ajoutez 20% de padding (safe area) avant resize.
magick public/Logo_gexpress.png -resize 410x410 -background "#0b1f17" -gravity center -extent 512x512 public/icons/icon-maskable-512.png
magick public/Logo_gexpress.png -resize 154x154 -background "#0b1f17" -gravity center -extent 192x192 public/icons/icon-maskable-192.png
```

> **Important** : sans ces icônes, l'installation PWA fonctionne mais l'icône d'application sera celle par défaut du navigateur.
