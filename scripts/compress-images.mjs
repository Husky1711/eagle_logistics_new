import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.join(__dirname, '..', 'public', 'assets')

const MAX_WIDTH = 1920
const JPEG_QUALITY = 82

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

async function compressFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return

  const before = (await stat(filePath)).size
  const image = sharp(filePath)
  const meta = await image.metadata()

  let pipeline = image
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  }

  if (ext === '.png') {
    await pipeline.png({ compressionLevel: 9, palette: true }).toFile(filePath + '.tmp')
  } else {
    await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(filePath + '.tmp')
  }

  const { rename, unlink } = await import('fs/promises')
  await unlink(filePath)
  await rename(filePath + '.tmp', filePath)

  const after = (await stat(filePath)).size
  const saved = ((1 - after / before) * 100).toFixed(1)
  console.log(`${path.relative(assetsDir, filePath)}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (${saved}% smaller)`)
}

const files = await walk(assetsDir)
for (const file of files) {
  await compressFile(file)
}
console.log('Asset compression complete.')
