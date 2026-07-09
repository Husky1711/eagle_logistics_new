/**
 * Generate clean courier logo PNGs for the partner grid.
 * Usage: node scripts/generate-courier-logos.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'assets', 'couriers')

const couriers = [
  { id: 'dtdc', name: 'DTDC', color: '#0047AB' },
  { id: 'delhivery', name: 'Delhivery', color: '#1A1A1A' },
  { id: 'bluedart', name: 'Blue Dart', color: '#005DAA' },
  { id: 'fedex', name: 'FedEx', color: '#4D148C' },
  { id: 'dhl', name: 'DHL', color: '#D40511' },
  { id: 'ekart', name: 'Ekart', color: '#2874F0' },
]

function logoSvg({ name, color }) {
  const fontSize = name.length > 8 ? 30 : 36
  return `<svg width="320" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff" rx="12"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${color}">${name}</text>
</svg>`
}

await mkdir(outDir, { recursive: true })

for (const courier of couriers) {
  const file = path.join(outDir, `${courier.id}.png`)
  await sharp(Buffer.from(logoSvg(courier))).png({ compressionLevel: 9 }).toFile(file)
  console.log(`Created ${file}`)
}

console.log('Courier logos generated.')
