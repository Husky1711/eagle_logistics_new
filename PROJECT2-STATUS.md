# Project 2 — Progress Status

**Branch:** `project-2`  
**Last updated:** July 9, 2026 (Sprint 2b signed off)  
**Reference:** [PROJECT2.md](PROJECT2.md)

---

## Overall: ~75% complete

Sprints **1**, **2a**, and **2b** are **100% complete** and browser-tested. Sprint **3** remains.

---

## By sprint

| Sprint | Scope | Status | Done |
|--------|--------|--------|------|
| **Sprint 1** | Auth, settings, offers, admin scaffold, API tests, dashboard timestamps | **Complete** | **100%** |
| **Sprint 2a** | Couriers API + admin UI + tests + quality + E2E teardown | **Complete** | **100%** |
| **Sprint 2b** | Pricing rules CRUD + JSON editor + CI + browser QA | **Complete** | **100%** |
| **Sprint 3** | Pages editor, media upload, map sanitizer, merge → `main` | Not started | **0%** |

Weighted: `(100 + 100 + 100 + 0) / 4 = 75%`

---

## Sprint 2b sign-off (browser-tested)

| Check | Command | Result |
|-------|---------|--------|
| API tests (pricing rules + meta) | `npm run test:api` | **52/52** |
| Pricing rules browser QA (headed) | `npm run qa:pricing-rules:headed` | **15/15** |
| Full user + admin walkthrough (headed) | `npm run qa:walkthrough` | **33/33** |
| Full admin E2E (incl. pricing rules) | `npm run qa:sprint-2b` | **40/40** |

**Sprint 2b exit criteria covered:**

- GET/PUT `/api/admin/pricing-rules` with validation
- Unknown courier rejected; rule id rename blocked
- Admin JSON editor with client + API errors
- Save syncs to `public/content/pricing-rules.json`
- Public shipping calculator reflects rate changes
- Dashboard last-saved timestamp
- GitHub Actions CI (`npm test` + `test:api`)

---

## By requirement (PROJECT2.md §2)

| Requirement | Status |
|-------------|--------|
| Admin UI (shell + screens) | Partial — Login, Dashboard, Settings, Offers, Couriers, Pricing rules |
| REST API | Partial — settings, offers, couriers, pricing-rules, meta |
| Authentication | ✅ Done |
| Settings CRUD | ✅ Done |
| Offers CRUD | ✅ Done |
| Couriers CRUD | ✅ Done |
| Pricing rules CRUD | ✅ Done |
| Page content CRUD | ❌ Sprint 3 |
| JSON validation | ✅ Done |
| Map embed sanitization | ❌ Sprint 3 |
| Media upload | ❌ Sprint 3 |
| CI workflow | ✅ Done |

**Content editors:** 4 of 5 major JSON surfaces → **80%** of CRUD work.

---

## What's next

### Sprint 3

- All 8 `pages/*.json` editors
- Media upload to `public/assets/`
- Map embed sanitizer
- Merge `project-2` → `main`, tag `v2.0.0-p2`

---

## Visual snapshot

```text
Project 2 overall
█████████████████████████████████████░░░░░  75%

Sprint 1   ████████████████████  100%
Sprint 2a  ████████████████████  100%
Sprint 2b  ████████████████████  100%
Sprint 3   ░░░░░░░░░░░░░░░░░░░░    0%
```

---

## Bottom line

Sprints **1**, **2a**, and **2b** are signed off with headed browser QA. The client can edit courier partners and pricing rate cards in admin without a developer. Next: **Sprint 3** (page editors + media).

---

*Update this file as sprints complete.*
