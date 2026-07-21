---
id: IO-UC2
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> Sign in lets a **Visitor** authenticate with Google OAuth via Supabase Auth and receive a shared session on `.alander.io`. v1.0 has no e-mail/password UI on the portfolio — Google only. The owner account (`NEXT_PUBLIC_GESTALT_OWNER_EMAIL`) is bootstrapped automatically on first sign-in. After OAuth, the system routes the user by role: owner → welcome hub; member with product access → products (or external app when the product host is live); others → request access.

| | Use Case ID | APB-IO-UC02 |
| :--- | :--- | :--- |
| | **Use Case Name** | Sign in |
| | **Actor** | Visitor |
| | **Object** | Auth session / portfolio profile |
| | **Pre-Condition** | Supabase Auth is configured. The Visitor has internet access and a Google account. |
| | **Post-Condition** | On success, the Visitor holds a valid session. A `portfolio.users` row exists (owner bootstrap or prior provisioning). The browser is redirected to the appropriate next step. |
| **Step:** | **Actor Trigger Action:** | **Black Box System Response:** |
| 1 | They open **In** in the header or follow a protected link (e.g. launch product while signed out). | It shows the sign-in page with **Google** as the only provider. |
| 2 | They click **Google**. | It redirects to Google OAuth via Supabase Auth. |
| 3 | They authorize access and return to `/auth/callback`. | It completes the OAuth exchange, persists the session (cookie on `.alander.io`), and loads the portfolio profile. |
| 4 | — | If the e-mail matches the configured owner address, it ensures an owner row in `portfolio.users`. |
| 5 | — | It redirects: **owner** → `/welcome`; **member with access** → `/products` or external product URL when the app host is live; **no access** → `/request-access`. |
| 1a | They open sign-in while already authenticated. | It redirects through `/auth/callback` to the same post-login route as step 5. |
| 2.1 | OAuth is cancelled or fails. | It returns to sign-in with a clear error. |
| 2.2 | Supabase env vars are missing in the build. | Sign-in shows a configuration error; OAuth cannot start. |

### Extension Points
*   **UC3 — Request access:** Visitor with session but no product permission.
*   **UC4 — Admin access (owner):** From welcome or `/admin`, owner approves requests and grants products.

### Included Use Cases
*   None in v1.0.

### Acceptance Criteria
*   **IO-UC2-AC1 (Google only):** Sign-in exposes Google OAuth only — no disabled or placeholder providers.
*   **IO-UC2-AC2 (Callback):** Successful OAuth always returns to `https://alander.io/auth/callback` in production.
*   **IO-UC2-AC3 (Owner bootstrap):** First Google sign-in with the configured owner e-mail creates or updates an owner profile without manual SQL.
*   **IO-UC2-AC4 (Owner welcome):** Owner post-login never auto-redirects to an external product host that is marked offline; they land on `/welcome` with guidance to Admin.
*   **IO-UC2-AC5 (Shared session):** Session cookie works across `alander.io` and product subdomains when those hosts are live.
*   **IO-UC2-AC6 (Static hosting):** Auth runs entirely client-side + Supabase; GitHub Pages static export is supported.
