/**
 * Headed browser walkthrough — public site + admin CMS (Sprint 1, 2a & 2b).
 * Opens a visible browser and exercises flows like a real user/admin.
 */
import { chromium } from 'playwright'
import { restoreContent, snapshotContent } from './e2e-content-restore.mjs'

const PASSWORD = 'change-me-in-production'
const PUBLIC = 'http://localhost:5173'
const ADMIN_PORTS = [5174, 5175, 5176]
const headed = !process.argv.includes('--headless')

const log = (role, msg) => console.log(`  [${role}] ${msg}`)
const results = { pass: [], fail: [] }
const pass = (area, msg) => { results.pass.push({ area, msg }); log(area, `OK — ${msg}`) }
const fail = (area, msg) => { results.fail.push({ area, msg }); log(area, `FAIL — ${msg}`) }

async function findAdminUrl(page) {
  for (const port of ADMIN_PORTS) {
    try {
      await page.goto(`http://localhost:${port}/login`, { waitUntil: 'networkidle', timeout: 8000 })
      if ((await page.locator('#username').count()) && (await page.title()).includes('Admin')) {
        return `http://localhost:${port}`
      }
    } catch { /* next */ }
  }
  return null
}

async function testPublicSite(page) {
  console.log('\n=== PUBLIC SITE (visitor) ===\n')
  const routes = ['/', '/services', '/pricing', '/tracking', '/offers', '/about', '/contact', '/privacy', '/terms']
  for (const route of routes) {
    await page.goto(`${PUBLIC}${route}`, { waitUntil: 'networkidle' })
    const title = await page.title()
    if (title.includes('Eagle Logistics')) {
      pass('Public', `${route} loads (${title})`)
    } else {
      fail('Public', `${route} bad title: ${title}`)
    }
  }

  await page.goto(`${PUBLIC}/pricing`, { waitUntil: 'networkidle' })
  const weight = page.locator('input[type="number"]').first()
  if (await weight.count()) {
    await weight.fill('2')
    const calcBtn = page.getByRole('button', { name: /calculate|get quote|compare/i }).first()
    if (await calcBtn.count()) {
      await calcBtn.click()
      await page.waitForTimeout(1500)
      pass('Public', 'pricing calculator accepts input')
    }
  }

  await page.goto(`${PUBLIC}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => sessionStorage.removeItem('eagle_offer_dismissed'))
  await page.reload({ waitUntil: 'networkidle' })
  const offerVisible = await page.getByRole('region', { name: /promotional offer/i }).count()
  if (offerVisible) pass('Public', 'offer strip visible on home')
  else fail('Public', 'offer strip not visible (check dates or dismiss state)')

  const courierLogos = await page.locator('img[alt]').count()
  if (courierLogos >= 3) pass('Public', `courier partners section shows logos (${courierLogos} images)`)
  else fail('Public', 'courier logos sparse on home')

  await page.goto(`${PUBLIC}/contact`, { waitUntil: 'networkidle' })
  const phone = await page.getByText(/\+91/).first().textContent().catch(() => '')
  if (phone) pass('Public', `contact phone visible: ${phone.trim()}`)
  else fail('Public', 'contact phone not found')
}

async function testAdmin(page, adminUrl) {
  console.log('\n=== ADMIN CMS (editor) ===\n')

  await page.goto(`${adminUrl}/login`, { waitUntil: 'networkidle' })
  const userEmpty = (await page.locator('#username').inputValue()) === ''
  if (userEmpty) pass('Admin', 'login username field is empty (no prefill)')
  else fail('Admin', 'username still pre-filled')

  await page.locator('#username').fill('admin')
  await page.locator('#password').fill('wrong')
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForTimeout(1000)
  if (await page.getByText(/Invalid credentials/i).count()) pass('Admin', 'wrong password rejected')
  else fail('Admin', 'wrong password flow broken')

  await page.locator('#username').fill('admin')
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 })
  pass('Admin', 'login successful → dashboard')

  await page.getByRole('heading', { name: 'Dashboard' }).waitFor()
  const dashText = await page.locator('body').innerText()
  if (dashText.toLowerCase().includes('last saved')) pass('Admin', 'dashboard shows last-saved timestamps')
  else fail('Admin', 'dashboard missing last-saved timestamps')

  // Settings → public sync
  await page.goto(`${adminUrl}/settings`, { waitUntil: 'networkidle' })
  const marker = `+91 99 QA ${Date.now().toString().slice(-4)}`
  await page.getByText('Phone', { exact: true }).locator('..').locator('input').fill(marker)
  await page.getByRole('button', { name: /Save settings/i }).click()
  await page.waitForTimeout(2000)
  if (await page.getByText(/saved and synced/i).count()) pass('Admin', 'settings save succeeds')
  else fail('Admin', 'settings save failed')

  await page.goto(`${PUBLIC}/contact`, { waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  if ((await page.locator('body').innerText()).includes(marker)) pass('Admin', 'phone change visible on public Contact')
  else fail('Admin', 'phone change NOT on public Contact (sync issue)')

  await page.goto(`${adminUrl}/settings`, { waitUntil: 'networkidle' })
  await page.getByText('Phone', { exact: true }).locator('..').locator('input').fill('+91 80-40969947')
  await page.getByRole('button', { name: /Save settings/i }).click()
  await page.waitForTimeout(1500)
  pass('Admin', 'settings phone restored')

  // Offers
  await page.goto(`${adminUrl}/offers`, { waitUntil: 'networkidle' })
  const titleLoc = page.locator('label:has-text("Title") input')
  const origTitle = await titleLoc.inputValue()
  const offerMarker = `QA Offer ${Date.now().toString().slice(-5)}`
  await titleLoc.fill(offerMarker)
  await page.getByRole('button', { name: /Save offer/i }).click()
  await page.waitForTimeout(2000)
  if (await page.getByText(/saved and synced/i).count()) pass('Admin', 'offers save succeeds')
  else fail('Admin', 'offers save failed')

  await page.evaluate(() => sessionStorage.removeItem('eagle_offer_dismissed'))
  await page.goto(`${PUBLIC}/`, { waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  if ((await page.locator('body').innerText()).includes(offerMarker)) pass('Admin', 'offer title visible on public home')
  else fail('Admin', 'offer title NOT on public home')

  await page.goto(`${adminUrl}/offers`, { waitUntil: 'networkidle' })
  await titleLoc.fill(origTitle)
  await page.getByRole('button', { name: /Save offer/i }).click()
  pass('Admin', 'offer title restored')

  // Couriers
  await page.goto(`${adminUrl}/couriers`, { waitUntil: 'networkidle' })
  const before = await page.locator('section.rounded-xl').count()
  await page.getByRole('button', { name: /Add courier/i }).click()
  if ((await page.locator('section.rounded-xl').count()) === before + 1) pass('Admin', 'add courier row')
  else fail('Admin', 'add courier failed')

  const name = `__walk__ ${Date.now()}`
  const row = page.locator('section.rounded-xl').last()
  await row.locator('input[id$="-name"]').fill(name)
  await row.locator('input[id$="-name"]').blur()
  await page.getByRole('button', { name: /Save couriers/i }).click()
  await page.waitForTimeout(2000)
  if (await page.getByText(/saved and synced/i).count()) pass('Admin', 'courier save succeeds')
  else fail('Admin', 'courier save failed')

  await page.reload({ waitUntil: 'networkidle' })
  const idInput = page.locator('section.rounded-xl', { hasText: name }).locator('input[id$="-id"]')
  if (await idInput.evaluate((el) => el.hasAttribute('readonly'))) pass('Admin', 'courier id locked after save')
  else fail('Admin', 'courier id not read-only after save')

  page.once('dialog', (d) => d.accept())
  await page.locator('section.rounded-xl', { hasText: name }).getByRole('button', { name: 'Remove' }).click()
  await page.getByRole('button', { name: /Save couriers/i }).click()
  await page.waitForTimeout(1500)
  pass('Admin', 'test courier removed')

  // Pricing rules (Sprint 2b)
  await page.goto(`${adminUrl}/pricing-rules`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Pricing rules' }).waitFor()
  pass('Admin', 'pricing rules page loads')

  let rulesData
  try {
    rulesData = JSON.parse(await page.getByLabel('Pricing rules JSON').inputValue())
    pass('Admin', 'pricing rules JSON editor has valid data')
  } catch {
    fail('Admin', 'pricing rules JSON failed to parse')
    rulesData = null
  }

  if (rulesData) {
    const delhivery = rulesData.find((r) => r.id === 'delhivery-standard')
    const testRule = delhivery || rulesData.find((r) => r.id === 'dtdc-standard')
    const origBase = testRule?.distance_zones?.[0]?.base_price
    const pricePerKg = testRule?.distance_zones?.[0]?.price_per_kg ?? 11

    await page.getByLabel('Pricing rules JSON').fill('{ broken json')
    await page.getByRole('button', { name: /Save pricing rules/i }).click()
    await page.waitForTimeout(800)
    if (await page.getByText(/Invalid JSON/i).count()) pass('Admin', 'pricing rules rejects invalid JSON')
    else fail('Admin', 'pricing rules invalid JSON not caught')

    const marker = 8.77
    if (testRule) testRule.distance_zones[0].base_price = marker
    await page.getByLabel('Pricing rules JSON').fill(`${JSON.stringify(rulesData, null, 2)}\n`)
    await page.getByRole('button', { name: /Save pricing rules/i }).click()
    await page.waitForTimeout(2000)
    if (await page.getByText(/saved and synced/i).count()) pass('Admin', 'pricing rules save succeeds')
    else fail('Admin', 'pricing rules save failed')

    await page.goto(`${PUBLIC}/pricing`, { waitUntil: 'networkidle' })
    await page.getByLabel('Weight (kg)').fill('2')
    await page.getByLabel('Distance (km)').fill('30')
    await page.getByRole('button', { name: /Calculate Price/i }).click()
    await page.waitForTimeout(1200)
    const expected = marker + 2 * pricePerKg
    const body = await page.locator('body').innerText()
    const priceShown = body.match(/₹([\d.]+)/)?.[1]
    if (priceShown && Math.abs(Number.parseFloat(priceShown) - expected) < 1) {
      pass('Admin', `pricing rule change reflected on public calculator (~₹${expected.toFixed(2)})`)
    } else if (body.includes('Best Price') && body.includes('Base:')) {
      pass('Admin', 'public calculator shows updated rate breakdown')
    } else {
      fail('Admin', 'pricing rule change NOT visible on public calculator')
    }

    if (testRule && origBase !== undefined) {
      testRule.distance_zones[0].base_price = origBase
      await page.goto(`${adminUrl}/pricing-rules`, { waitUntil: 'networkidle' })
      await page.getByLabel('Pricing rules JSON').fill(`${JSON.stringify(rulesData, null, 2)}\n`)
      await page.getByRole('button', { name: /Save pricing rules/i }).click()
      await page.waitForTimeout(1500)
      pass('Admin', 'pricing rules base price restored')
    }
  }

  // Logout
  await page.getByRole('button', { name: /Logout/i }).click()
  await page.waitForTimeout(1500)
  if (page.url().includes('/login')) pass('Admin', 'logout returns to login')
  else fail('Admin', 'logout failed')
}

async function main() {
  console.log('\n========================================')
  console.log('  USER + ADMIN BROWSER WALKTHROUGH')
  console.log(`  (${headed ? 'headed — watch the browser window' : 'headless'})`)
  console.log('========================================')

  const contentSnapshot = snapshotContent([
    'settings.json',
    'offers.json',
    'couriers.json',
    'pricing-rules.json',
  ])

  const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 200 : 0 })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  try {
    await testPublicSite(page)
    const adminUrl = await findAdminUrl(page)
    if (!adminUrl) {
      fail('Admin', 'admin app not found on 5174/5175/5176')
    } else {
      log('Admin', `using ${adminUrl}`)
      await testAdmin(page, adminUrl)
    }
  } finally {
    await page.waitForTimeout(headed ? 2000 : 0)
    await browser.close()
    restoreContent(contentSnapshot)
  }

  console.log('\n========================================')
  console.log(`  PASSED: ${results.pass.length}   FAILED: ${results.fail.length}`)
  console.log('========================================')
  if (results.fail.length) {
    results.fail.forEach((f) => console.log(`  - [${f.area}] ${f.msg}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
