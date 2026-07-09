# Project 2 — Progress Status

**Branch:** `project-2`  
**Last updated:** July 9, 2026  
**Reference:** [PROJECT2.md](PROJECT2.md)

---

## Overall: ~50% complete

Sprints **1** and **2a** are **100% complete**. Sprints **2b** and **3** remain (~50% of total Project 2 scope).

**Latest commits on `project-2`:**

| Commit | Summary |
|--------|---------|
| `188f961` | Sprint 1 scaffold — FastAPI CMS API and admin app |
| `7a6a10d` | Auth CORS, session, and logout fixes |
| `146725c` | Sprint 2a — couriers CRUD, stable ids, a11y, E2E teardown |
| `8ecfd4d` | Codespaces public demo auto-start |

---

## By sprint

| Sprint | Scope | Status | Done |
|--------|--------|--------|------|
| **Sprint 1** | Auth, settings, offers, admin scaffold, API tests, dashboard timestamps | **Complete** | **100%** |
| **Sprint 2a** | Couriers API + admin UI + tests + quality + E2E teardown | **Complete** | **100%** |
| **Sprint 2b** | Pricing rules CRUD + GitHub Actions CI | Not started | **0%** |
| **Sprint 3** | Pages editor, media upload, map sanitizer, merge → `main` | Not started | **0%** |

Equal sprint weight: `(100 + 100 + 0 + 0) / 4 = 50%`

---

## Sprint 1 & 2a sign-off

| Check | Command |
|-------|---------|
| API tests (auth, settings, offers, couriers, meta, public sync) | `npm run test:api` |
| Couriers browser QA | `npm run qa:couriers` |
| Full admin E2E (settings → public, offers → public, couriers) | `npm run qa:sprint-1-2a` |

**Sprint 1 exit criteria:** login, edit phone/offer, save, visible on public site — covered by pytest sync tests + `qa:sprint-1-2a`.

**Sprint 2a exit criteria:** couriers CRUD, stable ids, tests — covered by `test_couriers.py` + `qa:couriers`.

---

## By requirement (PROJECT2.md §2)

| Requirement | Status |
|-------------|--------|
| Admin UI (shell + screens) | Partial — Login, Dashboard, Settings, Offers, Couriers |
| REST API | Partial — settings, offers, couriers, meta |
| Authentication | ✅ Done |
| Settings CRUD | ✅ Done |
| Offers CRUD | ✅ Done |
| Couriers CRUD | ✅ Done |
| Pricing rules CRUD | ❌ Sprint 2b |
| Page content CRUD | ❌ Sprint 3 |
| JSON validation | ✅ Done for existing endpoints |
| Map embed sanitization | ❌ Sprint 3 |
| Media upload | ❌ Sprint 3 |
| CI workflow | ❌ Sprint 2b |

**Content editors:** 3 of 5 major JSON surfaces → **60%** of CRUD work.

---

## What's still open

### Sprint 2b

- Pricing rules API + validated JSON editor
- GitHub Actions: `npm test` + `test:api` + `verify` on PRs

### Sprint 3

- All 8 `pages/*.json` editors
- Media upload to `public/assets/`
- Map embed sanitizer
- Merge `project-2` → `main`, tag `v2.0.0-p2`

---

## Visual snapshot

```text
Project 2 overall
█████████████████████████░░░░░░░░░░░░░░░░░  50%

Sprint 1   ████████████████████  100%
Sprint 2a  ████████████████████  100%
Sprint 2b  ░░░░░░░░░░░░░░░░░░░░    0%
Sprint 3   ░░░░░░░░░░░░░░░░░░░░    0%
```

---

## Bottom line

Sprints **1** and **2a** are signed off. Next: **Sprint 2b** (pricing rules + CI).

---

*Update this file as sprints complete.*
