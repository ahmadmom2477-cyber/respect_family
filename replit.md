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
- Configured via `ADMIN_USER_IDS` env var (comma-separated Clerk user IDs)
- If `ADMIN_USER_IDS` is unset, ALL signed-in users are admins (dev convenience). Set the env var with the desired Clerk user IDs in production.

## Database tables
- `streamers` — channel directory with cached Kick metadata
- `channel_requests` — pending/approved/rejected community submissions
- `favorites` — (user_id, username) pairs

## Seeding
Initial streamers seeded via `artifacts/api-server/scripts/seed.ts`. The Kick public API is rate-limited per host; placeholder data is filled in on 4xx and refreshed on the next request after 5 minutes.

## Branding
- Logo at `artifacts/respect-family/public/respect-logo.jpg`
- Purple gradient theme throughout (deep violet → electric purple → soft lilac on dark base)
