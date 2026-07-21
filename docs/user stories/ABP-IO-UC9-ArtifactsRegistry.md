---
id: IO-UC9
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> **Why:** The owner wants one catalogue for product artifacts (user stories, scope, specs) that stays in sync with the docs vault and the public site.
> **What:** **Artifacts Registry** stores metadata in **`portfolio.artifacts`** (Supabase). Each row points to a **vault path**, **URL**, or **Storage object** — body text stays in git unless uploaded. Owner marks `is_public` for `/artifacts`. Product link via `product_code` → `portfolio.products`.
> **Bounds:** Starts when the owner inserts or updates an artifact row. Ends when the record exists and public rows appear on `/artifacts`.

| | Use Case ID | APB-IO-UC09 |
| :--- | :--- | :--- |
| | **Use Case Name** | Artifacts registry |
| | **Actor** | Owner (write); Visitor (read public index) |
| | **Object** | Artifact record |
| | **Pre-Condition** | `portfolio.products` and `portfolio.artifacts` exist. Owner session for write. |
| | **Post-Condition** | Artifact row persisted; public entries listed on `/artifacts`. |
| **Step:** | **Actor Trigger Action:** | **Black Box System Response:** |
| 1 | They open **Admin → Artifacts** or run seed/SQL. | It lists artifacts by product and type. |
| 2 | They set product, type (`use_case`, `scope`, …), `code`, title, `source_ref` (vault path). | It validates FK to product; upserts on `(product_code, code)`. |
| 3 | They set `is_public = true`. | `/artifacts` loads row from Supabase and resolves link to docs repo. |
| 2a | They attach a file to Storage. | `source_kind = storage`; `storage_path` set; metadata in JSONB. |

### Sync model

| Layer | Role |
|-------|------|
| **Git vault** | Source of truth for markdown bodies (`{product}/docs/`) |
| **`portfolio.artifacts`** | Index: title, type, product, pointer (`source_ref`), public flag |
| **Future script** | Scan vault → upsert rows by `code` (IO-UC1, DV-UC2, …) |

### Extension Points
*   **Admin UI:** CRUD without SQL (locked quest UC9-1b).
*   **Storage upload:** PDFs/diagrams not in git.

### Acceptance Criteria
*   **IO-UC9-AC1 (Public read):** Visitors browse `is_public` rows without sign-in (RLS).
*   **IO-UC9-AC2 (Owner write):** Only owner inserts/updates/deletes.
*   **IO-UC9-AC3 (Pointer not copy):** Default `source_kind = vault_path`; no duplicate UC body in DB.
*   **IO-UC9-AC4 (By product):** Filter/list by `product_code` for owner panel sync with quest progress.
*   **IO-UC9-AC5 (Empty state):** Clear copy when no public rows.
