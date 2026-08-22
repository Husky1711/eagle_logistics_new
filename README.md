# Eagle Logistics — Public site

Static, responsive marketing website for **Eagle Logistics**.

> **Branch:** `public-site` — public marketing site only (no admin panel, no FastAPI backend).  
> Use this branch for **GoDaddy / static hosting** deploys.  
> Full CMS work stays on **`project-2`**.

> **Project 1 docs:** [PROJECT1.md](PROJECT1.md)

## What’s included

- Public routes: Home, Services, Pricing, Tracking, Cargo, Things We Send, Offers, About, Contact, Privacy, Terms
- Content-driven via JSON (`/content/` at repo root) — see `content/README.md`
- Pricing calculator powered by `pricing-rules.json` + client-side engine
- Images from repo assets only (`public/assets/`)
- Production SEO meta via `PageMeta` (title, description, Open Graph, Twitter, JSON-LD)

## Development

```bash
npm install
npm run sync:content
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build for GoDaddy (static hosting)

```bash
npm run build
```

Upload the contents of **`dist/`** into GoDaddy `public_html` (via File Manager or FTP).

For React Router SPA routes, add an `.htaccess` in `public_html` that rewrites unknown paths to `index.html`.

## Codespaces demo

1. GitHub → **Code** → **Codespaces** → **Create codespace on `public-site`**
2. Wait for install + content sync
3. Public site auto-starts on port **5173**

```bash
npm run demo:codespaces
npm run verify
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_BASE_PATH` | `/` | Vite base URL (use `/` on custom domain) |
| `VITE_PUBLIC_SITE_URL` | `https://www.eaglelogistics.in` | Canonical / Open Graph base URL |

## Related branches

| Branch | Purpose |
|--------|---------|
| `public-site` | Public site only — GoDaddy / static deploy |
| `project-2` | Admin CMS + FastAPI + public site |
| `main` | Project 1 freeze (`v1.0.0-p1`) |
