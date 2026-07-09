/**
 * Codespaces demo — start the public site and print the shareable URL.
 * Used by postStartCommand and: npm run demo:codespaces
 */
import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'

const PUBLIC_PORT = 5173

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.end()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
  })
}

function waitForPort(port, timeoutMs = 60000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = createConnection({ port, host: '127.0.0.1' }, () => {
        socket.end()
        resolve()
      })
      socket.on('error', () => {
        socket.destroy()
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`))
        } else {
          setTimeout(tryConnect, 500)
        }
      })
    }
    tryConnect()
  })
}

function publicDemoUrl() {
  const name = process.env.CODESPACE_NAME
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
  if (name && domain) {
    return `https://${name}-${PUBLIC_PORT}.${domain}`
  }
  return `http://localhost:${PUBLIC_PORT}`
}

async function startPublicDevServer() {
  if (await isPortOpen(PUBLIC_PORT)) {
    console.log(`Port ${PUBLIC_PORT} already in use — public dev server running`)
    return
  }

  const child = spawn('npm', ['run', 'dev'], {
    detached: true,
    stdio: 'ignore',
    shell: true,
    cwd: process.cwd(),
  })
  child.unref()
  console.log(`Starting public dev server on port ${PUBLIC_PORT} (pid ${child.pid})…`)
  await waitForPort(PUBLIC_PORT)
}

async function main() {
  console.log('\n=== Eagle Logistics — Codespaces demo ===\n')

  await startPublicDevServer()

  const url = publicDemoUrl()
  const inCodespaces = Boolean(process.env.CODESPACE_NAME)

  console.log('\nPublic site is ready.\n')
  console.log(`  Local:  http://localhost:${PUBLIC_PORT}`)
  if (inCodespaces) {
    console.log(`  Share:  ${url}`)
    console.log('\nTo send this link to your client:')
    console.log('  1. Open the Ports tab')
    console.log('  2. Find port 5173 (Public site)')
    console.log('  3. Set visibility to Public')
    console.log('  4. Copy the forwarded URL and send it\n')
  } else {
    console.log('\n(Set CODESPACE_NAME to print a shareable GitHub URL.)\n')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
