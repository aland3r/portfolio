---
id: IO-UC8
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> **Why:** The owner needs to add or update Gestalt products without editing code or redeploying the portfolio for every registry change.
> **What:** **Publish Product** lets the **Owner** register a product (code, name, subdomain, icon, live/comingSoon flags) in the Gestalt registry. v1.0 is owner-only; members never see this UI. New products appear on `/products` after save.
> **Bounds:** Starts when the owner opens Admin → Products. Ends when the registry row exists and the hub reflects the new or updated product.

| | Use Case ID | APB-IO-UC08 |
| :--- | :--- | :--- |
| | **Use Case Name** | Publish product |
| | **Actor** | Owner |
| | **Object** | Product registry entry |
| | **Pre-Condition** | Owner session. Product `code` is unique. |
| | **Post-Condition** | Registry contains the product; `/products` hub shows it (or hides if `comingSoon`). |
| **Step:** | **Actor Trigger Action:** | **Black Box System Response:** |
| 1 | They open **Admin → Publish product**. | It shows the registry list and a form for a new product. |
| 2 | They enter code, name, subdomain, icon URL, and flags (`live`, `comingSoon`). | It validates uniqueness and required fields. |
| 3 | They save. | It persists the entry and refreshes the products hub. |
| 3a | They edit an existing product. | It updates flags (e.g. set `live: true` after DNS). |
| 2.1 | Non-owner opens the UI. | Access denied. |

### Included Use Cases
*   **UC5 - Launch product:** Hub reads the registry published here.

### Acceptance Criteria
*   **IO-UC8-AC1 (Owner only):** Only owner role reaches publish UI.
*   **IO-UC8-AC2 (Unique code):** Duplicate product codes are rejected.
*   **IO-UC8-AC3 (Hub sync):** `/products` reflects registry within the same session after save.
*   **IO-UC8-AC4 (Safe defaults):** New products default to `live: false` unless explicitly enabled.
