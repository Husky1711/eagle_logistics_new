/**
 * Full Project 1 sign-off: sync, unit tests, production build, preview + browser QA.
 * Usage: npm run verify
 */
import { spawn } from 'node:child_process'
import { execSync } from 'node:child_process'
import { createConnection, createServer } from 'node:net'

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { stdio: 'inherit', ...opts })
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

function waitForPort(port, timeoutMs = 30000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = createConnection({ port, host: '127.0.0.1' }, () => {
        socket.end()
        resolve()
      })
      socket.on('error', () => {
        socket.destroy()
        if (Date.now() - start > timeoutMs) reject(new Error(`Port ${port} not ready in time`))
        else setTimeout(tryConnect, 400)
      })
    }
    tryConnect()
  })
}

function startPreview(port) {
  return spawn(
    `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    { shell: true, stdio: 'pipe' },
  )
}

async function main() {
  console.log('=== Eagle Logistics Project 1 verify ===\n')
  run('npm run sync:content')
  run('npm test')
  run('npm run build')

  const port = await getAvailablePort()
  const previewUrl = `http://127.0.0.1:${port}`
  const preview = startPreview(port)

  try {
    await waitForPort(port)
    console.log(`\nPreview ready at ${previewUrl}`)
    run('node scripts/browser-qa.mjs', {
      env: { ...process.env, QA_BASE_URL: previewUrl },
    })
    console.log('\n=== Verify passed ===')
  } finally {
    preview.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
