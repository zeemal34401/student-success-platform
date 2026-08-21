# Vercel deployment notes

This app deploys as:
- **Frontend:** Vite static build (`dist/`)
- **API:** Express serverless function (`api/index.js`)

## Important limitations on Vercel

1. **SQLite is ephemeral** — the database lives in `/tmp` and may reset on cold starts. Demo data is re-seeded automatically.
2. **ML microservices** (ports 8000–8003) are not hosted on Vercel. Risk predictions use built-in heuristic fallbacks when ML URLs are unreachable.
3. **Avatar uploads** are stored in `/tmp` and are not durable across cold starts.
4. For durable production storage, migrate to PostgreSQL (Neon/Supabase) and host ML elsewhere.

## Required environment variables

Set these in the Vercel project settings:

| Variable | Example |
|---|---|
| `JWT_SECRET` | long random string (32+ chars) |
| `ALLOW_DEMO_ACCOUNTS` | `true` (for conference demos) |
| `CORS_ORIGIN` | `*` |
| `APP_BASE_URL` | `https://your-app.vercel.app` |
| `VITE_API_URL` | `/api` |

Optional SMTP vars if you want invite/reset emails.
