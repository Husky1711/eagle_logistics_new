/**
 * Browser couriers QA — requires API on :8000 and admin dev server.
 * Usage: node scripts/couriers-browser-qa.mjs
 */
import { chromium } from 'playwright'
import { restoreContent, snapshotContent } from './e2e-content-restore.mjs'

const ADMIN_PORTS = [5176, 5175, 5174]
const PASSWORD = 'change-me-in-production'
const CONTENT_SNAPSHOT = snapshotContent(['couriers.json'])

async function findAdminUrl(page) {
  for (const port of ADMIN_PORTS) {
    const url = `http://localhost:${port}/login`
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 })
      if ((await page.title()).includes('Eagle Logistics Admin')) return `http://localhost:${port}`
    } catch {
      // try next port
    }
  }
  return null
}

async function login(page, adminUrl) {
  await page.goto(`${adminUrl}/login`, { waitUntil: 'networkidle' })
  if (!(await page.locator('#username').count())) {
    if (await page.getByRole('heading', { name: 'Dashboard' }).count()) return
    await page.goto(`${adminUrl}/`, { waitUntil: 'networkidle' })
    if (await page.getByRole('heading', { name: 'Dashboard' }).count()) return
  }
  await page.locator('#username').fill('admin')
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
}

async function main() {
  const issues = []
  const passed = []
  const fail = (msg) => {
    issues.push(msg)
    console.log(`  FAIL: ${msg}`)
  }
  const ok = (msg) => {
    passed.push(msg)
    console.log(`  OK: ${msg}`)
  }

  console.log('\n=== Browser Couriers QA ===\n')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    const adminUrl = await findAdminUrl(page)
    if (!adminUrl) {
      fail('admin app not found — run npm run dev:admin')
      process.exit(1)
    }
    ok(`admin at ${adminUrl}`)

    await login(page, adminUrl)
    await page.goto(`${adminUrl}/couriers`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Couriers' }).waitFor({ timeout: 10000 })
    ok('couriers page loads')

    const initialCount = await page.locator('section.rounded-xl').count()
    await page.getByRole('button', { name: /Add courier/i }).click()
    if ((await page.locator('section.rounded-xl').count()) !== initialCount + 1) {
      fail('add courier should insert a new row')
    } else {
      ok('add courier works')
    }

    const marker = `__e2e__ Courier ${Date.now()}`
    const lastSection = page.locator('section.rounded-xl').last()
    await lastSection.locator('input[id$="-name"]').fill(marker)
    await lastSection.locator('input[id$="-name"]').blur()
    await page.getByRole('button', { name: /Save couriers/i }).click()
    await page.waitForTimeout(2500)

    const errorText = await page.locator('.text-red-600').textContent().catch(() => '')
    if (!(await page.getByText(/saved and synced/i).count())) {
      fail(`save should show success message${errorText ? `: ${errorText}` : ''}`)
    } else {
      ok('save couriers succeeds')
      await page.reload({ waitUntil: 'networkidle' })
      if (!(await page.getByText(marker).count())) {
        fail('saved courier name should persist after reload')
      } else {
        ok('courier persists after reload')
      }

      const lockedId = page
        .locator('section.rounded-xl', { hasText: marker })
        .locator('input[id$="-id"]')
      if (!(await lockedId.evaluate((el) => el.hasAttribute('readonly')))) {
        fail('courier id should be read-only after save')
      } else {
        ok('courier id locked after save')
      }
    }
  } finally {
    await browser.close()
    restoreContent(CONTENT_SNAPSHOT)
    console.log('  OK: restored couriers.json after test')
  }

  console.log(`\n=== Summary: ${passed.length} passed, ${issues.length} failed ===`)
  if (issues.length) {
    issues.forEach((item) => console.log(` - ${item}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  restoreContent(CONTENT_SNAPSHOT)
  process.exit(1)
})
