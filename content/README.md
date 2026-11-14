# Content JSON (`/content/`)

Source of truth for the public site. Edit files here, then run `npm run sync:content` (or `npm run dev` / `npm run build`, which sync automatically).

**Do not edit** `public/content/` by hand — it is generated.

## Files

| File | Purpose |
|------|---------|
| `settings.json` | Site name, header nav, footer links, contact details |
| `offers.json` | Promotional offer strip (title, dates, code, CTA) |
| `couriers.json` | Courier partners for home grid and tracking |
| `pricing-rules.json` | Rate card for the pricing calculator |
| `pages/*.json` | Per-page copy and SEO meta |

## Reserved for Project 2

Some fields exist in JSON today but are not used by the public site yet. **Keep them** — they define the schema for the future admin panel:

- `offers.alternates` — additional campaigns to rotate or schedule in admin
- `settings.social` — social profile URLs for footer/icons
- `pages/contact.json` → `content.emailCta` — optional secondary CTA label

Project 2 admin will CRUD these files; the site will read them via the same fetch pattern (or API).
