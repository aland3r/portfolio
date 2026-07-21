---
id: IO-UC6
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> Redeem Access Key lets a **Recruiter** open a Gestalt product demo without Google sign-in or account creation. v1.0 shows a key prompt when they choose a product on `/products`. A valid key unlocks a **guest session** (scoped cookie or token) for that product only — read-only or demo mode as configured. Invalid or expired keys are rejected with a clear message. Recruiters never appear in `portfolio.users` unless they later choose full sign-in (UC2).

| | Use Case ID | APB-IO-UC06 |
| :--- | :--- | :--- |
| | **Use Case Name** | Redeem access key |
| | **Actor** | Recruiter |
| | **Object** | Product access key |
| | **Pre-Condition** | The Recruiter can reach the portfolio site. The product is not `comingSoon`. The owner has generated at least one active key for that product (UC7). |
| | **Post-Condition** | On success, the Recruiter holds a guest grant for the chosen product until expiry or browser session end. On failure, no product access is granted. |
| **Step:** | **Actor Trigger Action:** | **Black Box System Response:** |
| 1 | On `/products`, they select a product (e.g. Deviante). | If they have no member session (UC2) and no valid guest grant, it prompts for an **access key** — not a login form. |
| 2 | They enter the key the owner shared and confirm. | It validates the key against the registry (product, expiry, max uses). |
| 3 | — | On success, it stores a guest grant (cookie / session storage) and opens the product demo or dashboard in guest mode when the host is live. |
| 1a | They already hold a valid guest grant for that product. | It skips the prompt and opens the product directly. |
| 2a | They prefer full access as a collaborator. | They use **In** (UC2) and **Request access** (UC3) instead — out of this UC. |
| 2.1 | Key is wrong, expired, or exhausted. | It shows an error; the product stays locked. |
| 2.2 | Product host is offline. | It accepts the key but stays on the portfolio with “host not live” — no broken DNS redirect. |

### Extension Points
*   **UC7 — Generate access key:** Owner creates and revokes keys.
*   **UC5 — Launch product:** Guest launch after redeem vs member launch after UC2/UC4.

### Acceptance Criteria
*   **IO-UC6-AC1 (No account):** Recruiter path never requires Google OAuth or `portfolio.users` row.
*   **IO-UC6-AC2 (Product-scoped):** A key for Deviante does not unlock Milebrick.
*   **IO-UC6-AC3 (Owner-only keys):** Only keys issued via UC7 validate; no public key generation.
*   **IO-UC6-AC4 (Offline-safe):** Invalid host does not navigate to unresolved subdomains.
*   **IO-UC6-AC5 (Revocable):** Revoked or expired keys fail immediately.
