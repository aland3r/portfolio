---
id: IO-UC3
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> **Why:** Members need a path to ask for product access without hunting for a contact e-mail when they hit a blocked product.
> **What:** **Request Access** lets an authenticated **Member** (or Visitor after UC2) without product permissions submit a request from **blocked gates** — product hub icon, launch panel, offline host — with an optional note. v1.0 creates a pending row for owner review in Admin (UC4).
> **Bounds:** Starts when the user triggers **Request access** at a gate. Ends when a pending request is stored and confirmation is shown.

| | Use Case ID | APB-IO-UC03 |
| :--- | :--- | :--- |
| | **Use Case Name** | Request access |
| | **Actor** | Visitor or Member (authenticated, no product grant) |
| | **Object** | Access request |
| | **Pre-Condition** | Valid session; no `portfolio.product_access` for the requested products. |
| | **Post-Condition** | A pending access request exists for the owner to approve or ignore. |
| **Step:** | **Actor Trigger Action:** | **Black Box System Response:** |
| 1 | At a blocked product gate (hub, launch, or offline), they choose **Request access**. | It shows a form with optional note and product context. |
| 2 | They submit the form. | It stores the request linked to their user id and e-mail; shows confirmation. |
| 2.1 | They are not signed in. | It redirects to sign-in with return path `/request-access`. |

### Acceptance Criteria
*   **IO-UC3-AC1 (Auth required):** Anonymous users cannot submit a request.
*   **IO-UC3-AC2 (Idempotent UX):** Repeat submissions are handled without duplicate spam (one pending row per user or clear replace policy).
*   **IO-UC3-AC3 (Owner queue):** Pending requests appear in `/admin` for the owner.
*   **IO-UC3-AC4 (Gate context):** Request is tied to the product the user tried to open when applicable.
