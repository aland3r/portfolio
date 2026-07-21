---
id: IO-roadmap
written on: 14/07/2026
---
[[Portfolio]]

# Development roadmap — Portfolio IO

**Live checklist:** `content/gestalt-roadmap.json` (Gestalt-wide; owner `/cases`). IO slice: `content/roadmap.json`.  
**Scope:** [[scope]].  
**Granularity:** `doc/agents/roadmap-granularity.md` (Gestalt monorepo).

Quest IDs: `UC{n}-{group}{letter}` — group `1` = first implementation slice of that UC.

## Phase PUBLIC — UC1 Download resume + tracks

| Quest | Status |
|-------|--------|
| UC1-1a CV dropdown in nav | done |
| UC1-1b Résumé registry + PDF | done |
| UC1-1c UC1 documented | done |
| UC1-2a Tracks page + SoundCloud embed | done |

## Phase AUTH — UC2 Sign in

| Quest | Status |
|-------|--------|
| UC2-1a Supabase on static export | done |
| UC2-1b Google OAuth | done |
| UC2-1c Owner bootstrap | done |
| UC2-1d Welcome hub | done |
| UC2-1e UC2 documented | done |

## Phase ACCESS — UC3 + UC4

| Quest | Status |
|-------|--------|
| UC3-1a Request access at blocked gates | **active** |
| UC3-1b Admin pending queue | locked |
| UC3-1c UC3 documented | done |
| UC4-1a Admin approve + grant | done |
| UC4-1b UC4 documented | done |

## Phase LAUNCH — UC5 Launch product

| Quest | Status |
|-------|--------|
| UC5-1a Products hub + guards | done |
| UC5-1b Offline host protection | done |
| UC5-1c Deviante DNS + deploy | **active** |
| UC5-1d Milebrick DNS + deploy | locked |
| UC5-1e UC5 documented | done |

## Phase GUEST — UC6 + UC7 Recruiter keys

| Quest | Status |
|-------|--------|
| UC7-1a Key schema + admin UI | locked |
| UC7-1b UC7 documented | done |
| UC6-1a Key prompt on products | locked |
| UC6-1b Guest grant + launch | locked |
| UC6-1c UC6 documented | done |

## Phase OWNER — UC8 + UC9

| Quest | Status |
|-------|--------|
| UC8-1a Publish product admin UI | locked |
| UC8-1b Registry API / DB | locked |
| UC8-1c UC8 documented | done |
| UC9-1a Artifacts JSON index | done |
| UC9-1b Artifacts DB + upload | locked |
| UC9-1c UC9 documented | done |

**Done when:** Member can request access at gates; owner publishes products and optionally registers artifacts without code edits.
