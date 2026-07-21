# Portfolio — Supabase Auth setup

OAuth from **alander.io** must return to **alander.io**, not a product subdomain.

## Supabase Dashboard → Authentication → URL Configuration

| Field | Value |
|-------|--------|
| **Site URL** | `https://alander.io` |
| **Redirect URLs** | `https://alander.io/**` |
| | `http://localhost:3000/**` |
| | `http://localhost:5173/**` |
| | `http://localhost:5174/**` |

Add product subdomains **only after DNS exists**:

- `https://deviante.alander.io/**`
- `https://deviante-web.vercel.app/**` (Deviante staging on Vercel — **required** or OAuth falls back to `alander.io`)
- `https://milebrick.alander.io/**`

### Deviante on Vercel (`deviante-web.vercel.app`)

If Google login ends on **alander.io** or shows **Sessão OAuth expirou**, the redirect URL is missing from the allow list. Supabase replaces it with **Site URL** (`alander.io`). Add `https://deviante-web.vercel.app/**` under Redirect URLs.

### Common mistake

**Site URL = `https://deviante.alander.io`** while logging in on the portfolio hub.

Supabase then sends the session to `deviante.alander.io#access_token=…`. That host has no DNS yet → browser error **ERR_NAME_NOT_RESOLVED**. The login never reaches `/auth/callback` on alander.io.

**Fix:** set **Site URL** to `https://alander.io`. Save. Sign in again from https://alander.io/login.

## GitHub Actions secrets (portfolio repo)

| Secret | Example |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` |
| `NEXT_PUBLIC_GESTALT_OWNER_EMAIL` | Optional; extra owner e-mail (legacy single) |
| `NEXT_PUBLIC_GESTALT_OWNER_EMAILS` | Optional; comma-separated extra owners |

Built-in full-access owners: **design@alander.io**, **alanderavila@gmail.com** (no secret required).

Redeploy after changing secrets.

## Google Cloud Console (OAuth client used by Supabase)

Authorized JavaScript origins must include:

- `https://alander.io`
- `http://localhost:3000`

Add `deviante.alander.io` only when that host is live.

## Expected flow after fix

1. https://alander.io/login → **Google**
2. Return to **https://alander.io/auth/callback**
3. Redirect to **https://alander.io/welcome** (owner) or `/products` / `/request-access`

## Related

- **Setup:** [[supabase-setup]] — DDL order, `.env.local`, first connection
- Monorepo: `doc/agents/seed-accounts.md`
- UC2: [[ABP-IO-UC2-SignIn]]
