import { cpSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const source = join(root, 'content')
const target = join(root, 'public', 'content')

if (!existsSync(source)) {
  console.error('Missing /content directory at repo root.')
  process.exit(1)
}

if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true })
}

mkdirSync(join(root, 'public'), { recursive: true })
cpSync(source, target, { recursive: true })
console.log('Synced content/ -> public/content/')
