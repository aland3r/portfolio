# Portfolio content

## Résumés (`resumes.json`)

Drop PDFs in `public/` and set `"available": true`:

| File | Locale |
|------|--------|
| `resume-en.pdf` | en |
| `resume-ptbr.pdf` | pt |
| `resume-de.pdf` | de |

Nav **CV** menu lists all locales; unavailable entries show “Soon”.

## Site language (`i18n/`)

- `en.json` — English (default)
- `pt.json` — Português
- `de.json` — Deutsch

Switch via **EN / PT / DE** in the header. Choice is stored in `localStorage`.

## Tracks (`portfolio.tracks` + `tracks.json`)

**Production:** playlist in **Supabase** `portfolio.tracks`. **Fallback:** `tracks.json` when DB is empty.

| DB column | Role |
|-----------|------|
| `slug` | Primary key |
| `soundcloud_url` | SoundCloud permalink |
| `sort_order` | Playlist order (next / previous) |
| `is_default` | Preloads global player (one row) |
| `is_public` | Visitors hear only `true` |
| `placements` | JSON: `home`, `apps`, `tracks` |
| `product_code` | Optional `/apps` slot |

Seed: `data/seed/portfolio/tracks.sql`. Owner on `/tracks` sees full catalog + session panel.

```sql
INSERT INTO portfolio.tracks (slug, title, soundcloud_url, sort_order, placements)
VALUES ('nova-faixa', 'Title', 'https://soundcloud.com/alander/nova-faixa', 10, '["tracks"]'::jsonb);
```

App icons: `iconMask: "ios"` or `"android"` in `lib/gestalt-auth/products.js`.

## Artifacts (`artifacts.json`)

See previous format — product deliverables you publish to `/artifacts`.
