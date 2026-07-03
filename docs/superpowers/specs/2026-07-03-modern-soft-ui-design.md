# Restoloop Modern Soft UI Design Specification

This specification outlines the visual style migration to a "Modern Clean Soft UI" design system, focusing on vibrant orange colors, a high-contrast grayscale hierarchy, modern sans-serif typography (Poppins & Inter), and soft, diffused shadows.

The layout structure and underlying component skeletons will remain identical to ensure structural integrity and zero regression in functionality.

---

## 1. Mockup Visualization

Below is the proposed design mockup representing the dashboard look and feel under the new system:

![Dashboard UI Mockup](file:///C:/Users/iamku/.gemini/antigravity-ide/brain/fff6a4a4-f557-44fd-abef-7963c5c1e779/dashboard_ui_mockup_1783077801591.png)

---

## 2. Color Palette System

| Role | Color Value / Hex | Usage & Application |
|---|---|---|
| **Primary Brand** | `#FF8C00` (Vibrant Orange) | Primary buttons, active states, key callouts, focus rings. |
| **Secondary/Accent** | `#FFF4EB` (Soft Orange Tint) | Sidebar active background, highlighted table/list items. |
| **Background** | `#F8F9FA` (Off-White/Light Gray) | Main layout backdrop behind cards, reducing eye strain. |
| **Surface** | `#FFFFFF` (Pure White) | Sidebar base, top navigation bar, metric and list cards. |
| **Success State** | `#10B981` (Emerald Green) | Positive trends (`+X.X%`), redeemed/delivered badges. |
| **Error/Warning** | `#EF4444` (Vibrant Red) | Negative trends, failed/blocked badges. |

### Text Colors
*   **Primary Headings / Values:** `#1E1E1E` (Dark Charcoal) — sharp and highly legible.
*   **Secondary Body:** `#6B7280` (Medium Gray) — standard labels, text description.
*   **Muted / Micro-copy:** `#9CA3AF` (Light Gray) — timestamps, micro-badges, subtexts.

---

## 3. Typography Hierarchy

The typography replaces the old serif font (*Playfair Display SC*) and heavy slab look with a clean, modern geometric sans-serif combination.

*   **Display Font:** `Poppins` (for headers, titles, and major metrics).
*   **Body/Table Font:** `Inter` (for high-readability lists, table grids, and normal text).
*   **Google Fonts Import:**
    ```css
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
    ```

---

## 4. Component Anatomy & Styling

### Card Containers
*   **Border-radius:** Consistent `16px` (`1rem`) across all major surface cards (Overview cards, Activity feeds, validation sections).
*   **Borders:** Removed hard borders (`border: none` or opacity-0 border) on main cards. Layout separation relies entirely on the contrast between `#FFFFFF` cards and the `#F8F9FA` background, accompanied by the shadow.
*   **Elevation/Shadow:** Soft, highly diffused drop shadow:
    ```css
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.04);
    ```

### Buttons
*   **Primary Button (`.btn-primary`):** Background `#FF8C00`, Text `#FFFFFF`, font weight `600`, border-radius set to heavily rounded `12px` (`0.75rem`).
*   **Outline / Ghost Button:** Transparent background, `1px solid #FF8C00` border, `#FF8C00` text, pill shape border-radius.

### Navigation Sidebar
*   **Width:** Fixed at `288px`.
*   **Active Link:** Background `#FFF4EB` (Soft Orange), text `#FF8C00`, vibrant orange indicator.
*   **Inactive Links:** Background transparent, text `#6B7280`.

---

## 5. Spacing Guidelines

*   **Macro-spacing:** `24px` (`1.5rem`) gap between dashboard cards/widgets.
*   **Micro-spacing:** `20px` to `24px` padding inside cards.
*   **Lists:** `16px` (`1rem`) gap between entries (e.g. Activity feed list items).
