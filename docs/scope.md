---
id: IO-scope
written on: 14/07/2026
---
[[Portfolio]]

# Product scope — Gestalt 1.0 (Portfolio IO)

## Alternative paths (scope registration)

Every Gestalt scope **registers primary flows and alternates** — same pattern as Deviante UC1 (`UC1-1` auth vs `UC1-3` sign-up UX out of scope). Alternates are not hidden; they are documented so agents and future you know what shipped instead.

| UC / area | Primary (v1.0) | Registered alternate | Out of scope |
|-----------|----------------|----------------------|--------------|
| UC2 Sign in | Google OAuth → **Member** account | Owner bootstrap e-mails | E-mail/password UI on portfolio |
| UC3 Request access | Form at **blocked gate** | Contact e-mail (`/contact`) — interim | Anonymous self-service without sign-in |
| UC6 Recruiter | Access key → guest session | — | Full `portfolio.users` row |
| UC1-3 (Deviante) | — | Seed / Supabase dashboard users | Self-service register page |
| UC9 Artifacts | Git vault + JSON index | — | DB + upload (phase B) |

When an alternate is active in production, add a quest or scope note — do not leave the primary UC as the only recorded path.

## Product lifecycle (Gestalt)

| Status | Meaning | Quest log |
|--------|---------|-----------|
| **designing** | ORCA / OOUX, scope, user stories — no dev quests yet | Empty; UI shows **Designing** |
| **developing** | Active implementation | % = done / total quests |

| Product | Code | Status (v1.0) |
|---------|------|---------------|
| Portfolio | IO | developing |
| Deviante | DV | developing |
| Milebrick | MB | **designing** |
| Harpia | HA | **designing** |

**Registry:** `portfolio.products.status` in Supabase (source of truth for UC8). UI fallback: `lib/gestalt-auth/products.js` until Admin publish ships.

**Quest/progress panel:** `/cases` → filter by product → UC % and quest log — **public read for all visitors** since 20/07/2026 (gamified progress the owner wants everyone to see). Create/edit UC affordances and non-public rows stay gated behind `ownerDbAccess` (owner sign-in) inside `OwnerUseCasesPanel`/`UseCaseFolioDetail` — component name is legacy, behavior is now public-view + owner-edit. Machine source for quests: `content/gestalt-roadmap.json`.

## Priority order (v1.0)

| Priority | UC | Name | Status |
|----------|-----|------|--------|
| 1 | UC1 | Download resume | shipped |
| 2 | UC2 | Sign in (Google → limited account) | shipped |
| 3 | UC5 | Launch product | partial (DNS) |
| 4 | UC4 | Admin — grant by e-mail | shipped |
| 5 | **UC3** | **Request access at blocked gates** | **planned** (was deferred) |
| 6 | UC6/UC7 | Recruiter access keys | planned |
| 7 | UC8 | Publish product (owner) | planned |
| 8 | UC9 | Artifacts registry | exploratory |
| — | — | Tracks (SoundCloud) | shipped, owner-only for now (same `isOwner` gate as `/admin`) |

## Access levels

Gestalt 1.0 uses **layered access** — not every signed-in user is an owner.

| Level | Account | Portfolio role | Product access | Typical path |
|-------|---------|----------------|----------------|--------------|
| **Visitor** | None | — | None | CV, bio, artifacts, tracks, products hub (icons visible) |
| **Member** | Google sign-in → `portfolio.users` | `member` | 0..n products via owner grant | Sign in → blocked product → **request access** (UC3) or contact |
| **Recruiter** | Optional; guest session only | — | One product via key (UC6) | Key prompt on product → demo launch, no full account required |
| **Owner** | Google sign-in (bootstrap e-mails) | `owner` | All products + admin | `/welcome`, `/cases`, `/admin`, publish product (UC8) |

**Blocked gates (UC3):** When a Member or Visitor hits a product they cannot open — hub icon, launch button, or offline host — the UI offers **Sign in** (UC2) then **Request access** with optional note, instead of only a static contact link.

**Per-product role** (`portfolio.product_access.role`): `member` today; owner grant can extend later (e.g. read-only demo).

## Owner e-mails (full permissions)

Hard-coded bootstrap owners:

- `design@alander.io`
- `alanderavila@gmail.com`

Optional env extension: `NEXT_PUBLIC_GESTALT_OWNER_EMAILS` (comma-separated).

## Publish product (UC8)

Owner-only in v1.0: register a new Gestalt app in the product registry (code, display name, subdomain, icon, `live` flag). The `/products` hub reads the registry — no redeploy for copy changes once admin UI exists. Until UC8 ships, products remain in `lib/gestalt-auth/products.js`.

## Artifacts registry (UC9)

**Decision:** artefatos indexados em **`portfolio.artifacts`** (Supabase). Markdown continua no vault git; o banco guarda metadados + ponteiro (`source_ref`).

| Campo | Uso |
|-------|-----|
| `product_code` | FK → `portfolio.products` (`io`, `deviante`, …) |
| `artifact_type` | `use_case`, `scope`, `roadmap`, … |
| `code` | `IO-UC1`, `DV-UC2` — chave de sync |
| `source_ref` | Caminho no monorepo, ex. `portfolio/docs/user stories/…` |
| `is_public` | Visível em `/artifacts` |

**Sync futuro:** script lê `{product}/docs/user stories/` → upsert por `code`. Quest log permanece em JSON.

Seed inicial: `data/seed/portfolio/artifacts.sql` (IO scope + UC1–UC9, `is_public = false` até publicar).

## Public surface (non-UC)

| Page | Content |
|------|---------|
| `/tracks` | SoundCloud embeds — **owner-only** (redirects like `/admin` if not signed in as owner). Nav link, floating player, and track chips all hide themselves automatically because `SoundCloudPlayerProvider` only loads track data when `isOwner` is true. |
| `/cases` | Quest log + UC progress — **public read** (see Owner panel note above); editing stays owner-only |
| `/artifacts` | Static index from JSON (empty until populated) |
| `/products` | Three-slot app hub — no progress / launch UI for visitors |

## Use case index

See [[Portfolio]] for files. UC3 spec updated for in-context request; UC8–UC9 new.
