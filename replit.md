# Respect Family

A Kick.com community hub for the Respect Family streaming crew.

## Features
- Public homepage with searchable streamer grid (live first, sorted by viewers)
- Per-streamer detail page with profile, banner, live status, "Watch on Kick" button
- Channel request form (anyone can submit a username)
- Favorites for signed-in users (max 50)
- Admin dashboard: approve/reject requests, add/remove channels, view stats
- Live status fetched from Kick.com public API, cached 5 minutes per streamer

## Stack
- Frontend: React + Vite (`artifacts/respect-family`)
- Backend: Express + Drizzle ORM (`artifacts/api-server`)
- Database: PostgreSQL (Replit-managed)
- Auth: Clerk (modal sign-in/up; custom purple-themed appearance)
- API contract: OpenAPI in `lib/api-spec/openapi.yaml`, codegen via orval to `lib/api-client-react` (TanStack Query hooks) and `lib/api-zod` (Zod schemas)

## Admin access
- Primary admin: `3x51hb@gmail.com` (hardcoded protected, cannot be removed).
- Email allowlist managed in DB table `admin_emails` via Admin Dashboard → "Admins" tab.
- Optional bootstrap env vars: `ADMIN_EMAILS` (comma-separated emails) and `ADMIN_USER_IDS` (comma-separated Clerk user IDs).

## Database tables
- `streamers` — channel directory with cached Kick metadata
- `channel_requests` — pending/approved/rejected community submissions
- `favorites` — (user_id, username) pairs
- `admin_emails` — admin allowlist managed via UI, seeded with `3x51hb@gmail.com`

## Streamer data
- Source: Apify actor `nsKvwON2gtX9xQf05` (kick-scraper). Auth via `APIFY_API_TOKENS` (comma-separated for round-robin rotation across multiple tokens).
- Cache TTL: 5 minutes per streamer in DB.
- List endpoint returns cached data immediately and triggers a non-blocking background refresh, keeping page loads fast.
- Initial seed: `pnpm --filter @workspace/api-server exec tsx scripts/seed.ts`.

## Branding
- Logo at `artifacts/respect-family/public/respect-logo.jpg`
- Purple gradient theme (deep violet → electric purple → soft lilac on dark base)
- Hero: "مرحبا بك في عالم ريسبكت" / "Welcome to the world of Respect" with personalized greeting using the signed-in user's first name.

## Render deployment
**Build command:**
```
corepack enable && pnpm install --frozen-lockfile && pnpm --filter @workspace/db push && pnpm --filter @workspace/api-server run build && pnpm --filter @workspace/respect-family run build
```
**Start command:**
```
pnpm --filter @workspace/api-server run start
```
The Express server in production should serve the built Vite assets from `artifacts/respect-family/dist`. Set `PORT` to whatever Render provides (default `10000`).

**Required env vars on Render:**
- `DATABASE_URL` — Postgres connection string (Render Postgres or external)
- `CLERK_SECRET_KEY` — Clerk backend secret
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `VITE_CLERK_PUBLISHABLE_KEY` — same as above (build-time for Vite)
- `APIFY_API_TOKENS` — comma-separated Apify tokens (rotated round-robin)
- `ADMIN_EMAILS` — (optional) bootstrap admin emails, comma-separated
- `NODE_ENV=production`
