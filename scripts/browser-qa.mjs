/**
 * Browser QA — run against dev (5173) or preview (4173) server.
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
  { path: '/pricing', name: 'pricing', expect: /Price Calculator|Parcel|Get Rates/i },
  { path: '/tracking', name: 'tracking', expect: /Shipment Tracker|Track|DHL|FedEx|UPS/i },
  { path: '/offers', name: 'offers', expect: /Special Offers|offer|EAGLE/i },
  { path: '/about', name: 'about', expect: /About|Eagle/i },
  { path: '/contact', name: 'contact', expect: /Contact Us|Address|WhatsApp/i },
  { path: '/privacy', name: 'privacy', expect: /Privacy/i },
  { path: '/terms', name: 'terms', expect: /Terms/i },
  { path: '/missing-page', name: '404', expect: /not found|404/i },
]

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
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

async function checkRoute(page, route, label) {
  await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(250)

  const bodyText = await page.locator('body').innerText()
  if (!route.expect.test(bodyText)) {
    fail(`${label}: expected content matching ${route.expect}`)
  } else {
    pass(`${label}: page content loaded`)
  }

  if ((await page.locator('header').count()) === 0) fail(`${label}: missing header`)
  else pass(`${label}: header present`)

  if ((await page.locator('footer').count()) === 0) fail(`${label}: missing footer`)
  else pass(`${label}: footer present`)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
  if (overflow) fail(`${label}: horizontal overflow`)
  else pass(`${label}: no horizontal overflow`)
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

  console.log(`\n=== Desktop QA 1440px (${BASE}) ===\n`)
  await page.setViewportSize({ width: 1440, height: 900 })

  for (const route of routes) {
    consoleErrors.length = 0
    await checkRoute(page, route, route.name)

    if (consoleErrors.length) {
      fail(`${route.name}: console errors — ${consoleErrors.join('; ')}`)
    } else {
      pass(`${route.name}: no console errors`)
    }

    await page.screenshot({ path: path.join(OUT, `desktop-${route.name}.png`), fullPage: true })
  }

  // Courier logos on home
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const courierImages = page.locator('img[alt="DTDC"], img[alt="Delhivery"], img[alt="Blue Dart"]')
  if ((await courierImages.count()) < 3) fail('home: courier logo images missing')
  else pass('home: courier partner logos visible')

  // Contact map embed
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  const mapFrame = page.locator('iframe[title*="Eagle"], iframe[title*="location"], iframe[src*="maps"]')
  if ((await mapFrame.count()) === 0) fail('contact: Google Maps embed missing')
  else pass('contact: Google Maps embed present')

  // Pricing calculator
  await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle' })
  await page.getByLabel(/Weight/i).fill('2')
  await page.getByLabel(/Distance/i).fill('100')
  await page.getByRole('button', { name: /Calculate/i }).click()
  await page.waitForTimeout(500)
  if ((await page.locator('text=Best Options').count()) === 0) fail('pricing: calculator did not show results')
  else pass('pricing: calculator shows results for 2kg / 100km')

  // Services tabs
  await page.goto(`${BASE}/services`, { waitUntil: 'networkidle' })
  const tabs = page.getByRole('tab')
  if ((await tabs.count()) < 2) fail('services: expected multiple tabs')
  else {
    await tabs.nth(1).click()
    if ((await tabs.nth(1).getAttribute('aria-selected')) !== 'true') fail('services: tab aria-selected not updated')
    else pass('services: tab switching works')
  }

  // Header nav
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Pricing', exact: true }).first().click()
  await page.waitForURL('**/pricing')
  if (!page.url().includes('/pricing')) fail('nav: Pricing link broken')
  else pass('nav: Pricing link works')

  for (const vp of viewports) {
    console.log(`\n=== ${vp.name} QA (${vp.width}px) ===\n`)
    await page.setViewportSize({ width: vp.width, height: vp.height })
    for (const route of routes) {
      await checkRoute(page, route, `${route.name} ${vp.name}`)
      await page.screenshot({ path: path.join(OUT, `${vp.name}-${route.name}.png`), fullPage: true })
    }

    if (vp.name === 'mobile') {
      await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
      const menuBtn = page.getByRole('button', { name: /Open menu/i })
      if ((await menuBtn.count()) > 0) {
        await menuBtn.click()
        if ((await page.getByRole('navigation', { name: /Mobile/i }).count()) === 0) {
          fail('contact mobile: menu did not open')
        } else {
          pass('contact mobile: hamburger menu opens')
        }
      }
    }
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
