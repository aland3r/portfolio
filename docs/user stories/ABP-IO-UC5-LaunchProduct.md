---
id: IO-UC5
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> Launch Product lets an authenticated user with permission open a Gestalt app dashboard from the portfolio hub. v1.0 skips per-product landing pages: **Continuar** goes straight to `{product}.alander.io/dashboard` when the host is live. Offline hosts stay on the portfolio with a clear message.

|           | Use Case ID                            | APB-IO-UC05                                                                                                        |
| :-------- | :------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
|           | **Use Case Name**                      | Launch product                                                                                                     |
|           | **Actor**                              | Visitor (with product access) or Owner                                                                             |
|           | **Object**                             | Product app session handoff                                                                                        |
|           | **Pre-Condition**                      | Valid session; product not `comingSoon`; user is owner or has `product_access`.                                    |
|           | **Post-Condition**                     | Browser navigates to the product dashboard when the host is live; otherwise user stays on portfolio with guidance. |
| **Step:** | **Actor Trigger Action:**              | **Black Box System Response:**                                                                                     |
| 1         | On `/products`, they choose a product. | If signed out, it sends them through UC2 with product intent.                                                      |
| 2         | They click **Open** with permission.   | If the product host is live, it navigates to the dashboard URL with shared `.alander.io` session.                  |
| 2a        | Host is not live (`live: false`).      | It does not navigate to a broken DNS name; owner sees welcome hint, others see offline copy.                       |
| 2.1       | No permission.                         | It offers **Request access** (UC3).                                                                                |

### Acceptance Criteria
*   **IO-UC5-AC1 (No dead DNS):** Never redirect to subdomains marked offline in product registry.
*   **IO-UC5-AC2 (SSO):** Live products accept the shared Gestalt auth cookie.
*   **IO-UC5-AC3 (Local dev):** localhost uses product Vite ports from registry.
