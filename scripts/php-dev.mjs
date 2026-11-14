/**
 * Local PHP API for development: serves public/ (so /api/*.php and /uploads)
 * on http://127.0.0.1:8080. `npm run dev` proxies /api and /uploads to it.
 *
 * Data goes to ./eagle-data (git-ignored). Feedback emails are written to
 * ./eagle-data/mail.log instead of being sent.
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const data = join(root, 'eagle-data')
mkdirSync(data, { recursive: true })

const php = process.env.PHP_BIN || 'php'
const child = spawn(php, ['-S', '127.0.0.1:8080', '-t', join(root, 'public')], {
  stdio: 'inherit',
  env: { ...process.env, EAGLE_DATA_DIR: data, EAGLE_MAIL_LOG: join(data, 'mail.log') },
})
child.on('error', (err) => {
  console.error(`Could not start PHP (${php}). Install PHP 7.4+ or set PHP_BIN.\n`, err.message)
  process.exit(1)
})
child.on('exit', (code) => process.exit(code ?? 0))
