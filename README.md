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
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### GitHub Codespaces

Open this repo in Codespaces — `postCreateCommand` installs dependencies and syncs content.

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
