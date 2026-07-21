---
id: IO-supabase-setup
written on: 14/07/2026
---
[[Portfolio]]

# Supabase — connect Gestalt 1.0

One Supabase project hosts **Auth + Postgres** for all Gestalt products. Portfolio reads/writes the `portfolio` schema from the browser (static export + `@supabase/supabase-js`).

## 1. Project keys

Supabase Dashboard → **Project Settings → API**

| Copy | Env var |
|------|---------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Local file (never commit):

```bash
cp .env.example .env.local
# edit .env.local with your URL and key
```

Restart `npm run dev` after saving `.env.local`.

## 2. Apply database DDL (SQL Editor)

Run in order on the **same** Supabase Postgres:

| # | File |
|---|------|
| 1 | `data/schema/deviante/schema.sql` + table files (if not applied) |
| 2 | `data/schema/milebrick/schema.sql` + table files (if not applied) |
| 3 | `data/schema/portfolio/schema.sql` |
| 4 | `data/schema/portfolio/users.sql` |
| 5 | `data/schema/portfolio/product_access.sql` |
| 6 | `data/schema/portfolio/access_requests.sql` |
| 7 | `data/schema/portfolio/products.sql` |
| 8 | `data/schema/portfolio/artifacts.sql` |
| 9 | `data/schema/portfolio/grants.sql` |
| 10 | `data/seed/portfolio/seed.sql` |
| 11 | `data/seed/portfolio/artifacts.sql` |

Or connect **DataGrip** to the pooler URI from Settings → Database (see `doc/agents/database.md`).

Verify:

```sql
SELECT code, name, status FROM portfolio.products ORDER BY sort_order;
SELECT product_code, code, title, is_public FROM portfolio.artifacts ORDER BY product_code, sort_order;
```

## 3. Auth URLs

See [[auth-setup]] — **Site URL must be `https://alander.io`**, not a product subdomain.

## 4. Google OAuth

Dashboard → **Authentication → Providers → Google** — enable and paste client ID/secret from Google Cloud Console.

## 5. Test locally

```bash
npm run dev
```

Open http://localhost:3000/login → Google. Owner e-mails bootstrap automatically: `design@alander.io`, `alanderavila@gmail.com`.

## 6. GitHub Pages (production)

Repository secrets (Settings → Secrets → Actions):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Push to `main` → workflow rebuilds with inlined env vars.

## DB vs JSON — when to use what

| Data | v1.0 source | Why |
|------|-------------|-----|
| Users, access, requests | **Supabase** `portfolio.*` | Auth + RLS; changes at runtime |
| Product registry (status, icons) | **Supabase** `portfolio.products` | Owner updates without redeploy (UC8) |
| Artifact index (UCs, scope, links) | **Supabase** `portfolio.artifacts` | Sync hub; public flag per row |
| Quest log / UC % | **Git** `content/gestalt-roadmap.json` | High churn; owner-only panel |

**Recommendation:** connect Supabase now for auth + products table. Keep quest progress in JSON until you need live edits from Admin without a commit.

## Product status

| Status | Meaning |
|--------|---------|
| **designing** | ORCA / scope / user stories — no build quests yet |
| **developing** | Active implementation (quests in roadmap) |

UI reads status from `products.js` today; UC8 will read `portfolio.products` as source of truth.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Supabase não configurado` | Missing `.env.local` or dev server not restarted |
| Login redirects to dead subdomain | Site URL → `https://alander.io` |
| RLS denied on insert | Run `grants.sql`; sign in as owner first |
| Tables missing | Re-run DDL block from step 2 |
