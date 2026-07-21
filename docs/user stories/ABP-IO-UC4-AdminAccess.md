---
id: IO-UC4
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> Admin Access lets the **Owner** review access requests, search users by e-mail, and grant product permissions. Grants write to `portfolio.product_access` and provision minimal profile rows in each product schema when the user first enters an app.

| | Use Case ID | APB-IO-UC04 |
| :--- | :--- | :--- |
| | **Use Case Name** | Admin access |
| | **Actor** | Owner |
| | **Object** | Product access grant |
| | **Pre-Condition** | Owner session (`portfolio.users.role = owner`). |
| | **Post-Condition** | Selected users hold `portfolio.product_access` for approved products; pending requests are resolved. |
| **Step:** | **Actor Trigger Action:** | **Black Box System Response:** |
| 1 | They open **Admin**. | It lists pending access requests. |
| 2 | They approve a request and select products. | It grants access, provisions product users, and marks the request resolved. |
| 1a | They search by e-mail and grant products manually. | Same grant + provision flow without a prior request. |
| 1.1 | Non-owner opens `/admin`. | It redirects away (home or products). |

### Acceptance Criteria
*   **IO-UC4-AC1 (Owner only):** Only the owner role reaches Admin UI.
*   **IO-UC4-AC2 (Multi-product):** Owner can grant Deviante and Milebrick independently.
*   **IO-UC4-AC3 (Audit):** Grants record `granted_by` as the owner user id.
