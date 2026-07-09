# Project 1 — Eagle Logistics (Static Marketing Site)

**Status:** Complete  
**Release tag:** [`v1.0.0-p1`](https://github.com/Husky1711/eagle_logistics_new/releases/tag/v1.0.0-p1)  
**Repository:** [Husky1711/eagle_logistics_new](https://github.com/Husky1711/eagle_logistics_new)  
**Reference (structure/content only):** [Husky1711/eagle](https://github.com/Husky1711/eagle) branch `render-v1.0.0`

---

## 1. Business context

**Eagle Logistics** is a **logistics aggregator** (mediation center). Customers drop off parcels at one hub; Eagle compares multiple courier partners and recommends the best rate and route.

Project 1 delivers a **static, responsive marketing website** — no admin panel, no backend API, no chat. Content is driven by JSON files so Project 2 can add a CMS without rewriting pages.

---

## 2. Actual requirements (Project 1 scope)

### In scope (delivered)

| Requirement | Description |
|-------------|-------------|
| **8 public routes** | Home, Services, Pricing, Tracking, About, Contact, Privacy, Terms |
| **404 page** | Catch-all route with SEO meta |
| **JSON content** | `/content/` at repo root is the single source of truth |
| **Settings-driven chrome** | Header nav, footer links, contact info from `settings.json` |
| **Pricing calculator** | Client-side engine; top 3 courier quotes from `pricing-rules.json` |
| **Promotional offer strip** | IST `startDate` / `endDate`, dismissible, WhatsApp code when active |
| **Tracking** | Select courier → open partner tracking URL with `{id}` placeholder |
| **WhatsApp CTAs** | Pricing, Tracking, Contact pages |
| **Repo-only assets** | Images in `public/assets/` (no external CDN for brand media) |
| **Brand** | Orange `#EA580C` + gold `#D4A017` (Tailwind tokens) |
| **No backend / admin** | Pure static `fetch` at runtime |
| **Codespaces-ready** | `.devcontainer` + automated `npm run verify` |
| **Tests & QA** | Unit tests for pricing/dates; Playwright browser QA |

### Explicitly out of scope (deferred)

| Item | Notes |
|------|-------|
| Admin CMS | **Project 2** — FastAPI + admin UI |
| GitHub Pages deploy | Pre-launch sprint (`basename`, `404.html`, sitemap) |
| Full SEO (og:image, canonical, Twitter cards) | Pre-public launch |
| Official courier trademark logos | Generated text logos for P1; replace before marketing launch |
| CI/CD workflow | Planned with Project 2 |
| Mobile app | Future phase |

---

## 3. What we built

### Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 18 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| SEO | react-helmet-async |
| Icons | Lucide React (explicit icon map in `DynamicIcon.jsx`) |
| Tests | Vitest (unit) + Playwright (browser) |
| Images | sharp (compress script) |

### Routes

| Path | Page | Main data sources |
|------|------|-------------------|
| `/` | Home | `pages/home.json`, `couriers.json` |
| `/services` | Services | `pages/services.json` (tabbed services) |
| `/pricing` | Pricing | `pages/pricing.json`, `pricing-rules.json`, `couriers.json`, `offers.json` |
| `/tracking` | Tracking | `pages/tracking.json`, `couriers.json`, `settings.json` |
| `/about` | About | `pages/about.json` |
| `/contact` | Contact | `pages/contact.json`, `settings.json` (map embed) |
| `/privacy` | Privacy | `pages/privacy.json` |
| `/terms` | Terms | `pages/terms.json` |
| `*` | 404 | `NotFound.jsx` |

### Content files (`/content/`)

| File | Purpose |
|------|---------|
| `settings.json` | Site name, header menu, footer links, contact, map embed |
| `offers.json` | Offer strip (title, dates, code, CTA) |
| `couriers.json` | Partner list (logos, tracking URLs, display order) |
| `pricing-rules.json` | Rate card (weight ranges, distance zones per courier) |
| `pages/*.json` | Per-page copy + `meta` (title, description, keywords) |

See also: [`content/README.md`](content/README.md) for reserved Project 2 fields.

### Key features

**Pricing calculator** (`src/utils/pricingCalculator.js`)
- Filters active rules by weight range and active couriers
- Selects distance zone per rule
- Returns **top 3** results sorted by price (ascending)
- Form uses `parsePositiveNumber()` — rejects partial input like `2abc`

**Offers** (`src/utils/dates.js`, `OfferStrip.jsx`)
- `isOfferActive()` checks `active`, `startDate`, and `endDate` in **IST**
- Session dismiss (sessionStorage)
- Pricing WhatsApp message includes offer code only when offer is active
- `offerReminder` on Pricing page shown only when offer is active

**Tracking** (`Tracking.jsx`)
- Validates courier selection and tracking number
- Requires `{id}` in `tracking_url` template
- Opens partner site in new tab with `encodeURIComponent`

**Resilience**
- `PageContentGate` + `ContentError` on all content pages
- `DEFAULT_SETTINGS` fallback if `settings.json` fails to load
- `combineContentStates()` for pages with multiple JSON fetches

---

## 4. System flow

### Content pipeline (build + dev)

```
/content/*.json          ← EDIT HERE (source of truth)
        │
        ▼  npm run sync:content  (also runs on predev / prebuild)
public/content/*.json    ← GENERATED (gitignored)
        │
        ▼  browser fetch at runtime
useContent / SettingsContext
        │
        ▼
Pages → Components
```

**Rule:** Never edit `public/content/` by hand.

### Runtime layout

```
PublicLayout
├── SettingsProvider  (loads settings.json once)
├── OfferStrip        (offers.json, IST dates)
├── Header            (nav + logo from settings)
├── <main> Outlet     (page routes)
└── Footer            (links + logo from settings)
```

### Pricing flow (user)

```
User enters weight + distance
        → parsePositiveNumber validation
        → calculatePricing(rules, couriers)
        → Top 3 cards + optional offer reminder
        → WhatsApp CTA (with EAGLE15 if offer active)
```

### Verify / sign-off pipeline

```
npm run verify
├── sync:content
├── npm test          (19 unit tests)
├── npm run build     (production bundle)
├── vite preview      (dynamic port)
└── browser-qa.mjs    (159 checks @ 375 / 768 / 1440px)
```

Codespaces `postCreateCommand` runs install + Playwright Chromium + **`npm run verify`**.

---

## 5. Repository structure

```
eagle_logistics_new/
├── content/                 # JSON source of truth
│   ├── settings.json
│   ├── offers.json
│   ├── couriers.json
│   ├── pricing-rules.json
│   ├── pages/
│   └── README.md
├── public/
│   ├── assets/              # brand, hero, couriers, page images
│   ├── sitemap.xml
│   └── robots.txt
│   └── content/             # generated (gitignored)
├── scripts/
│   ├── sync-content.js
│   ├── compress-images.mjs
│   ├── generate-courier-logos.mjs
│   ├── browser-qa.mjs
│   └── codespaces-verify.mjs
├── src/
│   ├── App.jsx              # routes
│   ├── layouts/PublicLayout.jsx
│   ├── pages/               # 8 routes + NotFound
│   ├── components/
│   │   ├── public/          # Header, Footer, Hero, OfferStrip
│   │   └── common/          # Button, Card, PageContentGate, …
│   ├── context/SettingsContext.jsx
│   ├── hooks/useContent.js, useReducedMotion.js
│   ├── utils/               # pricing, dates, whatsapp, assets, numbers
│   └── config/settingsDefaults.js
├── .devcontainer/devcontainer.json
├── package.json
├── vite.config.js
├── README.md                # quick start
└── PROJECT1.md              # this document
```

---

## 6. NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Sync content + Vite dev server (`:5173`) |
| `npm run build` | Sync + production build → `dist/` |
| `npm run preview` | Serve production build |
| `npm run sync:content` | Copy `content/` → `public/content/` |
| `npm test` | Vitest unit tests |
| `npm run qa:browser` | Playwright QA (dev server must be running) |
| `npm run verify` | Full P1 sign-off pipeline |
| `npm run generate:logos` | Regenerate courier PNG logos |
| `npm run compress:images` | Optimize images in `public/assets/` |

---

## 7. Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_BASE_PATH` | `/` | Vite base URL (for future GitHub Pages subpath) |
| `QA_BASE_URL` | `http://localhost:5173` | Browser QA target URL |

> **Note:** `BrowserRouter` does not yet set `basename` from `VITE_BASE_PATH`. Required only for GitHub Pages subpath deploy (deferred).

---

## 8. Testing summary

| Layer | Count | Files |
|-------|-------|-------|
| Unit tests | 19 | `dates.test.js`, `numbers.test.js`, `pricingCalculator.test.js` |
| Browser QA | 159 checks | All routes, pricing calc, tabs, nav, map, logos, 3 viewports |

---

## 9. Contact & offer defaults (seed content)

| Field | Value |
|-------|-------|
| Address | Plot 42, Logistics Park, Gachibowli, Hyderabad, Telangana 500032 |
| Phone | +91 40 4521 8900 |
| WhatsApp | +919876543210 |
| Email | hello@eaglelogistics.in |
| Offer code | EAGLE15 (Monsoon Express, ends 2026-08-31 IST) |

---

## 10. Technical debt (known, not blocking P2)

| ID | Item | Fix when |
|----|------|----------|
| TD-1 | Router `basename` for subpath | GitHub Pages deploy |
| TD-2 | Sitemap/robots base-path aware | GitHub Pages deploy |
| TD-3 | `404.html` SPA fallback | GitHub Pages deploy |
| TD-4 | JSON Schema validation | Project 2 admin |
| TD-5 | Sanitize map embed HTML | Project 2 admin |
| TD-6 | CI workflow | Project 2 |
| TD-7 | Global Error Boundary | Optional |
| TD-8 | Official courier logos | Pre-public launch |

---

## 11. Project 2 handoff

Project 2 will add **admin + API** to CRUD the same JSON files. The public site should **not** be rewritten.

**Recommended P2 Sprint 1:** Settings + Offers admin (FastAPI + auth + forms for `settings.json` and `offers.json`).

**Preserved patterns for P2:**
- `useContent` hook (swap fetch URL to API later)
- Pure utils (`pricingCalculator`, `dates`) as behavior source of truth
- `content/README.md` reserved fields (`alternates`, `social`, etc.)

---

## 12. Quick start

```bash
git clone https://github.com/Husky1711/eagle_logistics_new.git
cd eagle_logistics_new
npm install
npm run verify    # recommended first run
npm run dev       # http://localhost:5173
```

**GitHub Codespaces:** Open repo → Create codespace → wait for `postCreateCommand` → `npm run dev`.

---

## 13. Release history (Project 1)

| Tag / commit | Summary |
|--------------|---------|
| `v1.0.0-p1` | P1 sign-off: startDate, pricing validation, docs |
| `5bc358c` | Logos, maps, responsive QA, verify script |
| `a231dfa` | Review fixes, unit/browser tests, error gates |
| `7d2a4e0` | UI QA, performance, image compression |
| `64d32bf` | Initial scaffold (Sprint 0–1) |

---

*Project 1 closed. Next: Project 2 — admin CMS for content management.*
