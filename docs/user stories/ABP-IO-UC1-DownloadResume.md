---
id: IO-UC1
written on: 14/07/2026
---
[[Portfolio]]

> [!NOTE] Description
> **Why:** Recruiters and visitors need Alander's CV without creating an account or leaving the portfolio.
> **What:** A **Visitor** picks a résumé language from the nav; the browser saves a PDF to **Downloads**. No sign-in. Unpublished languages show **Soon** only.
> **Bounds:** Starts when they open **Download CV** and choose a language. Ends when the PDF is in **Downloads**, or when nothing is downloaded because that language is unavailable.

| | Use Case ID | APB-IO-UC01 |
| :--- | :--- | :--- |
| | **Use Case Name** | Download resume |
| | **Actor** | Visitor |
| | **Object** | Résumé (PDF) |
| | **Pre-Condition** | The Visitor can open the portfolio site. |
| | **Post-Condition** | The PDF is in the browser Downloads folder, or no download occurred. |
| **Step:** | **Actor Trigger Action:** | **Black Box System Response:** |
| 1 | They open **Download CV** and choose a language. | If available, the browser downloads the PDF to **Downloads** with the configured filename. If not, it shows **Soon** and does not download. |

### Acceptance Criteria
*   **IO-UC1-AC1 (Downloads folder):** Available locales trigger a file download to **Downloads**, not an in-tab preview as the primary behavior.
*   **IO-UC1-AC2 (No auth):** No login or account is required.
*   **IO-UC1-AC3 (Unavailable):** Locales without a published PDF are not downloadable.
