# Offers admin — how it works and how to go live

Branch: `offers-admin` (not deployed until SSL is installed).

## What it is

| Part | Where | Notes |
|------|-------|-------|
| Admin screens (React) | `/admin` → `src/admin/` | Login, offers list, offer editor with live preview, Offers-page banner, change password. Separate JS chunk — visitors never download it. |
| PHP API | `/api/*.php` → `public/api/` | `auth.php`, `offers.php`, `upload.php`, `feedback.php`, `setup.php`. PHP 7.4+ / 8.x. |
| Data | `~/eagle-data/` on the server (outside `public_html`) | `config.php` (hashed password, feedback email), `offers.json`, `backups/` (last 30 saves), `state/` (rate limits). Never in git, never overwritten by deploys. |
| Uploaded banners | `public_html/uploads/offers/` | Script execution blocked by an auto-created `.htaccess`. Not in git. |

Where offers appear on the site:
- **Offers page** — banner + a card for each live offer, in admin order.
- **Home page promo strip** — first live offer with "Show on home page strip" ticked.
- If `/api` isn't reachable, both fall back to the built-in content in `content/`.

Offers go live/expire automatically by start/end date (India time).

## Security
- Password stored as a bcrypt hash; change it from the admin.
- 5 wrong logins → 15-minute lock (per IP). 30-minute idle logout. Session cookie: HttpOnly, SameSite=Strict, Secure on HTTPS.
- CSRF token required on every admin change.
- Uploads: real JPG/PNG/WebP only (checked by content, not name), ≤ 2 MB, ≥ 600 px wide, random file names.
- Feedback: honeypot field, 5 messages/hour per IP, header-injection safe, Reply-To = visitor.
- `/admin` and `/api` are `noindex` and disallowed in `robots.txt`.
- **Do not use the admin over plain http.** The admin shows a warning banner when the connection isn't HTTPS.

## Image sizes for the client
| Image | Size | Notes |
|-------|------|-------|
| Offer banner (card) | 1200 × 800 px (3:2) | Price badge sits bottom-left. |
| Offers page banner | 1920 × 480 px (4:1) | Heading is placed on top; phones crop the sides — no text in the image. |
All: JPG / PNG / WebP, under 2 MB.

## Local development
```bash
npm run dev:php   # PHP API on :8080 (needs PHP 7.4+; set PHP_BIN if php isn't on PATH)
npm run dev       # site on :5173, proxies /api and /uploads to :8080
```
Local data lives in `./eagle-data/` (git-ignored). Feedback emails are written to `eagle-data/mail.log` instead of being sent.
First run: create an empty file `eagle-data/ALLOW_SETUP`, open http://localhost:5173/admin and create the account.

## Going live (after SSL is installed on eaglelogistics.in + www)
1. Switch the site to https (see the commented rules in `public/.htaccess`, and change `http://www.eaglelogistics.in` to `https://…` in `sitemap.xml`, `robots.txt`, `PageMeta.jsx`, `settings.json`, `settingsDefaults.js`).
2. cPanel → **Select PHP Version** → 8.2 or newer (also removes GoDaddy's "PHP Extended Support" charge).
3. Merge `offers-admin` into `public-site` and push; wait for GitHub to build the `deploy` branch.
4. cPanel → Git Version Control → Update from Remote → Deploy HEAD Commit (copies `api/` into `public_html`).
5. cPanel → File Manager → home folder → create folder `eagle-data` → inside it create an empty file `ALLOW_SETUP`.
6. Open `https://www.eaglelogistics.in/admin` → create the admin account (username, strong password, the Gmail address for feedback). `ALLOW_SETUP` is deleted automatically.
7. Test: log in, add an offer, upload a banner, check `/offers` and the home strip; send a test message from the Contact page and check the Gmail inbox **and spam folder**.
8. Email deliverability: in GoDaddy DNS make sure the SPF TXT record includes the hosting server (GoDaddy: `v=spf1 include:secureserver.net -all` or as GoDaddy support advises). Mark the first email "Not spam" in Gmail.

## Backups / undo
- Every save keeps the previous `offers.json` in `~/eagle-data/backups/` (last 30). To undo: copy a backup over `~/eagle-data/offers.json` in File Manager.
- Include `~/eagle-data/` and `public_html/uploads/` in any manual backup.
