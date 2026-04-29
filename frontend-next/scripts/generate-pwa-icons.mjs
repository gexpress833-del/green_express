// Génère les icônes PWA depuis public/Logo_gexpress.png
// Prérequis : npm i -D sharp
// Usage    : node scripts/generate-pwa-icons.mjs

import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
// Source logo (carrée idéalement). Priorité au nouveau logo s'il existe.
const candidates = [
  'public/icons/Logo_green_express@1x_1.png',
  'public/Logo_green_express.png',
  'public/Logo_gexpress.png',
]
const src = candidates.map((p) => resolve(root, p)).find((p) => existsSync(p))
if (!src) throw new Error('Aucun logo source trouvé')
console.log('Source:', src)
const outDir = resolve(root, 'public/icons')

// Fond blanc pour respecter le logo (qui est sur fond blanc).
// Pour les versions maskable, on utilise le vert de marque pour les zones tronquées.
const BG = '#ffffff'
const BG_MASKABLE = '#16a34a'

const tasks = [
  { name: 'icon-192.png',          size: 192, maskable: false },
  { name: 'icon-512.png',          size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true  },
  { name: 'icon-maskable-512.png', size: 512, maskable: true  },
  { name: 'apple-touch-icon.png',  size: 180, maskable: false },
  { name: 'badge-72.png',          size:  72, maskable: false, mono: true },
]

async function run() {
  await mkdir(outDir, { recursive: true })
  for (const t of tasks) {
    const out = resolve(outDir, t.name)
    let img = sharp(src).resize(t.size, t.size, { fit: 'contain', background: BG }).flatten({ background: BG })
    if (t.maskable) {
      // Safe area ~ 80% du canvas (padding 10% de chaque côté), fond vert marque
      const inner = Math.round(t.size * 0.8)
      img = sharp(src)
        .resize(inner, inner, { fit: 'contain', background: BG_MASKABLE })
        .extend({
          top: Math.floor((t.size - inner) / 2),
          bottom: Math.ceil((t.size - inner) / 2),
          left: Math.floor((t.size - inner) / 2),
          right: Math.ceil((t.size - inner) / 2),
          background: BG_MASKABLE,
        })
        .flatten({ background: BG_MASKABLE })
    }
    if (t.mono) img = img.grayscale()
    await img.png({ compressionLevel: 9 }).toFile(out)
    console.log('✓', t.name)
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
