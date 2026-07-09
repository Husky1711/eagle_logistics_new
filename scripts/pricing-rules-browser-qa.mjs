/**
 * Sprint 2b browser QA — pricing rules admin + public calculator.
 * Usage: node scripts/pricing-rules-browser-qa.mjs [--headed]
 */
import { chromium } from 'playwright'
import { restoreContent, snapshotContent } from './e2e-content-restore.mjs'

const PUBLIC = 'http://localhost:5173'
const ADMIN_PORTS = [5176, 5175, 5174]
const PASSWORD = 'change-me-in-production'
const headed = process.argv.includes('--headed')

const snapshot = snapshotContent(['pricing-rules.json'])

async function findAdminUrl(page) {
  for (const port of ADMIN_PORTS) {
    try {
      await page.goto(`http://localhost:${port}/login`, { waitUntil: 'networkidle', timeout: 10000 })
      if ((await page.title()).includes('Admin')) return `http://localhost:${port}`
    } catch {
      // try next port
    }
  }
  return null
}

async function login(page, adminUrl) {
  await page.goto(`${adminUrl}/login`, { waitUntil: 'networkidle' })
  if (await page.getByRole('heading', { name: 'Dashboard' }).count()) return
  await page.locator('#username').fill('admin')
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12000 })
}

async function loadRulesFromEditor(page) {
  const raw = await page.getByLabel('Pricing rules JSON').inputValue()
  return JSON.parse(raw)
}

async function saveRulesInEditor(page, data) {
  await page.getByLabel('Pricing rules JSON').fill(`${JSON.stringify(data, null, 2)}\n`)
  await page.getByRole('button', { name: /Save pricing rules/i }).click()
  await page.waitForTimeout(2000)
}

async function readPublicRules() {
  const res = await fetch(`${PUBLIC}/content/pricing-rules.json?ts=${Date.now()}`)
  if (!res.ok) throw new Error(`public pricing-rules.json HTTP ${res.status}`)
  return res.json()
}

async function runPublicCalculator(page, weight, distance) {
  await page.goto(`${PUBLIC}/pricing`, { waitUntil: 'networkidle' })
  await page.getByLabel('Weight (kg)').fill(String(weight))
  await page.getByLabel('Distance (km)').fill(String(distance))
  await page.getByRole('button', { name: /Calculate Price/i }).click()
  await page.waitForTimeout(1200)
}

async function getCourierPriceOnPage(page, courierName) {
  const heading = page.getByRole('heading', { name: courierName, level: 3 })
  if (!(await heading.count())) return null
  const row = heading.locator('xpath=ancestor::div[contains(@class,"justify-between")]').first()
  const priceText = await row.locator('.text-primary-600').textContent()
  return Number.parseFloat(priceText.replace(/[₹,\s]/g, ''))
}

async function main() {
  const passed = []
  const issues = []
  const ok = (msg) => {
    passed.push(msg)
    console.log(`  OK: ${msg}`)
  }
  const fail = (msg) => {
    issues.push(msg)
    console.log(`  FAIL: ${msg}`)
  }

  console.log(`\n=== Pricing Rules Browser QA${headed ? ' (headed)' : ''} ===\n`)

  const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 200 : 0 })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  try {
    const apiOk = await fetch('http://localhost:8000/health').then((r) => r.ok).catch(() => false)
    if (!apiOk) {
      fail('API not running on :8000 — run npm run dev:api')
      process.exit(1)
    }
    ok('API healthy')

    const adminUrl = await findAdminUrl(page)
    if (!adminUrl) {
      fail('admin app not found — run npm run dev:admin')
      process.exit(1)
    }
    ok(`admin at ${adminUrl}`)

    await login(page, adminUrl)

    // Dashboard card
    await page.goto(`${adminUrl}/`, { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: /Rate cards for the public/i }).click()
    await page.waitForTimeout(600)
    if (!page.url().includes('/pricing-rules')) {
      fail('dashboard Pricing rules card did not navigate')
    } else {
      ok('dashboard card opens pricing rules')
    }

    await page.getByRole('heading', { name: 'Pricing rules' }).waitFor({ timeout: 8000 })
    ok('pricing rules page loads')

    // Nav link
    await page.getByRole('link', { name: 'Pricing rules', exact: true }).click()
    await page.waitForTimeout(400)
    if (!page.url().includes('/pricing-rules')) {
      fail('sidebar Pricing rules nav broken')
    } else {
      ok('sidebar nav works')
    }

    let data
    try {
      data = await loadRulesFromEditor(page)
      if (!Array.isArray(data) || !data.length) throw new Error('not an array')
      ok('JSON editor loads valid pricing rules array')
    } catch {
      fail('could not parse pricing rules JSON from editor')
      return
    }

    const dtdcRule = data.find((r) => r.id === 'dtdc-standard')
    const delhiveryRule = data.find((r) => r.id === 'delhivery-standard')
    const testRule = delhiveryRule || dtdcRule
    if (!testRule) {
      fail('delhivery-standard / dtdc-standard rule missing from editor')
      return
    }
    const testCourierName = testRule.courier === 'delhivery' ? 'Delhivery' : 'DTDC'
    const originalBase = testRule.distance_zones[0].base_price
    const pricePerKg = testRule.distance_zones[0].price_per_kg

    // Invalid JSON (client-side)
    await page.getByLabel('Pricing rules JSON').fill('{ not valid json')
    await page.getByRole('button', { name: /Save pricing rules/i }).click()
    await page.waitForTimeout(800)
    if (await page.getByText(/Invalid JSON/i).count()) {
      ok('invalid JSON shows client error')
    } else {
      fail('invalid JSON did not show client error')
    }

    // Restore valid JSON before API tests
    await saveRulesInEditor(page, data)

    // Unknown courier (API validation)
    const badCourier = JSON.parse(JSON.stringify(data))
    badCourier.push({
      id: 'qa-bad-courier-rule',
      courier: 'courier-that-does-not-exist',
      weight_range: { min: 0, max: 5, unit: 'kg' },
      distance_zones: [
        {
          zone: 'local',
          max_distance: 50,
          unit: 'km',
          base_price: 10,
          price_per_kg: 1,
          estimated_delivery: '1 day',
        },
      ],
      active: true,
    })
    await saveRulesInEditor(page, badCourier)
    const apiErr = await page.locator('.text-red-600').textContent().catch(() => '')
    if (apiErr.toLowerCase().includes('unknown courier')) {
      ok('unknown courier rejected by API')
    } else {
      fail(`unknown courier not rejected${apiErr ? `: ${apiErr}` : ''}`)
    }

    // Valid save + persist after reload
    const marker = 8.77
    const updated = JSON.parse(JSON.stringify(data))
    const target = updated.find((r) => r.id === testRule.id)
    target.distance_zones[0].base_price = marker
    await saveRulesInEditor(page, updated)

    if (!(await page.getByText(/saved and synced/i).count())) {
      fail('valid save did not show success message')
    } else {
      ok('valid save succeeds')
    }

    await page.reload({ waitUntil: 'networkidle' })
    const reloaded = await loadRulesFromEditor(page)
    const reloadedBase = reloaded.find((r) => r.id === testRule.id)?.distance_zones?.[0]?.base_price
    if (reloadedBase !== marker) {
      fail(`save did not persist after reload (expected ${marker}, got ${reloadedBase})`)
    } else {
      ok('pricing rules persist after reload')
    }

    // Public JSON sync
    try {
      const publicRules = await readPublicRules()
      const publicBase = publicRules.find((r) => r.id === testRule.id)?.distance_zones?.[0]?.base_price
      if (publicBase !== marker) {
        fail('public/content/pricing-rules.json not synced')
      } else {
        ok('public pricing-rules.json synced')
      }
    } catch (err) {
      fail(`could not read public pricing-rules.json: ${err.message}`)
    }

    // Public calculator reflects new rate
    const weight = 2
    const distance = 30
    const expected = marker + weight * pricePerKg
    await runPublicCalculator(page, weight, distance)
    if (!(await page.getByRole('heading', { name: 'Best Options' }).count())) {
      fail('calculator did not show results after rate change')
    } else {
      ok('public calculator shows results')
    }

    const courierPrice = await getCourierPriceOnPage(page, testCourierName)
    const body = await page.locator('body').innerText()
    if (courierPrice !== null && Math.abs(courierPrice - expected) <= 0.02) {
      ok(`calculator uses updated ${testCourierName} rate (₹${courierPrice.toFixed(2)})`)
    } else if (body.includes(`Base: ₹${marker}`)) {
      ok(`calculator breakdown shows updated base (₹${marker})`)
    } else if (courierPrice === null) {
      fail(`${testCourierName} result missing on pricing page`)
    } else {
      fail(`calculator price mismatch (expected ₹${expected.toFixed(2)}, got ₹${courierPrice.toFixed(2)})`)
    }

    // Dashboard last-saved timestamp
    await page.goto(`${adminUrl}/`, { waitUntil: 'networkidle' })
    const dash = await page.locator('body').innerText()
    if (dash.includes('Pricing rules') && dash.toLowerCase().includes('last saved')) {
      ok('dashboard shows pricing rules last-saved timestamp')
    } else {
      fail('dashboard missing pricing rules last-saved info')
    }

    // Restore original base in editor (snapshot restore handles file; sync UI state)
    target.distance_zones[0].base_price = originalBase
    await page.goto(`${adminUrl}/pricing-rules`, { waitUntil: 'networkidle' })
    await saveRulesInEditor(page, updated)
    if (await page.getByText(/saved and synced/i).count()) {
      ok('restored original local base price')
    }
  } finally {
    await browser.close()
    restoreContent(snapshot)
    console.log('  OK: restored pricing-rules.json after test')
  }

  console.log(`\n=== Summary: ${passed.length} passed, ${issues.length} failed ===`)
  if (issues.length) {
    issues.forEach((item) => console.log(` - ${item}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  restoreContent(snapshot)
  process.exit(1)
})
