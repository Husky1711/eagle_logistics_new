# Eagle Logistics

Static, responsive marketing website for **Eagle Logistics** — a logistics aggregator that compares courier partners for the best shipping rates.

## Project 1 (current)

- 8 public routes: Home, Services, Pricing, Tracking, About, Contact, Privacy, Terms
- Content-driven via JSON (`/content/` at repo root)
- Pricing calculator powered by `pricing-rules.json` + client-side engine
- Images from repo assets only (`public/assets/`)

## Content workflow

**Source of truth:** `/content/` at the repository root.

**Never edit** `public/content/` by hand — it is generated.

```bash
npm run sync:content   # copies content/ → public/content/
npm run dev            # sync runs automatically (predev)
npm run build          # sync runs automatically (prebuild)
npm test               # unit tests (pricing calculator, offer dates)
npm run qa:browser     # browser QA (dev server on :5173)
npm run verify         # full sign-off: test + build + preview + browser QA
```

## Development

```bash
npm install
npm run generate:logos # one-time courier logo assets (already committed)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### GitHub Codespaces

1. Open [eagle_logistics_new](https://github.com/Husky1711/eagle_logistics_new) on GitHub → **Code** → **Codespaces** → **Create codespace on main**.
2. Wait for `postCreateCommand` — installs deps, Playwright Chromium, then runs **`npm run verify`** (unit tests, production build, and browser QA on preview).
3. If verify passes, start the dev server for manual review:

```bash
npm run dev
```

4. When port **5173** is forwarded, open the preview URL and spot-check all routes.

Manual full sign-off (local or Codespaces):

```bash
npm run verify
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_BASE_PATH` | `/` | Base URL for GitHub Pages (`/eagle_logistics_new/`) |

## Asset sources

Images copied from reference repo branch `render-v1.0.0` ([Husky1711/eagle](https://github.com/Husky1711/eagle)).

## Project 2 (planned)

Admin panel + FastAPI backend to CRUD the same JSON files (content, offers, pricing rules, SEO, media).

## Reference

- **New repo:** [eagle_logistics_new](https://github.com/Husky1711/eagle_logistics_new)
- **Reference only:** [Husky1711/eagle](https://github.com/Husky1711/eagle) (`render-v1.0.0` branch)
