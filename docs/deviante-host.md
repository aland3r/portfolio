# Deviante host — `deviante.alander.io`

The portfolio **Apps** hub already points to:

| Action | URL |
|--------|-----|
| **Landing page** | `https://deviante.alander.io/` |
| **Try this app** | `https://deviante.alander.io/login` |
| **Dashboard** (signed in + access) | `https://deviante.alander.io/dashboard` |

If the subdomain does not open, the app code is fine — **DNS or hosting** is missing.

---

## Why it fails today

`deviante.alander.io` resolves to a Cloudflare Tunnel CNAME, but often only with a broken IPv6 address (`fd10:…`). Without a running tunnel **or** a static deploy, the browser cannot reach the app.

---

## Option A — Dev on your PC (fastest to test)

Three terminals:

```powershell
# 1 — Deviante
cd c:\gestalt\deviante\web
npm run dev

# 2 — Tunnel (config already in infra/cloudflared/config.yml)
cloudflared tunnel --config c:\gestalt\infra\cloudflared\config.yml run gestalt-dev

# 3 — Portfolio (optional)
cd c:\gestalt\portfolio
npm run dev
```

**DNS (recommended):** move `alander.io` nameservers to Cloudflare, then:

```powershell
cloudflared tunnel route dns gestalt-dev deviante.alander.io
```

Details: `doc/agents/dev-domains.md` · session checklist: `doc/agents/dev-session.md`

---

## Option B — Production (always on)

1. **Deploy** `deviante-web` static build (GitHub Pages or Cloudflare Pages).
2. **DNS:** `CNAME deviante` → your Pages host (e.g. `aland3r.github.io`).
3. **Repo:** push local changes in `deviante/web/` (landing, auth, Supabase) — remote is behind the monorepo.
4. **Supabase** → Redirect URLs: add `https://deviante.alander.io/**`
5. **Google OAuth** → JavaScript origins: add `https://deviante.alander.io`
6. Keep **Site URL** on Supabase = `https://alander.io` (portfolio hub).

---

## After the host is live

1. Set `live: true` for Deviante in `portfolio/lib/gestalt-auth/products.js` (already true).
2. Update `portfolio.products` row in Supabase if you mirror flags there.
3. From **Apps** on alander.io:
   - **Landing page** → public home on Deviante
   - **Try this app** → login on Deviante (portfolio OAuth intent redirects there after sign-in)

---

## Related

- [[auth-setup]] — Supabase Site URL must stay `https://alander.io`
- [[supabase-setup]] — shared Supabase project
- UC5 [[user stories/ABP-IO-UC5-LaunchProduct]]
