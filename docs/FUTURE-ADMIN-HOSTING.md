# Future development — Admin CMS hosting & deployment

**Status:** Deferred (reference doc)  
**Branch when written:** `project-2`  
**Last updated:** August 23, 2026  
**Domain:** `eaglelogistics.in` (GoDaddy cPanel shared hosting)

This document captures hosting/deployment discussions so work can resume without re-deciding from scratch.

---

## 1. Current decision (August 2026)

| Area | Decision |
|------|----------|
| **Public website** | Deploy static build to GoDaddy cPanel (`public_html` or subdomain e.g. `new.eaglelogistics.in`, future `latest.eaglelogistics.in`) |
| **Admin CMS (live)** | **Deferred** — not hosted on production yet |
| **API (FastAPI)** | **Deferred** — keep running locally for edits |
| **Editor workflow (now)** | Edit locally via `npm run dev:all` → build → upload static site to GoDaddy when needed |
| **Priority** | Ship/maintain public site first; live admin hosting = future sprint |

---

## 2. Client & traffic context

Understanding usage drives the hosting choice:

| Factor | Reality |
|--------|---------|
| Site type | Mostly static marketing site (content-driven JSON + assets) |
| Edit frequency | **Rare** — often monthly or in off-season |
| Who edits | Client via admin panel (when live); developer locally (for now) |
| Traffic | Normal small-business / regional logistics traffic (not high-scale dynamic app) |
| Database | **None** — JSON files under `/content/` + images under `/public/assets/` |

**Implication:** Paying for 24/7 API hosting is optional until the client needs browser-based editing in production. Local admin + periodic static deploy is acceptable short-term.

---

## 3. What we have today (architecture)

Three separate apps in development:

| App | Tech | Dev URL | Role |
|-----|------|---------|------|
| **Public website** | Vite + React | `:5173` | What visitors see |
| **Admin CMS** | Vite + React (`admin/`) | `:5174` | Edit content, upload images |
| **API** | Python FastAPI | `:8000` | Auth, JSON CRUD, media upload, sync to `public/content/` |

**Data flow:**

```
Admin UI  →  API  →  /content/*.json
                  →  sync-content  →  /public/content/
                  →  /public/assets/ (uploads)
Public site reads /content/ (via synced public/content/ at build or runtime)
```

**Local dev:**

```bash
npm run dev:all   # public :5173, admin :5174, API :8000
```

**Auth note:** Admin must use `http://127.0.0.1:5174` (not `localhost`) for session cookies in dev.

---

## 4. Current GoDaddy setup

From cPanel (August 2026):

| Item | Value |
|------|-------|
| Hosting type | **Shared cPanel** (not VPS) |
| Primary domain | `eaglelogistics.in` |
| Existing subdomain | `new.eaglelogistics.in` — **public website only** (static) |
| Home directory | `/home/hzyoh9991nn` |
| Web root | `public_html/` |
| SSL | Was expired at time of discussion — fix before go-live |
| Subdomains available | 1/10 used |

**What shared cPanel supports well:**

- Static HTML/JS/CSS (Vite `dist/` output)
- PHP
- Subdomains + SSL
- File Manager / FTP / Git™ Version Control

**What shared cPanel does not support reliably:**

- Python FastAPI (always-on server)
- Full Node.js API (only on some plans via “Setup Node.js App” — not guaranteed)

---

## 5. Requirements (when we resume hosting work)

### Must-have (production admin)

- [ ] Client can log in to admin over **HTTPS**
- [ ] Save updates JSON content without developer IDE access
- [ ] Image upload/replace for Home, Offers, couriers, etc.
- [ ] Changes appear on public site after save/sync
- [ ] Strong password + secret keys (not `change-me-in-production`)
- [ ] CORS and cookies configured for production admin URL

### Nice-to-have

- [ ] Staging subdomain (e.g. `latest.eaglelogistics.in` + `admin.latest.eaglelogistics.in`)
- [ ] Automated deploy (Git push → build → upload)
- [ ] Backup of content JSON and uploaded assets

### Non-goals (for this project scale)

- High-traffic dynamic backend
- Dedicated database
- Multi-tenant CMS

---

## 6. Scenarios & options discussed

### Scenario A — Public site only on GoDaddy (current path)

**Setup:** Build locally → upload `dist/` + `public/content/` + `public/assets/` to `public_html` or subdomain.

| Pros | Cons |
|------|------|
| Works on existing plan | No live admin |
| Cheap, simple | Client cannot edit in browser |
| Low traffic friendly | Manual rebuild + re-upload for each content change |

**Best when:** Client edits rarely; developer handles updates.

---

### Scenario B — Staging subdomain (`latest.eaglelogistics.in`)

**Setup:** Same as A, but on `latest.eaglelogistics.in` for testing before promoting to main domain.

| Pros | Cons |
|------|------|
| Safe preview environment | Still no live admin without API |
| Same cPanel workflow | Extra subdomain + SSL to manage |

**Best when:** Testing new builds before updating `eaglelogistics.in` or `new.`.

---

### Scenario C — Hybrid: GoDaddy (sites) + Render/Railway (API) ⭐ recommended when going live

**Setup:**

```
eaglelogistics.in              → public static (GoDaddy)
admin.eaglelogistics.in        → admin static build (GoDaddy)
api.eaglelogistics.in          → FastAPI (Render or Railway)
```

DNS: CNAME `api` → Render/Railway; A records for main/admin → GoDaddy.

| Pros | Cons |
|------|------|
| **No API rewrite** — keep existing Python + tests | Third-party dependency |
| Free/cheap tier often enough for rare edits | Render free tier sleeps (cold start ~30s) |
| GoDaddy stays for domain + static hosting | Need production `.env` (secrets, CORS) |
| Fits rare monthly edit pattern | |

**Render/Railway cost (approx.):**

- **Free tier:** Often sufficient for staging / rare client use (may sleep, limited hours)
- **Paid (~$7/mo):** Always-on API, no cold starts — better if client expects instant admin
- **Secrets:** `SESSION_SECRET`, `ADMIN_PASSWORD` — environment variables on host (not a separate “subscription for keys”); domain SSL usually free via Render + Let’s Encrypt

**Best when:** Client needs browser admin occasionally; want minimum rewrite effort.

---

### Scenario D — GoDaddy VPS (all-in-one)

**Setup:** One Linux VPS — nginx serves public + admin static; uvicorn runs FastAPI; all subdomains on one machine.

| Pros | Cons |
|------|------|
| Everything on GoDaddy, one bill | ~$5–10+/mo |
| Keep Python API as-is | Server setup & maintenance (nginx, systemd, SSL) |
| No cold starts | Overkill if edits are monthly |

**Best when:** Client wants single provider and predictable always-on admin.

---

### Scenario E — Rewrite API to Node.js for cPanel

**Idea:** Port FastAPI → Express/Fastify so it might run on GoDaddy “Setup Node.js App”.

| Pros | Cons |
|------|------|
| Single JS stack with React | **Large rewrite** (~10 routers, validation, 67+ tests) |
| JSON file logic is simple | Node on shared hosting still limited / not on all plans |
| | Regression risk; weeks of work |

**Verdict:** Only if cPanel **confirmed** has Node.js **and** client refuses external API host. Not recommended while Python API works.

---

### Scenario F — Rewrite API to PHP for cPanel

**Idea:** Thin PHP endpoints for login, JSON save, upload — native to shared hosting.

| Pros | Cons |
|------|------|
| Best fit for shared cPanel | Full rewrite (different language) |
| No external host | Maintain PHP + Python parity during migration |

**Verdict:** Best *shared-hosting-native* rewrite option, but still high effort vs hybrid.

---

### Scenario G — Local admin only + Git/FTP deploy (interim)

**Setup:** Developer runs `npm run dev:all` locally → commit/build → upload static site to GoDaddy (or GitHub Action → FTP).

| Pros | Cons |
|------|------|
| **Zero API hosting cost** | Client cannot self-serve edit in browser |
| Works today | Developer bottleneck |
| Matches “rare edits” | |

**Verdict:** **Current approach until future sprint.**

---

### Scenario H — Git-based CMS (Decap CMS, etc.)

**Setup:** Admin commits content to GitHub; CI builds and deploys to GoDaddy.

| Pros | Cons |
|------|------|
| No runtime API on GoDaddy | Workflow change; GitHub access for client |
| Version history built-in | Different from current admin UI |

**Verdict:** Alternative architecture — not planned unless requirements change.

---

## 7. Can React replace the API?

**No.** React (admin UI) runs in the browser. It cannot securely write files on the server. Something server-side (Python, Node, PHP, or hosted API) is always required for save/upload.

---

## 8. Decision matrix (quick reference)

| Priority | Recommended approach |
|----------|---------------------|
| **Lowest cost, rare edits, dev handles updates** | **G — Local admin + static deploy** *(current)* |
| **Client edits in browser, minimal dev work** | **C — Hybrid (GoDaddy + Render API)** |
| **All on GoDaddy, always-on, no third party** | **D — GoDaddy VPS + existing Python API** |
| **Must stay on shared cPanel only, no external API** | **F — PHP rewrite** (or E — Node if cPanel has it) |
| **Preview new builds** | **B — `latest.` subdomain** (public static) |

---

## 9. Decision-making questions (use when resuming)

Answer these before picking a path:

1. **How often will the client edit content?** (weekly / monthly / quarterly)
2. **Must the client edit without calling a developer?**
3. **Is a 30-second cold start on free API tier acceptable?** (Render free)
4. **Budget for hosting?** ($0 / ~$7/mo / ~$10+ VPS)
5. **Must everything stay on GoDaddy only?**
6. **Does cPanel show “Setup Node.js App” or “Setup Python App”?** (check before rewrite options)
7. **Staging needed?** (`latest.` subdomain before main domain)
8. **Who deploys after edits?** (client save auto-sync vs developer upload)
9. **SSL fixed on all domains/subdomains?**
10. **Accept third-party API host (Render/Railway)?**

### Suggested answers for Eagle Logistics (August 2026)

| Question | Answer |
|----------|--------|
| Edit frequency | Rare (monthly / off-season) |
| Client self-serve | Desired **eventually**, not blocking launch |
| Budget | Minimize recurring cost until needed |
| GoDaddy-only | Preferred for **website**; API can be external |
| **Interim choice** | Local admin + static GoDaddy deploy |
| **Future choice** | Hybrid (C) when client needs live admin |

---

## 10. When we resume — suggested sprint outline

### Phase 1 — Public production hardening (no API)

- [ ] Fix SSL on `eaglelogistics.in` / subdomains
- [ ] Deploy production build to main or `latest.` subdomain
- [ ] Add `.htaccess` SPA fallback
- [ ] Verify pricing calculator, offers, contact, meta/SEO

### Phase 2 — Staging subdomains (optional)

- [ ] Create `latest.eaglelogistics.in` (public)
- [ ] Document build + upload checklist

### Phase 3 — Live admin (future)

- [ ] Choose: Hybrid (C) vs VPS (D)
- [ ] Production `backend/.env`: `ADMIN_PASSWORD`, `SESSION_SECRET`, `CORS_ORIGINS`
- [ ] Production `admin/.env.production`: `VITE_API_URL`, `VITE_PUBLIC_SITE_URL`
- [ ] Deploy API → smoke test login, save Home, upload image
- [ ] Deploy admin static → `admin.` or `admin.latest.`
- [ ] Run `npm run qa:home-page` against staging URLs
- [ ] Client handoff + password rotation

---

## 11. Build & deploy commands (reference)

### Public site → GoDaddy

```bash
npm install
npm run build
# Upload dist/* → public_html/
# Upload public/content/ → public_html/content/
# Upload public/assets/ → public_html/assets/ (or ensure assets in dist)
```

### Admin (when hosting UI)

```bash
cd admin
# Set VITE_API_URL and VITE_PUBLIC_SITE_URL for production
npm run build
# Upload admin/dist/* → admin subdomain document root
```

### Local editing (current workflow)

```bash
npm run dev:all
# Admin: http://127.0.0.1:5174
# Public preview: http://127.0.0.1:5173
# API: http://127.0.0.1:8000
```

---

## 12. Related repo docs

| Doc | Purpose |
|-----|---------|
| [PROJECT1.md](../PROJECT1.md) | Public static site |
| [PROJECT2.md](../PROJECT2.md) | Admin CMS scope & sprints |
| [README.md](../README.md) | Dev setup |
| `backend/.env.example` | API secrets template |
| `admin/.env.example` | Admin API URL template |

---

## 13. Discussion log (summary)

| Date | Topic | Outcome |
|------|-------|---------|
| Aug 2026 | GoDaddy cPanel for full stack | Public yes; API no on shared plan |
| Aug 2026 | `new.eaglelogistics.in` | Public website only |
| Aug 2026 | `latest.` subdomain for testing | Good idea for staging public site |
| Aug 2026 | Convert API to Node/React | React cannot replace API; Node rewrite possible but costly |
| Aug 2026 | Render for API | Recommended **when** live admin needed; free tier OK for rare use |
| Aug 2026 | Client edit frequency | Rare → defer live admin; edit locally for now |
| Aug 2026 | OneDrive file lock on save | Fixed via `content_store.py` in-place write fallback |

---

## 14. Open items (not blocked for static launch)

- [ ] Production deploy checklist script or GitHub Action (FTP/Git)
- [ ] `admin/.env.production.example` with staging/production URL patterns
- [ ] Render/Railway deploy config (`render.yaml` or Dockerfile) — when Phase 3 starts
- [ ] nginx / `.htaccess` templates for admin subdomain

---

*This file is the reference point for resuming admin/API hosting work. Update the decision table in §1 when the approach changes.*
