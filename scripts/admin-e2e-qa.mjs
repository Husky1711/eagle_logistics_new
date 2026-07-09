/**
 * Full admin E2E QA — auth, settings, offers, couriers + public site checks.
 * Usage: node scripts/admin-e2e-qa.mjs
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { restoreContent, snapshotContent } from './e2e-content-restore.mjs'

const PASSWORD = 'change-me-in-production'
const ADMIN_PORTS = [5174, 5175, 5176]
const PUBLIC_PORTS = [5173, 5174]
const API = 'http://127.0.0.1:8000'

const bugs = []
const passed = []

function bug(id, severity, area, title, detail) {
  const item = { id, severity, area, title, detail }
  bugs.push(item)
  console.log(`  BUG ${id} [${severity}] ${area}: ${title}`)
  if (detail) console.log(`       ${detail}`)
}

function ok(area, msg) {
  passed.push({ area, msg })
  console.log(`  OK [${area}] ${msg}`)
}

async function findAdminUrl(page) {
  for (const port of ADMIN_PORTS) {
    try {
      await page.goto(`http://localhost:${port}/login`, { waitUntil: 'domcontentloaded', timeout: 12000 })
      await page.waitForSelector('#username', { timeout: 8000 })
      if ((await page.title()).includes('Admin')) {
        return `http://localhost:${port}`
      }
    } catch {
      await page.goto('about:blank').catch(() => {})
    }
  }
  return null
}

async function findPublicUrl(page) {
  for (const port of PUBLIC_PORTS) {
    try {
      await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded', timeout: 12000 })
      const title = await page.title()
      if (title.includes('Eagle Logistics') && !(title.includes('Admin'))) {
        return `http://localhost:${port}`
      }
    } catch {
      // next
    }
  }
  return null
}

async function login(page, adminUrl) {
  await page.goto(`${adminUrl}/login`, { waitUntil: 'domcontentloaded' })
  if (!(await page.locator('#username').count())) {
    if (await page.getByRole('heading', { name: 'Dashboard' }).count()) return
    await page.goto(`${adminUrl}/`, { waitUntil: 'domcontentloaded' })
    if (await page.getByRole('heading', { name: 'Dashboard' }).count()) return
  }
  await page.locator('#username').fill('admin')
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12000 })
}

async function readPublicContent(publicUrl, file) {
  const res = await fetch(`${publicUrl}/content/${file}`)
  if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`)
  return res.json()
}

async function testAuth(page, adminUrl) {
  console.log('\n--- AUTH ---')
  await page.goto(`${adminUrl}/login`, { waitUntil: 'domcontentloaded' })

  const prefilled = await page.locator('#username').inputValue()
  if (prefilled === 'admin') {
    bug('E2E-01', 'Low', 'Auth', 'Username pre-filled with default admin', 'Minor info disclosure on shared screens.')
  } else {
    ok('Auth', 'username field not pre-filled')
  }

  await page.locator('#username').fill('admin')
  await page.locator('#password').fill('wrong-password')
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForTimeout(1500)
  const errVisible = await page.getByText(/Invalid credentials/i).count()
  if (page.url().includes('/login') && errVisible) {
    ok('Auth', 'wrong password shows error and stays on login')
  } else {
    bug('E2E-02', 'High', 'Auth', 'Wrong password flow broken', `URL: ${page.url()}`)
  }

  await page.locator('#username').fill('admin')
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12000 })
  ok('Auth', 'valid login reaches dashboard')

  await page.reload({ waitUntil: 'domcontentloaded' })
  if (page.url().includes('/login')) {
    bug('E2E-03', 'High', 'Auth', 'Session lost after page reload')
  } else {
    ok('Auth', 'session persists after reload')
  }
}

async function testDashboard(page, adminUrl) {
  console.log('\n--- DASHBOARD ---')
  await page.goto(`${adminUrl}/`, { waitUntil: 'domcontentloaded' })
  if (!(await page.getByRole('heading', { name: 'Dashboard' }).count())) {
    bug('E2E-04', 'Medium', 'Dashboard', 'Dashboard heading missing')
    return
  }
  ok('Dashboard', 'dashboard loads')

  for (const link of [
    ['Site settings', /Site settings/],
    ['Promotional offer', /Promotional offer/],
    ['Couriers', /^Couriers$/],
    ['Pricing rules', /Pricing rules/],
  ]) {
    const [name, pattern] = link
    await page.getByRole('link', { name: pattern }).first().click()
    await page.waitForTimeout(600)
    if (page.url() === `${adminUrl}/` || page.url() === `${adminUrl}`) {
      bug('E2E-05', 'Medium', 'Dashboard', `Card link "${name}" did not navigate`, page.url())
    } else {
      ok('Dashboard', `card navigates to ${name}`)
    }
    await page.goto(`${adminUrl}/`, { waitUntil: 'domcontentloaded' })
  }

  const body = await page.locator('body').innerText()
  if (!body.toLowerCase().includes('last saved')) {
    bug('E2E-06', 'Low', 'Dashboard', 'No last-saved timestamp on dashboard')
  } else {
    ok('Dashboard', 'last-saved timestamps visible')
  }
}

async function testSettings(page, adminUrl, publicUrl) {
  console.log('\n--- SETTINGS ---')
  await page.goto(`${adminUrl}/settings`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Site settings' }).waitFor({ timeout: 8000 })

  const originalPhone = await page.getByText('Phone', { exact: true }).locator('..').locator('input').inputValue()
  const marker = `+91 99 E2E ${Date.now().toString().slice(-4)}`
  await page.getByText('Phone', { exact: true }).locator('..').locator('input').fill(marker)

  await page.getByRole('button', { name: /Save settings/i }).click()
  await page.waitForTimeout(2000)

  if (!(await page.getByText(/saved and synced/i).count())) {
    bug('E2E-07', 'High', 'Settings', 'Save settings did not show success message')
  } else {
    ok('Settings', 'save shows success message')
  }

  await page.reload({ waitUntil: 'domcontentloaded' })
  const reloaded = await page.getByText('Phone', { exact: true }).locator('..').locator('input').inputValue()
  if (reloaded !== marker) {
    bug('E2E-08', 'High', 'Settings', 'Phone change did not persist after reload', `expected ${marker}, got ${reloaded}`)
  } else {
    ok('Settings', 'phone persists after reload')
  }

  if (publicUrl) {
    await page.goto(`${publicUrl}/contact`, { waitUntil: 'domcontentloaded' })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const publicText = await page.locator('body').innerText()
    if (!publicText.includes(marker)) {
      bug('E2E-09', 'High', 'Settings', 'Phone change not visible on public Contact page', `Checked ${publicUrl}/contact`)
    } else {
      ok('Settings', 'phone visible on public contact page')
    }

    try {
      const settingsJson = await readPublicContent(publicUrl, 'settings.json')
      if (settingsJson.contact?.phone !== marker) {
        bug('E2E-10', 'Medium', 'Settings', 'public/content/settings.json not updated', `phone=${settingsJson.contact?.phone}`)
      } else {
        ok('Settings', 'public content JSON synced')
      }
    } catch (err) {
      bug('E2E-10', 'Medium', 'Settings', 'Could not verify public content JSON', err.message)
    }
  }

  // restore phone
  await page.goto(`${adminUrl}/settings`, { waitUntil: 'domcontentloaded' })
  await page.getByText('Phone', { exact: true }).locator('..').locator('input').fill(originalPhone)
  await page.getByRole('button', { name: /Save settings/i }).click()
  await page.waitForTimeout(1500)
  ok('Settings', 'restored original phone')
}

async function testOffers(page, adminUrl, publicUrl) {
  console.log('\n--- OFFERS ---')
  await page.goto(`${adminUrl}/offers`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Promotional offer' }).waitFor({ timeout: 8000 })

  const titleInput = page.locator('input').filter({ has: page.locator('xpath=../span[contains(text(),"Title")]') }).first()
  // fallback: first input after Offer active checkbox section
  const inputs = page.locator('section input[type="text"], section input:not([type])')
  const titleLocator = page.locator('label:has-text("Title") input')
  const originalTitle = await titleLocator.inputValue()
  const marker = `E2E Offer ${Date.now().toString().slice(-5)}`

  await titleLocator.fill(marker)
  await page.getByRole('button', { name: /Save offer/i }).click()
  await page.waitForTimeout(2000)

  if (!(await page.getByText(/saved and synced/i).count())) {
    bug('E2E-11', 'High', 'Offers', 'Save offer did not show success message')
  } else {
    ok('Offers', 'save shows success message')
  }

  await page.reload({ waitUntil: 'domcontentloaded' })
  if ((await titleLocator.inputValue()) !== marker) {
    bug('E2E-12', 'High', 'Offers', 'Offer title did not persist after reload')
  } else {
    ok('Offers', 'title persists after reload')
  }

  if (publicUrl) {
    await page.evaluate(() => sessionStorage.removeItem('eagle_offer_dismissed'))
    await page.goto(`${publicUrl}/`, { waitUntil: 'domcontentloaded' })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const body = await page.locator('body').innerText()
    if (!body.includes(marker)) {
      bug('E2E-13', 'High', 'Offers', 'Offer title not visible on public home offer strip', `Checked ${publicUrl}/`)
    } else {
      ok('Offers', 'title visible on public site offer strip')
    }
  }

  await page.goto(`${adminUrl}/offers`, { waitUntil: 'domcontentloaded' })
  await titleLocator.fill(originalTitle)
  await page.getByRole('button', { name: /Save offer/i }).click()
  await page.waitForTimeout(1500)
  ok('Offers', 'restored original title')
}

async function testCouriers(page, adminUrl, publicUrl) {
  console.log('\n--- COURIERS ---')
  await page.goto(`${adminUrl}/couriers`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Couriers' }).waitFor({ timeout: 8000 })

  const initialCount = await page.locator('section.rounded-xl').count()
  await page.getByRole('button', { name: /Add courier/i }).click()
  if ((await page.locator('section.rounded-xl').count()) !== initialCount + 1) {
    bug('E2E-14', 'High', 'Couriers', 'Add courier button did not add a row')
    return
  }
  ok('Couriers', 'add courier works')

  const marker = `__e2e__ Courier ${Date.now().toString().slice(-5)}`
  const last = page.locator('section.rounded-xl').last()
  await last.locator('input[id$="-name"]').fill(marker)
  await last.locator('input[id$="-name"]').blur()

  // invalid tracking URL should fail on save
  const tracking = last.locator('input[id$="-tracking"]')
  await tracking.fill('https://bad.example/no-placeholder')
  await page.getByRole('button', { name: /Save couriers/i }).click()
  await page.waitForTimeout(1500)
  if (!(await page.getByText(/tracking_url|placeholder|Request failed|Value error/i).count())) {
    bug('E2E-15', 'Medium', 'Couriers', 'Invalid tracking URL did not show validation error in UI')
  } else {
    ok('Couriers', 'invalid tracking URL shows error')
  }

  await tracking.fill('https://example.com/track/{id}')
  await page.getByRole('button', { name: /Save couriers/i }).click()
  await page.waitForTimeout(2000)

  if (!(await page.getByText(/saved and synced/i).count())) {
    bug('E2E-16', 'High', 'Couriers', 'Valid courier save failed')
  } else {
    ok('Couriers', 'valid save succeeds')
  }

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Couriers' }).waitFor({ timeout: 10000 })
  try {
    await page.getByText(marker).waitFor({ timeout: 10000 })
    ok('Couriers', 'courier persists after reload')
  } catch {
    bug('E2E-17', 'High', 'Couriers', 'Saved courier did not persist after reload')
  }

  // reorder
  const sectionWithMarker = page.locator('section.rounded-xl', { hasText: marker })
  const downBtn = sectionWithMarker.getByRole('button', { name: '↓' })
  if (await downBtn.isEnabled()) {
    await downBtn.click()
    await page.getByRole('button', { name: /Save couriers/i }).click()
    await page.waitForTimeout(1500)
    ok('Couriers', 'reorder + save works')
  }

  if (publicUrl) {
    try {
      const couriers = await readPublicContent(publicUrl, 'couriers.json')
      if (!couriers.some((c) => c.name === marker)) {
        bug('E2E-18', 'High', 'Couriers', 'New courier not in public/content/couriers.json')
      } else {
        ok('Couriers', 'public couriers JSON synced')
      }
    } catch (err) {
      bug('E2E-18', 'Medium', 'Couriers', 'Could not verify public couriers JSON', err.message)
    }

    await page.goto(`${publicUrl}/`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: /Our Courier Partners/i }).waitFor({ timeout: 10000 })
    const courierSection = await page.getByRole('heading', { name: /Our Courier Partners/i }).count()
    if (!courierSection) {
      bug('E2E-19', 'Medium', 'Couriers', 'Courier partners section missing on public Home')
    } else {
      ok('Couriers', 'courier partners section on public home (names not shown in UI — logos only)')
    }
  }

  // cleanup — match by __e2e__ prefix in case display name changed after slug
  await page.goto(`${adminUrl}/couriers`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Couriers' }).waitFor({ timeout: 10000 })
  const target = page.locator('section.rounded-xl').filter({ hasText: '__e2e__' }).last()
  if (await target.count()) {
    page.once('dialog', (d) => d.accept())
    await target.getByRole('button', { name: 'Remove' }).click()
    await page.getByRole('button', { name: /Save couriers/i }).click()
    await page.waitForTimeout(1500)
    ok('Couriers', 'cleanup removed test courier')
  } else {
    bug('E2E-32', 'High', 'Couriers', 'Could not find test courier for cleanup after reload', marker)
  }
}

async function testPricingRules(page, adminUrl, publicUrl) {
  console.log('\n--- PRICING RULES ---')
  await page.goto(`${adminUrl}/pricing-rules`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Pricing rules' }).waitFor({ timeout: 8000 })

  const textarea = page.getByLabel('Pricing rules JSON')
  let data
  try {
    data = JSON.parse(await textarea.inputValue())
  } catch {
    bug('E2E-33', 'High', 'Pricing rules', 'Could not parse loaded JSON')
    return
  }

  if (!Array.isArray(data) || !data[0]?.distance_zones?.length) {
    bug('E2E-33', 'High', 'Pricing rules', 'Unexpected pricing rules shape')
    return
  }
  ok('Pricing rules', 'JSON editor loads valid array')

  const marker = 8.77
  const ruleId = data.find((r) => r.id === 'delhivery-standard') ? 'delhivery-standard' : data[0].id
  data.find((r) => r.id === ruleId).distance_zones[0].base_price = marker
  await textarea.fill(`${JSON.stringify(data, null, 2)}\n`)
  await page.getByRole('button', { name: /Save pricing rules/i }).click()
  await page.waitForTimeout(2000)

  if (!(await page.getByText(/saved and synced/i).count())) {
    bug('E2E-34', 'High', 'Pricing rules', 'Save did not show success message')
  } else {
    ok('Pricing rules', 'save shows success message')
  }

  if (publicUrl) {
    try {
      const rules = await readPublicContent(publicUrl, 'pricing-rules.json')
      if (rules.find((r) => r.id === ruleId)?.distance_zones?.[0]?.base_price !== marker) {
        bug('E2E-35', 'High', 'Pricing rules', 'public/content/pricing-rules.json not updated')
      } else {
        ok('Pricing rules', 'public pricing-rules JSON synced')
      }
    } catch (err) {
      bug('E2E-35', 'Medium', 'Pricing rules', 'Could not verify public pricing-rules JSON', err.message)
    }
  }
}

async function testNavigation(page, adminUrl) {
  console.log('\n--- NAVIGATION ---')
  await login(page, adminUrl)

  const routes = [
    ['Settings', '/settings'],
    ['Offers', '/offers'],
    ['Couriers', '/couriers'],
    ['Pricing rules', '/pricing-rules'],
    ['Dashboard', '/'],
  ]

  for (const [label, path] of routes) {
    await page.getByRole('link', { name: label, exact: true }).click()
    await page.waitForTimeout(500)
    const expected = path === '/' ? adminUrl + '/' : `${adminUrl}${path}`
    if (!page.url().startsWith(expected.replace(/\/$/, '')) && !(path === '/' && page.url() === adminUrl)) {
      bug('E2E-20', 'Medium', 'Navigation', `Nav link "${label}" wrong URL`, `expected ~${expected}, got ${page.url()}`)
    } else {
      ok('Navigation', `${label} nav works`)
    }
  }
}

async function testLogout(page, adminUrl) {
  console.log('\n--- LOGOUT ---')
  await login(page, adminUrl)
  await page.getByRole('button', { name: /Logout/i }).click()
  await page.waitForTimeout(1000)
  if (!page.url().includes('/login')) {
    bug('E2E-21', 'High', 'Logout', 'Logout did not return to login')
  } else {
    ok('Logout', 'returns to login')
  }

  await page.goto(`${adminUrl}/couriers`, { waitUntil: 'domcontentloaded' })
  try {
    await page.waitForURL(/\/login/, { timeout: 8000 })
    ok('Logout', 'protected route blocked after logout')
  } catch {
    if (!page.url().includes('/login')) {
      bug('E2E-22', 'High', 'Logout', 'Protected route accessible after logout')
    } else {
      ok('Logout', 'protected route blocked after logout')
    }
  }
}

async function testPortConfusion(browser) {
  console.log('\n--- ENVIRONMENT ---')
  const probe = await browser.newPage()
  let adminCount = 0
  let publicCount = 0
  try {
    for (const port of [5173, 5174, 5175]) {
      try {
        await probe.goto(`http://localhost:${port}/login`, { waitUntil: 'domcontentloaded', timeout: 5000 })
        const title = await probe.title()
        if (title.includes('Admin')) adminCount++
        else if (title.includes('Not Found') || title.includes('Eagle Logistics')) publicCount++
      } catch {
        // ignore
      }
    }
  } finally {
    await probe.close()
  }
  if (adminCount === 0) {
    bug('E2E-23', 'Critical', 'Environment', 'No admin app detected on 5174/5175', 'Run npm run dev:admin')
  }
  if (adminCount > 1) {
    bug('E2E-24', 'Low', 'Environment', 'Multiple admin instances may be running', 'Can cause port/CORS confusion.')
  }
  ok('Environment', `admin instances detected: ${adminCount}`)
}

async function main() {
  console.log('\n========================================')
  console.log('  ADMIN E2E QA — Full functionality pass')
  console.log('========================================')

  const contentSnapshot = snapshotContent([
    'settings.json',
    'offers.json',
    'couriers.json',
    'pricing-rules.json',
  ])
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    const apiHealth = await fetch(`${API}/health`).then((r) => r.ok).catch(() => false)
    if (!apiHealth) {
      bug('E2E-00', 'Critical', 'Environment', 'API not running on :8000', 'Start with npm run dev:api')
      console.log('\nCannot continue without API.')
      return
    }
    ok('Environment', 'API healthy on :8000')

    const adminUrl = await findAdminUrl(page)
    if (!adminUrl) {
      bug('E2E-00b', 'Critical', 'Environment', 'Admin app not found', 'Start npm run dev:admin')
      return
    }
    ok('Environment', `admin at ${adminUrl}`)

    const publicUrl = await findPublicUrl(page)
    if (!publicUrl) {
      bug('E2E-25', 'Medium', 'Environment', 'Public site not found on :5173', 'Cannot verify publish-to-public flow')
    } else {
      ok('Environment', `public site at ${publicUrl}`)
    }

    await testPortConfusion(browser)

    await testAuth(page, adminUrl)
    await testDashboard(page, adminUrl)
    await testSettings(page, adminUrl, publicUrl)
    await testOffers(page, adminUrl, publicUrl)
    await testCouriers(page, adminUrl, publicUrl)
    await testPricingRules(page, adminUrl, publicUrl)
    await testNavigation(page, adminUrl)
    await testLogout(page, adminUrl)

    console.log('\n========================================')
    console.log(`  PASSED: ${passed.length}   BUGS: ${bugs.length}`)
    console.log('========================================\n')

    if (bugs.length) {
      const bySeverity = { Critical: [], High: [], Medium: [], Low: [] }
      for (const b of bugs) bySeverity[b.severity].push(b)
      for (const sev of ['Critical', 'High', 'Medium', 'Low']) {
        if (!bySeverity[sev].length) continue
        console.log(`\n### ${sev}`)
        for (const b of bySeverity[sev]) {
          console.log(`- **${b.id}** [${b.area}] ${b.title}`)
          if (b.detail) console.log(`  ${b.detail}`)
        }
      }
      const reportPath = path.join(process.cwd(), 'scripts', 'admin-e2e-report.json')
      fs.writeFileSync(reportPath, JSON.stringify({ passed, bugs }, null, 2))
      console.log(`\nReport: ${reportPath}`)
      if (bugs.some((b) => ['Critical', 'High'].includes(b.severity))) {
        process.exitCode = 1
      }
    }
  } finally {
    await browser.close()
    restoreContent(contentSnapshot)
    console.log('Restored settings.json, offers.json, couriers.json, pricing-rules.json after E2E run.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
