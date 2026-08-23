/**
 * Home page admin → public E2E (H0 + H1 + H2).
 * Usage: node scripts/home-page-e2e-qa.mjs [--headless]
 */
import { chromium } from 'playwright'
import { restoreContent, snapshotContent } from './e2e-content-restore.mjs'

const PASSWORD = 'change-me-in-production'
const ADMIN_PORTS = [5174, 5175, 5176]
const PUBLIC_PORTS = [5173, 5174]
const API = 'http://127.0.0.1:8000'
const headless = process.argv.includes('--headless')

const passed = []
const failed = []

function ok(area, msg) {
  passed.push({ area, msg })
  console.log(`  OK [${area}] ${msg}`)
}

function fail(area, msg, detail = '') {
  failed.push({ area, msg, detail })
  console.log(`  FAIL [${area}] ${msg}`)
  if (detail) console.log(`       ${detail}`)
}

async function findAdminUrl(page) {
  for (const port of ADMIN_PORTS) {
    try {
      await page.goto(`http://127.0.0.1:${port}/login`, { waitUntil: 'domcontentloaded', timeout: 12000 })
      await page.waitForSelector('#username', { timeout: 8000 })
      if ((await page.title()).includes('Admin')) return `http://127.0.0.1:${port}`
    } catch {
      await page.goto('about:blank').catch(() => {})
    }
  }
  return null
}

async function findPublicUrl(page) {
  for (const port of PUBLIC_PORTS) {
    try {
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 12000 })
      const title = await page.title()
      if (title.includes('Eagle Logistics') && !title.includes('Admin')) {
        return `http://127.0.0.1:${port}`
      }
    } catch {
      // next
    }
  }
  return null
}

async function login(page, adminUrl) {
  await page.goto(`${adminUrl}/login`, { waitUntil: 'domcontentloaded' })
  if (await page.getByRole('heading', { name: 'Dashboard' }).count()) return
  await page.locator('#username').fill('admin')
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12000 })
}

async function readPublicJson(publicUrl, file) {
  const res = await fetch(`${publicUrl}/content/${file}`)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  return res.json()
}

async function testApiHealth() {
  console.log('\n--- API ---')
  try {
    const health = await fetch(`${API}/health`)
    if (health.ok) ok('API', '/health returns 200')
    else fail('API', '/health failed', String(health.status))

    const home = await fetch(`${API}/api/admin/pages/home`)
    if (home.status === 401) ok('API', '/api/admin/pages/home exists (401 without auth)')
    else if (home.status === 404) fail('API', '/api/admin/pages/home missing — stale API process?', 'Restart dev:all')
    else fail('API', `unexpected status for home route: ${home.status}`)
  } catch (err) {
    fail('API', 'API not reachable', err.message)
  }
}

async function testHomePageEditor(page, adminUrl, publicUrl) {
  console.log('\n--- HOME PAGE ADMIN ---')
  const stamp = Date.now().toString().slice(-6)
  const heroMarker = `E2E Home Hero ${stamp}`
  const cardMarker = `E2E Domestic ${stamp}`

  await page.goto(`${adminUrl}/pages/home`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)

  const bodyText = await page.locator('main').innerText()
  if (bodyText.includes('Not Found')) {
    fail('Home admin', 'editor shows Not Found — API route missing or stale server')
    return
  }
  if (!(await page.getByRole('heading', { name: 'Home page' }).count())) {
    fail('Home admin', 'Home page heading missing')
    return
  }
  ok('Home admin', 'editor loads at /pages/home')

  const sectionNav = page.getByRole('navigation', { name: 'Page sections' })
  await sectionNav.getByRole('button', { name: 'Popular items' }).click()
  await page.waitForTimeout(300)

  if (await page.getByText('Link path (read-only)').count()) {
    ok('Home admin', 'read-only slug fields visible (H2)')
  } else {
    fail('Home admin', 'read-only slug warning not found')
  }

  await sectionNav.getByRole('button', { name: 'Carousel' }).click()
  await page.waitForTimeout(300)

  if (await page.getByRole('heading', { name: 'Hero carousel' }).count()) {
    ok('Home admin', 'hero carousel section visible (H3)')
  } else {
    fail('Home admin', 'hero carousel section missing')
  }

  if (await page.getByRole('button', { name: /Change image|Upload image/i }).first().count()) {
    ok('Home admin', 'upload/change image buttons present (H3)')
  } else {
    fail('Home admin', 'upload/change image buttons missing')
  }

  const saveBtn = page.getByRole('button', { name: /^Save page$/i }).first()
  if (await saveBtn.isDisabled()) ok('Home admin', 'Save disabled when clean')
  else fail('Home admin', 'Save should be disabled before edits')

  const heroInput = page.getByRole('textbox', { name: 'Main headline', exact: true })
  const originalHero = await heroInput.inputValue()
  await heroInput.fill(heroMarker)

  await sectionNav.getByRole('button', { name: 'Service cards' }).click()
  await page.waitForTimeout(300)

  const cardSection = page.locator('section#home-service-cards')
  const cardInput = cardSection.getByRole('textbox', { name: 'Title', exact: true }).first()
  const originalCard = await cardInput.inputValue()
  await cardInput.fill(cardMarker)

  if (await saveBtn.isEnabled()) ok('Home admin', 'Save enabled after edits')
  else fail('Home admin', 'Save still disabled after edits')

  await saveBtn.click()
  await page.waitForTimeout(2500)

  if (await page.getByText(/saved and synced/i).count()) ok('Home admin', 'save success message shown')
  else fail('Home admin', 'save success message missing')

  await page.reload({ waitUntil: 'domcontentloaded' })
  if ((await heroInput.inputValue()) === heroMarker) ok('Home admin', 'hero headline persists after reload')
  else fail('Home admin', 'hero headline lost after reload')

  if ((await cardInput.inputValue()) === cardMarker) ok('Home admin', 'service card title persists after reload')
  else fail('Home admin', 'service card title lost after reload')

  if (!publicUrl) {
    fail('Home public', 'public site URL not found — skipping sync checks')
    return
  }

  console.log('\n--- HOME PAGE PUBLIC ---')
  try {
    const homeJson = await readPublicJson(publicUrl, 'pages/home.json')
    if (homeJson.content?.hero?.headline === heroMarker) ok('Home public', 'hero in public/content/pages/home.json')
    else fail('Home public', 'hero missing from synced JSON', homeJson.content?.hero?.headline)

    if (homeJson.content?.serviceCards?.[0]?.title === cardMarker) {
      ok('Home public', 'service card in synced JSON')
    } else {
      fail('Home public', 'service card missing from synced JSON')
    }

    if ((homeJson.content?.heroImages || []).length === 5) {
      ok('Home public', 'hero carousel slides preserved (5 images)')
    } else {
      fail('Home public', 'heroImages count wrong after save', String(homeJson.content?.heroImages?.length))
    }

    if (homeJson.content?.popularItems?.items?.[0]?.slug === 'sweets') {
      ok('Home public', 'popular item slug unchanged after H2 edit')
    } else {
      fail('Home public', 'popular slug changed unexpectedly')
    }
  } catch (err) {
    fail('Home public', 'could not read public home JSON', err.message)
  }

  await page.goto(`${publicUrl}/`, { waitUntil: 'domcontentloaded' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const publicBody = await page.locator('body').innerText()
  if (publicBody.includes(heroMarker)) ok('Home public', 'hero headline visible on live /')
  else fail('Home public', 'hero headline not on live home page')

  if (publicBody.includes(cardMarker)) ok('Home public', 'service card title visible on live /')
  else fail('Home public', 'service card title not on live home page')

  // restore via admin
  await page.goto(`${adminUrl}/pages/home`, { waitUntil: 'domcontentloaded' })
  await heroInput.fill(originalHero)
  await cardInput.fill(originalCard)
  await page.getByRole('button', { name: /^Save page$/i }).first().click()
  await page.waitForTimeout(2000)
  ok('Home admin', 'restored original hero + service card via admin')
}

async function testOffersPageSmoke(page, adminUrl, publicUrl) {
  console.log('\n--- OFFERS PAGE SMOKE ---')
  await page.goto(`${adminUrl}/pages/offers`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Special Offers page' }).waitFor({ timeout: 10000 }).catch(() => {})
  const text = await page.locator('main').innerText()
  if (text.includes('Not Found')) {
    fail('Offers admin', 'Special Offers editor Not Found')
    return
  }
  if (await page.getByRole('heading', { name: 'Special Offers page' }).count()) {
    ok('Offers admin', 'Special Offers editor still loads')
  } else {
    fail('Offers admin', 'Special Offers heading missing')
  }

  if (publicUrl) {
    await page.goto(`${publicUrl}/offers`, { waitUntil: 'domcontentloaded' })
    const title = await page.title()
    if (title.includes('Eagle') || title.includes('Offer')) ok('Offers public', '/offers loads')
    else fail('Offers public', `/offers bad title: ${title}`)
  }
}

async function main() {
  console.log('Home page E2E QA\n')
  const snapshots = snapshotContent(['pages/home.json'])

  await testApiHealth()

  const browser = await chromium.launch({ headless })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    const adminUrl = await findAdminUrl(page)
    const publicUrl = await findPublicUrl(page)

    if (!adminUrl) {
      fail('Setup', 'admin dev server not found on 5174–5176')
    } else {
      ok('Setup', `admin at ${adminUrl}`)
      await login(page, adminUrl)
      ok('Setup', 'logged in as admin')
    }

    if (!publicUrl) fail('Setup', 'public dev server not found on 5173')
    else ok('Setup', `public at ${publicUrl}`)

    if (adminUrl && publicUrl) {
      await testHomePageEditor(page, adminUrl, publicUrl)
      await testOffersPageSmoke(page, adminUrl, publicUrl)
    }
  } finally {
    restoreContent(snapshots)
    ok('Cleanup', 'restored pages/home.json from snapshot')
    await browser.close()
  }

  console.log('\n=== SUMMARY ===')
  console.log(`Passed: ${passed.length}`)
  console.log(`Failed: ${failed.length}`)
  if (failed.length) {
    console.log('\nFailures:')
    for (const f of failed) console.log(`  - [${f.area}] ${f.msg}`)
    process.exit(1)
  }
  console.log('\nAll home page E2E checks passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
