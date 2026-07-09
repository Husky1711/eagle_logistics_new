import { chromium } from 'playwright'

const admin = 'http://localhost:5175'
const publicSite = 'http://localhost:5173'
const PASS = 'change-me-in-production'
const bugs = []

async function login(page) {
  await page.goto(`${admin}/login`, { waitUntil: 'networkidle' })
  if (await page.locator('#username').count()) {
    await page.locator('#password').fill(PASS)
    await page.getByRole('button', { name: /Sign in/i }).click()
    await page.waitForURL((u) => !u.pathname.includes('/login'))
  }
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await login(page)

// Duplicate HTML ids
const dupIds = await page.evaluate(async () => {
  await new Promise((r) => setTimeout(r, 100))
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id)
  const counts = {}
  ids.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1
  })
  return Object.entries(counts).filter(([, c]) => c > 1)
})
await page.goto(`${admin}/couriers`, { waitUntil: 'networkidle' })
const courierDupIds = await page.evaluate(() => {
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id)
  const counts = {}
  ids.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1
  })
  return Object.entries(counts).filter(([, c]) => c > 1)
})
if (courierDupIds.length) {
  bugs.push({
    id: 'E2E-34',
    severity: 'High',
    area: 'Couriers UI',
    title: 'Duplicate HTML id attributes across courier cards',
    detail: `Repeated ids: ${courierDupIds.map(([id, c]) => `${id} (×${c})`).join(', ')}. Breaks accessibility and label association.`,
  })
}

// Rename courier ID allowed without warning
await page.goto(`${admin}/couriers`, { waitUntil: 'networkidle' })
const firstIdField = page.getByRole('textbox', { name: /^ID / }).first()
const firstId = await firstIdField.inputValue()
await firstIdField.fill('renamed-id-test')
await page.getByRole('button', { name: /Save couriers/i }).click()
await page.waitForTimeout(2000)
if (await page.getByText(/saved and synced/i).count()) {
  bugs.push({
    id: 'E2E-26',
    severity: 'High',
    area: 'Couriers',
    title: 'Courier ID can be renamed with no warning',
    detail: 'pricing-rules.json references courier ids. Renaming dtdc→renamed-id-test breaks pricing silently.',
  })
  await firstIdField.fill(firstId)
  await page.getByRole('button', { name: /Save couriers/i }).click()
  await page.waitForTimeout(1500)
}

// Inactive offer hides strip
await page.goto(`${admin}/offers`, { waitUntil: 'networkidle' })
const offerCb = page.locator('label:has-text("Offer active") input')
const wasActive = await offerCb.isChecked()
await offerCb.setChecked(false)
await page.getByRole('button', { name: /Save offer/i }).click()
await page.waitForTimeout(1500)
await page.goto(`${publicSite}/`, { waitUntil: 'networkidle' })
if (await page.getByRole('region', { name: 'Promotional offer' }).count()) {
  bugs.push({
    id: 'E2E-27',
    severity: 'High',
    area: 'Offers',
    title: 'Offer strip still visible when active=false',
  })
}
await page.goto(`${admin}/offers`, { waitUntil: 'networkidle' })
await offerCb.setChecked(wasActive)
await page.getByRole('button', { name: /Save offer/i }).click()

// Unsaved changes on logout
await page.goto(`${admin}/settings`, { waitUntil: 'networkidle' })
const phoneInput = page.getByRole('textbox', { name: /^Phone/ })
const origPhone = await phoneInput.inputValue()
await phoneInput.fill('+91 99999 UNSAVED')
await page.getByRole('button', { name: /Logout/i }).click()
await page.waitForTimeout(1000)
await login(page)
await page.goto(`${admin}/settings`, { waitUntil: 'networkidle' })
const phoneAfter = await phoneInput.inputValue()
if (phoneAfter === '+91 99999 UNSAVED') {
  bugs.push({
    id: 'E2E-29',
    severity: 'Low',
    area: 'UX',
    title: 'No unsaved-changes warning on logout',
    detail: 'Edited phone survived logout+login in same browser tab (bfcache/state). No confirm dialog.',
  })
}
if (phoneAfter !== origPhone && phoneAfter !== '+91 99999 UNSAVED') {
  bugs.push({
    id: 'E2E-29b',
    severity: 'Medium',
    area: 'UX',
    title: 'Unexpected phone value after unsaved logout probe',
    detail: phoneAfter,
  })
}
await phoneInput.fill(origPhone)
await page.getByRole('button', { name: /Save settings/i }).click()

// Duplicate Couriers links
await page.goto(`${admin}/`, { waitUntil: 'networkidle' })
if ((await page.getByRole('link', { name: /Couriers/i }).count()) > 1) {
  bugs.push({
    id: 'E2E-30',
    severity: 'Low',
    area: 'Navigation',
    title: 'Duplicate Couriers links visible (sidebar + dashboard card)',
  })
}

// Hardcoded public site URL
await page.goto(`${admin}/`, { waitUntil: 'networkidle' })
const href = await page.getByRole('link', { name: /View public site/i }).getAttribute('href')
if (href === 'http://localhost:5173') {
  bugs.push({
    id: 'E2E-33',
    severity: 'Low',
    area: 'Admin',
    title: 'View public site URL hardcoded to localhost:5173',
    detail: 'Should use env var when public runs on another host/port (e.g. Codespaces).',
  })
}

// Changing courier id in UI breaks React key mid-edit
await page.goto(`${admin}/couriers`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Add courier/i }).click()
const lastName = page.locator('[id^="courier-name-"]').last()
const initialId = await lastName.getAttribute('id')
await lastName.fill('Key Break Test')
await page.waitForTimeout(300)
const afterId = await lastName.getAttribute('id')
if (initialId !== afterId) {
  bugs.push({
    id: 'E2E-35',
    severity: 'Medium',
    area: 'Couriers UI',
    title: 'Auto-slug ID change remounts name field while typing',
    detail: `Input id changed ${initialId} → ${afterId} when name edited; can cause focus loss/cursor jumps.`,
  })
}
// cleanup new row
page.once('dialog', (d) => d.accept())
await page.locator('section.rounded-xl').last().getByRole('button', { name: 'Remove' }).click()

// Settings: add empty menu link saves?
await page.goto(`${admin}/settings`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '+ Add link' }).first().click()
await page.getByRole('button', { name: /Save settings/i }).click()
await page.waitForTimeout(1500)
if (await page.getByText(/saved and synced/i).count()) {
  bugs.push({
    id: 'E2E-36',
    severity: 'Low',
    area: 'Settings',
    title: 'Empty menu link row can be saved without validation',
    detail: 'New link defaults to label "New link" and path "/" — may be intentional but no required-field check.',
  })
}

// Nav: no active route highlight check - skip

console.log('\n=== Edge-case probes ===\n')
for (const b of bugs) {
  console.log(`${b.id} [${b.severity}] ${b.area}: ${b.title}`)
  if (b.detail) console.log(`  ${b.detail}`)
}
console.log(`\nTotal: ${bugs.length} bugs`)
await browser.close()
