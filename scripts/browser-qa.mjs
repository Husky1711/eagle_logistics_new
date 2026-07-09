/**
 * One-off browser QA — run while `npm run dev` is up on :5173
 * Usage: node scripts/browser-qa.mjs
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.QA_BASE_URL || 'http://localhost:5173'
const OUT = path.join(process.cwd(), 'qa-screenshots')

const routes = [
  { path: '/', name: 'home', expect: /Eagle|Logistics|Calculate/i },
  { path: '/services', name: 'services', expect: /Services|Domestic/i },
  { path: '/pricing', name: 'pricing', expect: /Pricing|Parcel|Calculate/i },
  { path: '/tracking', name: 'tracking', expect: /Track|Tracking/i },
  { path: '/about', name: 'about', expect: /About|Eagle/i },
  { path: '/contact', name: 'contact', expect: /Contact|Address|WhatsApp/i },
  { path: '/privacy', name: 'privacy', expect: /Privacy/i },
  { path: '/terms', name: 'terms', expect: /Terms/i },
  { path: '/missing-page', name: '404', expect: /not found|404/i },
]

const issues = []
const passes = []

function fail(msg) {
  issues.push(msg)
  console.log(`  FAIL: ${msg}`)
}

function pass(msg) {
  passes.push(msg)
  console.log(`  OK: ${msg}`)
}

async function run() {
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  console.log(`\n=== Desktop QA (${BASE}) ===\n`)

  for (const route of routes) {
    consoleErrors.length = 0
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)

    const bodyText = await page.locator('body').innerText()
    if (!route.expect.test(bodyText)) {
      fail(`${route.name}: expected content matching ${route.expect}`)
    } else {
      pass(`${route.name}: page content loaded`)
    }

    const header = page.locator('header')
    if ((await header.count()) === 0) fail(`${route.name}: missing header`)
    else pass(`${route.name}: header present`)

    const footer = page.locator('footer')
    if ((await footer.count()) === 0) fail(`${route.name}: missing footer`)
    else pass(`${route.name}: footer present`)

    if (consoleErrors.length) {
      fail(`${route.name}: console errors — ${consoleErrors.join('; ')}`)
    } else {
      pass(`${route.name}: no console errors`)
    }

    await page.screenshot({ path: path.join(OUT, `desktop-${route.name}.png`), fullPage: true })
  }

  // Pricing calculator interaction
  await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle' })
  await page.getByLabel(/Weight/i).fill('2')
  await page.getByLabel(/Distance/i).fill('100')
  await page.getByRole('button', { name: /Calculate/i }).click()
  await page.waitForTimeout(500)
  const results = page.locator('text=Best Options')
  if ((await results.count()) === 0) fail('pricing: calculator did not show results')
  else pass('pricing: calculator shows results for 2kg / 100km')

  // Services tabs
  await page.goto(`${BASE}/services`, { waitUntil: 'networkidle' })
  const tabs = page.getByRole('tab')
  const tabCount = await tabs.count()
  if (tabCount < 2) fail('services: expected multiple tabs')
  else {
    await tabs.nth(1).click()
    await page.waitForTimeout(200)
    const selected = await tabs.nth(1).getAttribute('aria-selected')
    if (selected !== 'true') fail('services: tab aria-selected not updated')
    else pass('services: tab switching works')
  }

  // Header nav links
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Pricing', exact: true }).first().click()
  await page.waitForURL('**/pricing')
  if (!page.url().includes('/pricing')) fail('nav: Pricing link broken')
  else pass('nav: Pricing link works')

  // Mobile viewport
  console.log('\n=== Mobile QA (375px) ===\n')
  await page.setViewportSize({ width: 375, height: 812 })
  for (const route of routes.slice(0, 5)) {
    consoleErrors.length = 0
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
    if (overflow) fail(`${route.name} mobile: horizontal overflow`)
    else pass(`${route.name} mobile: no horizontal overflow`)
    await page.screenshot({ path: path.join(OUT, `mobile-${route.name}.png`), fullPage: true })
  }

  // Contact: open mobile menu check
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  const menuBtn = page.getByRole('button', { name: /Open menu/i })
  if ((await menuBtn.count()) > 0) {
    await menuBtn.click()
    const mobileNav = page.getByRole('navigation', { name: /Mobile/i })
    if ((await mobileNav.count()) === 0) fail('contact mobile: menu did not open')
    else pass('contact mobile: hamburger menu opens')
  }

  await browser.close()

  console.log(`\n=== Summary ===`)
  console.log(`Passed: ${passes.length}`)
  console.log(`Failed: ${issues.length}`)
  if (issues.length) {
    console.log('\nIssues:')
    issues.forEach((i) => console.log(` - ${i}`))
    process.exit(1)
  }
  console.log(`\nScreenshots saved to ${OUT}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
