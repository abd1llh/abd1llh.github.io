# Backend Setup — abd1llh.online

Your site now has a **Node.js API** (`/api/*`) + **Supabase** database.

## Architecture

```
Browser → nginx (port 80) → static files (HTML/CSS/JS)
                         → /api/* → Node.js (port 3000)
                                      → Supabase (PostgreSQL)
```

## 1. Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → run the full script in `supabase/schema.sql`.
3. Go to **Project Settings → API** and copy:
   - Project URL → `SUPABASE_URL`
   - `anon` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (never expose in frontend)

## 2. Environment variables

On your server, create `.env` from `.env.example`:

```env
SUPABASE_URL=https://srtpssnpeweunscltvbr.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-strong-password-here
JWT_SECRET=random-64-char-string
PORT=3000
NODE_ENV=production
```

## 3. Deploy (Docker)

```bash
docker build -t my-website-image .
docker stop my-website-container || true
docker rm my-website-container || true
docker run -d --name my-website-container -p 80:80 --env-file .env my-website-image
```

GitHub Actions: add the same variables as **repository secrets**, then update `deploy.yml` to pass `--env-file` or `-e` flags.

## 4. API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Public feature flags |
| GET | `/api/writeups?lang=en` | Published writeups |
| POST | `/api/contact` | Contact form |
| POST | `/api/visits` | Record page visit |
| POST | `/api/admin/login` | Dashboard login |
| GET | `/api/admin/stats` | Stats (auth required) |
| GET | `/api/admin/visitors` | Visitors (auth required) |
| GET | `/api/admin/contacts` | Messages (auth required) |

## 5. Dashboard

URL: `https://abd1llh.online/en/pages/dashboard.html`

Login with `ADMIN_PASSWORD` from `.env` (not `1234` anymore).

## 6. Add writeups

In Supabase **Table Editor → writeups**, insert rows or change `status` to `published`.

Fields: `slug`, `title_en`, `title_ar`, `excerpt_en`, `excerpt_ar`, `category_en`, `category_ar`, `status`, `published_at`.
