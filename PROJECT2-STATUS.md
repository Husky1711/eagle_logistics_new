# Project 2 — Progress Status

**Branch:** `project-2`  
**Last updated:** July 9, 2026  
**Reference:** [PROJECT2.md](PROJECT2.md)

---

## Overall: ~48–50% complete

Roughly **half of Project 2 is done**. The **platform and first three content domains** are in place. **Pricing rules, pages, media, CI, and release** remain.

**Latest commits on `project-2`:**

| Commit | Summary |
|--------|---------|
| `188f961` | Sprint 1 scaffold — FastAPI CMS API and admin app |
| `7a6a10d` | Auth CORS, session, and logout fixes |
| `146725c` | Sprint 2a — couriers CRUD, stable ids, a11y, E2E teardown |

---

## By sprint

| Sprint | Scope | Status | ~Done |
|--------|--------|--------|-------|
| **Sprint 1** | Auth, settings, offers, admin scaffold, pytest, `dev:all` | Built on `project-2`; manual exit QA not formally signed off | **~95%** |
| **Sprint 2a** | Couriers API + admin UI + tests + E2E teardown | Shipped in `146725c` | **~95%** |
| **Sprint 2b** | Pricing rules CRUD + GitHub Actions CI | Not started | **0%** |
| **Sprint 3** | Pages editor, media upload, map sanitizer, merge → `main` | Not started | **0%** |

Equal sprint weight: `(95 + 95 + 0 + 0) / 4 ≈ 48%`

---

## By requirement (PROJECT2.md §2)

| Requirement | Status |
|-------------|--------|
| Admin UI (shell + screens) | Partial — Login, Dashboard, Settings, Offers, Couriers |
| REST API | Partial — settings, offers, couriers only |
| Authentication | ✅ Done (session cookie + CORS hardening) |
| Settings CRUD | ✅ Done |
| Offers CRUD | ✅ Done |
| Couriers CRUD | ✅ Done |
| Pricing rules CRUD | ❌ Not started |
| Page content CRUD | ❌ Not started |
| JSON validation | ✅ Done for existing endpoints; pricing/pages still to come |
| Map embed sanitization | ❌ Sprint 3 |
| Media upload | ❌ Sprint 3 |
| CI workflow | ❌ Sprint 2b |

**Content editors:** 3 of 5 major JSON surfaces → **60%** of CRUD work.

---

## What's solid (the "done" half)

- **Platform:** FastAPI app, `ContentStore` (atomic write + backup + sync), session auth, admin React app, npm workspaces, `dev:all`, pytest (38 tests passing).
- **Sprint 1:** Settings + offers end-to-end.
- **Sprint 2a:** Couriers with stable IDs, a11y fixes, API 409 on rename, browser QA with content restore.
- **Auth hardening:** CORS for alternate admin ports, session clear on login, logout behavior.

---

## What's still open (the other half)

### Near-term — Sprint 2b

- Pricing rules API + validated JSON editor
- GitHub Actions: `npm test` + `test:api` + `verify` on PRs

### Sprint 3

- All 8 `pages/*.json` editors
- Media upload to `public/assets/`
- Map embed sanitizer (bleach/allowlist)
- Optional: `offers.alternates` UI
- Merge `project-2` → `main`, tag `v2.0.0-p2`

### Polish (deferred — Batch 4)

- Dashboard "last saved" timestamp
- `VITE_PUBLIC_SITE_URL` instead of hardcoded `:5173`
- Empty login username field (remove prefill)

### Process gaps

- Sprint 1 manual QA sign-off (login → edit phone/offer → verify on `:5173`)
- `PROJECT2.md` still says "Planning" / lists Sprint 2a as remaining — doc is behind the code

---

## Visual snapshot

```text
Project 2 progress
████████████████████░░░░░░░░░░░░░░░░░░░░  ~48%

Sprint 1  ███████████████████░  95%
Sprint 2a ███████████████████░  95%
Sprint 2b ░░░░░░░░░░░░░░░░░░░░   0%
Sprint 3  ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## Bottom line

Past the **"MVP admin works"** milestone and through **couriers**. Remaining work is roughly **two full sprints** (pricing + CI, then pages/media/hardening/release) — about **50%** of the original P2 plan.

**Suggested next step:** Sprint 2b (pricing rules + CI), unless closing Sprint 1 manual QA first for a clean sign-off record.

---

*Update this file as sprints complete.*
