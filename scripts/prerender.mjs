/**
 * Pre-render every public route into static HTML after `vite build`.
 *
 * Why: the app renders in the browser, so crawlers that don't run JS (Bing,
 * WhatsApp/Facebook/LinkedIn link previews) and Google's first pass all saw
 * the same empty shell. This writes real HTML (title, meta, JSON-LD, page
 * text) per route, which the client app then takes over.
 *
 * Output (served by public/.htaccess):
 *   /                      -> dist/index.html
 *   /services              -> dist/services.html
 *   /things-we-send/books  -> dist/things-we-send/books.html
 *   unknown URLs           -> dist/404.html (real 404 status)
 *
 * Routes come from dist/sitemap.xml so the two never drift apart.
 * Skip with PRERENDER=0.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import { chromium } from 'playwright'

if (process.env.PRERENDER === '0') {
  console.log('[prerender] skipped (PRERENDER=0)')
  process.exit(0)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const PORT = 4179

const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8')
const routes = [...sitemap.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map(
  (m) => m[1].replace(/\/+$/, '') || '/',
)
if (routes.length === 0) throw new Error('[prerender] no routes found in dist/sitemap.xml')

// Unknown path renders the NotFound page (noindex) for dist/404.html
const NOT_FOUND_ROUTE = '/__prerender-not-found__'

function outFile(route) {
  if (route === '/') return join(dist, 'index.html')
  if (route === NOT_FOUND_ROUTE) return join(dist, '404.html')
  return join(dist, `${route.slice(1)}.html`)
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

const server = await preview({
  root,
  logLevel: 'error',
  preview: { port: PORT, strictPort: true, open: false },
})
const browser = await chromium.launch()

// Write files only after crawling: the preview server falls back to dist/index.html,
// so overwriting it mid-run would leak the home page into later snapshots.
const outputs = []

try {
  // Reduced motion renders plain markup (no animation start states) in the snapshot
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } })

  for (const route of [...routes, NOT_FOUND_ROUTE]) {
    const page = await context.newPage()
    const content = {}
    page.on('response', async (res) => {
      const url = new URL(res.url())
      if (!url.pathname.includes('/content/') || !url.pathname.endsWith('.json') || !res.ok()) return
      try {
        content[url.pathname] = await res.json()
      } catch {
        /* ignore non-JSON */
      }
    })

    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('h1', { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => document.querySelector('link[rel="canonical"]'), null, { timeout: 15000 })
    // Seed only what this page renders (useContent records it); the rest are background prefetches
    const used = new Set(await page.evaluate(() => [...(window.__CONTENT_USED__ || [])]))
    for (const key of Object.keys(content)) {
      if (!used.has(key) && !key.endsWith('/settings.json')) delete content[key]
    }

    const { html, title, h1 } = await page.evaluate((seed) => {
      // Seed content so the client renders immediately instead of flashing a spinner
      const script = document.createElement('script')
      script.textContent = `window.__PRERENDER_CONTENT__=${seed}`
      const entry = document.querySelector('script[type="module"]')
      entry.parentNode.insertBefore(script, entry)
      return {
        html: '<!doctype html>\n' + document.documentElement.outerHTML,
        title: document.title,
        h1: document.querySelector('h1')?.textContent.trim(),
      }
    }, safeJson(content))

    outputs.push([outFile(route), html])
    console.log(`[prerender] ${route.padEnd(30)} ${title}  (h1: ${h1})`)
    await page.close()
  }
} finally {
  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))
}

for (const [file, html] of outputs) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}
console.log(`[prerender] wrote ${routes.length} pages + 404.html`)
