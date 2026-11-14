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

The build also **pre-renders every page** (`scripts/prerender.mjs`, runs after `vite build` using Playwright's Chromium) so search engines and link previews get real HTML per page:
`dist/index.html`, `dist/services.html`, `dist/things-we-send/books.html`, … plus `dist/404.html`.
Pages come from `public/sitemap.xml`, so add new routes there. Skip with `PRERENDER=0 npm run build`.

Upload the contents of **`dist/`** (including the hidden **`.htaccess`**) into the site's folder in GoDaddy (via File Manager or FTP).
`.htaccess` maps `/services` → `services.html`, returns a real 404 for unknown URLs, and forces HTTPS + `www` **only** on the main `eaglelogistics.in` domain, so it is also safe on `new.eaglelogistics.in`.

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
