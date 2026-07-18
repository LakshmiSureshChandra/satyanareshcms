// One-off generator for PWA/app icons — run with `node scripts/generate-pwa-icons.mjs`.
// Re-run only if the brand mark changes; outputs are committed static files.
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'

const CRIMSON = '#8e1f22'
const GOLD = '#a8863d'

const OUT = path.resolve(import.meta.dirname, '../apps/web/public/icons')
fs.mkdirSync(OUT, { recursive: true })

// square monogram, safe-area padded so it also works as a maskable icon
function svg(size, { padded = false } = {}) {
  const pad = padded ? size * 0.18 : 0
  const inner = size - pad * 2
  const fontSize = inner * 0.46
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${CRIMSON}"/>
      <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle"
        font-family="Georgia, 'Times New Roman', serif" font-weight="700"
        font-size="${fontSize}" fill="${GOLD}">AK</text>
    </svg>`
}

const targets = [
  { file: 'icon-192.png', size: 192, padded: false },
  { file: 'icon-512.png', size: 512, padded: false },
  { file: 'icon-512-maskable.png', size: 512, padded: true },
]

for (const t of targets) {
  await sharp(Buffer.from(svg(t.size, t))).png().toFile(path.join(OUT, t.file))
  console.log('wrote', t.file)
}

// app-router file convention icons (auto-linked by Next, no manual <link> tags needed)
await sharp(Buffer.from(svg(512))).png().toFile(path.resolve(import.meta.dirname, '../apps/web/src/app/icon.png'))
await sharp(Buffer.from(svg(180))).png().toFile(path.resolve(import.meta.dirname, '../apps/web/src/app/apple-icon.png'))
console.log('wrote app/icon.png, app/apple-icon.png')
