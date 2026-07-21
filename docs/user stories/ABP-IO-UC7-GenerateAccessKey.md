---
id: IO-UC7
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> Generate Access Key lets the **Owner** create product-scoped keys for **Recruiters** (UC6). Each key defines product, optional label (e.g. “Acme HR — March”), expiry, and max redemptions. Keys are stored hashed; the plain key is shown once at creation for the owner to copy and send. Revocation is immediate.

| | Use Case ID | APB-IO-UC07 |
| :--- | :--- | :--- |
| | **Use Case Name** | Generate access key |
| | **Actor** | Owner |
| | **Object** | Product access key |
| | **Pre-Condition** | Owner session (UC2). |
| | **Post-Condition** | A new key exists in the registry (or a key is revoked). The owner has the plain text once if creating. |
| **Step:** | **Actor Trigger Action:** | **Black Box System Response:** |
| 1 | In **Admin**, they open **Access keys**. | It lists active and expired keys per product. |
| 2 | They choose product, optional label, expiry, max uses; click **Generate**. | It creates the key, stores a hash, displays the plain key once for copy. |
| 3 | They share the key with the Recruiter (e-mail, message). | — |
| 1a | They revoke a key. | It invalidates future redemptions; existing guest sessions may honor TTL policy. |

### Included Use Cases
*   **UC6 — Redeem access key:** Consumer of keys created here.

### Acceptance Criteria
*   **IO-UC7-AC1 (Owner only):** Non-owners cannot reach key management.
*   **IO-UC7-AC2 (Show once):** Plain key is not retrievable after creation screen closes.
*   **IO-UC7-AC3 (Hashed storage):** Database stores hash + metadata only, never plain key at rest after display.
*   **IO-UC7-AC4 (Audit):** Each key records `created_by`, product, created_at, optional label.
