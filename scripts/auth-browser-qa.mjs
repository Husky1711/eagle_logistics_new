/**
 * Browser auth QA — requires API on :8000 and admin dev server.
 * Usage: node scripts/auth-browser-qa.mjs
 */
import { chromium } from 'playwright'

const API = 'http://127.0.0.1:8000'
const ADMIN_PORTS = [5174, 5175]
const issues = []
const passed = []

function fail(msg) {
  issues.push(msg)
  console.log(`  FAIL: ${msg}`)
}

function ok(msg) {
  passed.push(msg)
  console.log(`  OK: ${msg}`)
}

async function findAdminUrl(page) {
  for (const port of ADMIN_PORTS) {
    const url = `http://localhost:${port}/login`
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 })
      const title = await page.title()
      if (title.includes('Eagle Logistics Admin') && (await page.locator('#password').count())) {
        return `http://localhost:${port}`
      }
    } catch {
      // try next port
    }
  }
  return null
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('\n=== Browser Auth QA (admin UI) ===\n')

  const ADMIN = await findAdminUrl(page)
  if (!ADMIN) {
    fail(`admin app not found on ports ${ADMIN_PORTS.join(', ')} — run npm run dev:admin`)
    await browser.close()
    process.exit(1)
  }
  ok(`admin found at ${ADMIN}`)

  await page.goto(`${ADMIN}/login`, { waitUntil: 'networkidle' })

  await page.locator('#password').fill('wrong-password')
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForTimeout(1000)
  if (!(await page.getByText(/Invalid credentials/i).count())) {
    fail('wrong password should show "Invalid credentials"')
  } else {
    ok('wrong password shows error')
  }

  await page.locator('#password').fill('change-me-in-production')
  await page.getByRole('button', { name: /Sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 10000 })
  if (page.url().includes('/login')) {
    fail('successful login should redirect away from login')
  } else {
    ok('successful login redirects to dashboard')
  }

  if (!(await page.getByRole('heading', { name: 'Dashboard' }).count())) {
    fail('dashboard not visible after login')
  } else {
    ok('dashboard visible after login')
  }

  await page.reload({ waitUntil: 'networkidle' })
  if (page.url().includes('/login')) {
    fail('session lost on page reload')
  } else {
    ok('session persists after reload')
  }

  await page.getByRole('button', { name: /Logout/i }).click()
  await page.waitForTimeout(1000)
  if (!page.url().includes('/login')) {
    fail('logout should return to login')
  } else {
    ok('logout returns to login')
  }

  await page.goto(`${ADMIN}/settings`, { waitUntil: 'networkidle' })
  if (!page.url().includes('/login')) {
    fail('/settings should redirect to login when logged out')
  } else {
    ok('protected route redirects when logged out')
  }

  await browser.close()

  console.log(`\n=== Summary: ${passed.length} passed, ${issues.length} failed ===`)
  if (issues.length) {
    issues.forEach((i) => console.log(` - ${i}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
