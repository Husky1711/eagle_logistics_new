/**
 * Start the public Vite dev server in the background (Codespaces postStart).
 * Skips if port 5173 is already in use.
 */
import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.end()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
  })
}

const port = 5173

if (await isPortOpen(port)) {
  console.log(`Port ${port} already in use — dev server not started`)
  process.exit(0)
}

const child = spawn('npm', ['run', 'dev'], {
  detached: true,
  stdio: 'ignore',
  shell: true,
})
child.unref()
console.log(`Public dev server starting on port ${port} (pid ${child.pid})`)
