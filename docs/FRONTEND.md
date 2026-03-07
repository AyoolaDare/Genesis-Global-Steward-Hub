# FRONTEND SPECIFICATION
## Church Management System (CMS) — Web Application

---

## 1. DESIGN PHILOSOPHY

The CMS frontend is a **data-dense, authority-first dashboard application**. It must communicate trust, clarity, and control at every level. The visual language is **institutional refinement meets modern utility** — think government command center meets a modern SaaS product. Every pixel must serve function; decoration must earn its place.

**Core Principles:**
- Information hierarchy over decoration
- Role-aware UI — each user sees only what their role demands
- Real-time feedback on every action
- Zero ambiguity — labels, statuses, and states are always visible
- Mobile-responsive but desktop-first (primary use case is admin desks)

---

## 2. TYPOGRAPHY

### Font Stack

| Role | Font | Weight | Use Case |
|------|------|--------|----------|
| Display / Headers | `Sora` (Google Fonts) | 600–800 | Page titles, module names |
| Body / UI | `DM Sans` (Google Fonts) | 400–500 | Labels, form fields, paragraphs |
| Data / Numbers | `JetBrains Mono` (Google Fonts) | 400–500 | Stats, IDs, phone numbers, counters |
| Supporting | `DM Sans` italic | 400 | Subtitles, helper text, captions |

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-display: 'Sora', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Font Size Scale

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | `11px` | Badge labels, micro-copy, table footnotes |
| `--text-sm` | `13px` | Table cell data, secondary labels |
| `--text-base` | `15px` | Body text, form inputs, nav items |
| `--text-md` | `17px` | Card titles, section subheadings |
| `--text-lg` | `20px` | Module page titles |
| `--text-xl` | `24px` | Dashboard section headers |
| `--text-2xl` | `32px` | Stat/KPI numbers on dashboard |
| `--text-3xl` | `42px` | Hero stats, primary KPI figures |

### Line Height
- Body text: `1.6`
- Headings: `1.2`
- Data/Mono: `1.4`

---

## 3. COLOR SYSTEM

### Primary Palette

```css
:root {
  /* Brand */
  --color-primary:       #1B4FDB;   /* Royal Blue — primary actions, links */
  --color-primary-light: #3B6FF5;   /* Hover states */
  --color-primary-dark:  #1239A8;   /* Active/pressed states */
  --color-primary-subtle:#EEF2FF;   /* Backgrounds, chips */

  /* Neutrals */
  --color-bg:            #F4F6FB;   /* App background */
  --color-surface:       #FFFFFF;   /* Cards, panels */
  --color-surface-alt:   #F0F2F8;   /* Striped rows, nested sections */
  --color-border:        #DDE1EE;   /* Dividers, input borders */
  --color-border-strong: #B8BEDC;   /* Active borders */

  /* Text */
  --color-text-primary:  #0F1733;   /* Main headings */
  --color-text-body:     #2E3555;   /* Body, labels */
  --color-text-muted:    #7880A0;   /* Placeholders, captions */
  --color-text-inverse:  #FFFFFF;   /* On dark backgrounds */

  /* Semantic */
  --color-success:       #12A15A;   /* Active, completed, confirmed */
  --color-success-bg:    #EDFAF3;
  --color-warning:       #D97706;   /* Pending, awaiting approval */
  --color-warning-bg:    #FFFBEB;
  --color-danger:        #DC2626;   /* Errors, critical, delete */
  --color-danger-bg:     #FEF2F2;
  --color-info:          #0891B2;   /* Info, notes, follow-up */
  --color-info-bg:       #ECFEFF;

  /* Module Accent Colors (sidebar indicators) */
  --accent-admin:        #1B4FDB;   /* Blue */
  --accent-medical:      #059669;   /* Green */
  --accent-followup:     #7C3AED;   /* Purple */
  --accent-cell:         #EA580C;   /* Orange */
  --accent-department:   #0891B2;   /* Cyan */
  --accent-hr:           #DB2777;   /* Pink */
}
```

### Dark Mode (Optional Toggle)

```css
[data-theme="dark"] {
  --color-bg:           #0C0F1E;
  --color-surface:      #141829;
  --color-surface-alt:  #1C2038;
  --color-border:       #252C4A;
  --color-text-primary: #EDF0FF;
  --color-text-body:    #B8BEDC;
  --color-text-muted:   #5B628A;
}
```

---

## 4. LAYOUT & SPACING

### Application Shell

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR (height: 60px, sticky)                              │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   SIDEBAR    │         MAIN CONTENT AREA                   │
│  (240px)     │         (flex-1, scrollable)                │
│  collapsed:  │                                              │
│  (64px)      │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Spacing Scale

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Grid System
- Dashboard: `12-column CSS Grid`, gap: `24px`
- Cards: `auto-fit, minmax(280px, 1fr)`
- Table containers: full-width with `overflow-x: auto`
- Page padding: `32px` desktop, `16px` tablet, `12px` mobile

### Border Radius

```css
--radius-sm:   4px;   /* Badges, tags */
--radius-md:   8px;   /* Buttons, inputs */
--radius-lg:   12px;  /* Cards, panels */
--radius-xl:   16px;  /* Modal dialogs */
--radius-full: 9999px; /* Pills, avatars */
```

---

## 5. TOPBAR

**Height:** `60px` | **Position:** `sticky top-0` | **z-index:** `100`

**Contents (left to right):**
1. **Church Logo + App Name** — left-aligned, `Sora 700`, 18px
2. **Breadcrumb** — center or left after logo, `DM Sans`, 13px, muted color
3. **Search bar** (global search) — center, `480px` wide, with `⌘K` shortcut hint
4. **Right cluster:**
   - 🔔 Notification bell with red badge counter
   - 🌙 Dark mode toggle
   - **User avatar** + name + role badge (dropdown: profile, settings, logout)

**Background:** `--color-surface` with `box-shadow: 0 1px 0 var(--color-border)`

---

## 6. SIDEBAR NAVIGATION

**Width:** `240px` expanded | `64px` collapsed | transition: `200ms ease`

### Structure

```
[ Church Logo ]
────────────────
▸ Dashboard          (home icon)
────────────────
MODULES
▸ Admin Panel        (shield icon)        — accent: blue
▸ Medical            (heart-pulse icon)   — accent: green
▸ Follow Up          (phone icon)         — accent: purple
▸ Cell Groups        (users icon)         — accent: orange
▸ Departments        (building icon)      — accent: cyan
▸ HR / Workers       (briefcase icon)     — accent: pink
────────────────
SETTINGS
▸ Roles & Access
▸ System Settings
▸ Audit Logs
────────────────
[ Collapse Arrow ]
```

### Sidebar Item Styles
- **Default:** `--color-text-body`, no background
- **Hover:** background `--color-primary-subtle`, text `--color-primary`
- **Active:** left border `3px solid var(--accent-[module])`, background subtle tint, bold label
- **Collapsed:** show only icon, tooltip on hover
- **Badge:** small `--color-danger` circle for pending approvals count

---

## 7. MAIN DASHBOARD — ADMIN VIEW

The dashboard is the **Command Center**. It must show the full health of the church database at a glance.

### 7.1 — KPI Row (Top Stats)

4 large metric cards in a row:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Members│ │ Active Workers│ │ New This Month│ │ Pending Action│
│   3,842      │ │     124      │ │      47      │ │     12       │
│ ▲ 3.2% MoM  │ │ ▲ 2 added   │ │ ⬤ 8 follow   │ │ ⚠ approval  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Card Design:**
- Background: `--color-surface`
- Top-left: icon in colored circle (module accent)
- Main number: `--text-3xl`, `JetBrains Mono`, `--color-text-primary`
- Label: `--text-sm`, `--color-text-muted`
- Trend chip: green/red with arrow icon, `--text-xs`
- Border-left: `4px solid var(--accent-color)` per card theme
- Shadow: `0 2px 8px rgba(0,0,0,0.06)`

### 7.2 — Charts Row

**Left (60%):** Member Growth Line Chart (last 12 months)
- X-axis: months, Y-axis: member count
- Three lines: Members, Workers, New Members
- Colors: primary blue, success green, warning orange
- Tooltip on hover showing exact count
- Chart library: **Recharts** (React) or **Chart.js**

**Right (40%):** Member Status Donut Chart
- Segments: New Members, Active Members, Workers, Inactive
- Legend below with count + percentage
- Center text: total count

### 7.3 — Activity Feed + Module Tiles

**Left (65%):** Module Quick-Access Tiles (2x3 grid)

Each tile:
- Large icon (48px)
- Module name (`--text-md`, `Sora 600`)
- 2 quick stats beneath
- "Open →" link
- Left border accent color per module

**Right (35%):** Live Activity Feed
- Title: "Recent Activity"
- Scrollable list of events
- Each row: avatar + action text + timestamp
- Color-coded dot by module
- "View All Logs" button at bottom

### 7.4 — Pending Approvals Table

Full-width table showing items awaiting Admin action:

| # | Person | Action Needed | Triggered By | Date | Actions |
|---|--------|--------------|--------------|------|---------|
| 1 | John Doe | New Member Approval | Medical Team | Today | ✅ Approve / ❌ Reject |

**Table Styles:**
- Striped rows: alternating `--color-surface` / `--color-surface-alt`
- Header: `--color-surface-alt`, `--text-sm`, uppercase, letter-spacing
- Row hover: `--color-primary-subtle` tint
- Action buttons: small, ghost style
- Pagination: bottom right, `DM Sans 13px`

---

## 8. MODULE PAGE LAYOUTS

Each module (Medical, Follow-Up, Cell Groups, Departments, HR) follows this layout pattern:

```
┌──────────────────────────────────────────────────────────┐
│  Module Header                                           │
│  [Icon] Module Name    [Search Bar]   [+ New Button]    │
├──────────────────────────────────────────────────────────┤
│  Sub-Navigation Tabs                                     │
│  Overview | Members | Records | Reports | Settings      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  CONTENT AREA (changes per tab)                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Module Header
- Background: gradient tint of module accent color (5% opacity)
- Icon: 32px in colored circle
- Title: `Sora 700`, `--text-xl`
- Search: 320px wide, module-tinted border on focus
- CTA button: solid module accent color

### Tabs
- Underline-style active tab with module accent color
- `DM Sans 500`, `--text-base`
- Badge count on tabs where relevant (e.g., "Members (42)")

---

## 9. FORMS & INPUTS

### Input Fields

```css
.input {
  height: 40px;
  padding: 0 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font: 400 15px var(--font-body);
  color: var(--color-text-body);
  background: var(--color-surface);
  transition: border-color 150ms;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(27, 79, 219, 0.12);
  outline: none;
}
```

### Form Layout
- Label above input (never placeholder-only)
- Label: `--text-sm`, `--color-text-body`, `font-weight: 500`
- Helper text below: `--text-xs`, `--color-text-muted`
- Error state: `--color-danger` border + message below
- Two-column grid for long forms, single column on mobile
- Section dividers with light heading: `DM Sans 600`, uppercase, `--text-xs`

### Buttons

| Type | Background | Text | Use |
|------|-----------|------|-----|
| Primary | `--color-primary` | white | Main CTA |
| Secondary | transparent | `--color-primary` | Secondary action |
| Danger | `--color-danger` | white | Delete, reject |
| Ghost | transparent | `--color-text-body` | Tertiary |
| Success | `--color-success` | white | Approve, confirm |

**Button Specs:** height `40px` (default), `36px` (sm), `44px` (lg) | padding `0 20px` | `border-radius: var(--radius-md)` | `DM Sans 500`

---

## 10. DATA TABLES

### Column Patterns
- **Checkbox** column: 40px, for bulk select
- **Avatar + Name** column: `48px` for avatar image/initials, name bold
- **Status** column: colored pill badge
- **Date** column: `JetBrains Mono`, right-aligned
- **Phone** column: `JetBrains Mono`
- **Actions** column: icon buttons (edit, view, delete), visible on row hover

### Status Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font: 500 11px var(--font-body);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.badge-new       { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-member    { background: var(--color-success-bg); color: var(--color-success); }
.badge-worker    { background: var(--color-primary-subtle); color: var(--color-primary); }
.badge-pending   { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-inactive  { background: var(--color-surface-alt); color: var(--color-text-muted); }
```

---

## 11. MODALS & DRAWERS

### Modal (Centered Overlay)
- Use for: confirmations, quick forms, medical record entry
- Width: `560px` default, `760px` large
- Border-radius: `var(--radius-xl)`
- Header: title (`Sora 600`, 18px) + close button
- Footer: action buttons right-aligned
- Backdrop: `rgba(0,0,0,0.45)` blur `2px`

### Drawer (Side Panel)
- Use for: full profile view, new member creation, detailed records
- Width: `480px` from right
- Full height, scrollable content
- Header sticky, footer sticky with save/cancel

---

## 12. NOTIFICATIONS & ALERTS

### Toast Notifications (top-right)
- Auto-dismiss after `4000ms`
- Types: success (green), error (red), warning (orange), info (blue)
- Icon + message + optional action link
- Stack up to 3, queue rest

### Inline Alerts
- Full-width within a section
- Left border `4px` colored, icon, title + description
- Dismissible with X button

### Pending Badge
- Red circle on sidebar items and topbar bell
- Number inside, max display `99+`

---

## 13. SEARCH EXPERIENCE

### Global Search (⌘K)
- Full-screen modal overlay on trigger
- Search input at top, large, prominent
- Results grouped by type: Members, Workers, Cell Groups, Departments
- Each result: avatar, name, type badge, quick-action buttons
- Keyboard navigable (↑↓ arrows, Enter to open, Esc to close)
- Recent searches shown when empty

### In-Module Search
- Phone number lookup (Cell Group add flow)
- Real-time results as you type (debounce 300ms)
- Clear "not found" state with "Create New Member" CTA

---

## 14. RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
--bp-sm:  480px;   /* Large mobile */
--bp-md:  768px;   /* Tablet */
--bp-lg:  1024px;  /* Desktop */
--bp-xl:  1280px;  /* Wide desktop */
--bp-2xl: 1536px;  /* Ultra wide */
```

| Screen | Sidebar | Columns | Font Scale |
|--------|---------|---------|-----------|
| Mobile (`<768px`) | Hidden (hamburger) | 1 col | -10% |
| Tablet (`768–1024px`) | Collapsed (64px) | 2 col | -5% |
| Desktop (`>1024px`) | Expanded (240px) | Full grid | 100% |

---

## 15. ACCESSIBILITY

- All interactive elements: `focus-visible` ring using `--color-primary`
- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text
- All icons paired with visible or `aria-label` text
- Form inputs: always have associated `<label>`
- Modals: focus trap, `aria-modal`, `role="dialog"`
- Status badges: use `aria-label` not just color
- Skip-to-content link at top of page
- Loading states: `aria-busy`, skeleton loaders (not just spinners)

---

## 16. LOADING & EMPTY STATES

### Skeleton Loaders
- Match shape of actual content (cards, table rows, charts)
- Animated shimmer: `background: linear-gradient(90deg, #eee, #f5f5f5, #eee)`
- Show for all async data fetches

### Empty States
- Centered illustration (simple SVG icon)
- Primary message: `Sora 600`, 18px
- Secondary message: `DM Sans`, 14px, muted
- Action CTA button where applicable
- Examples: "No members yet", "No pending approvals", "No medical records found"

---

## 17. TECH STACK (Frontend)

| Concern | Choice |
|---------|--------|
| Framework | **React 18** with **Vite** |
| Routing | **React Router v6** |
| State Management | **Zustand** (global), React Query (server state) |
| Styling | **Tailwind CSS** + CSS Variables for theming |
| Charts | **Recharts** |
| Tables | **TanStack Table v8** |
| Forms | **React Hook Form** + **Zod** validation |
| Icons | **Lucide React** |
| Notifications | **React Hot Toast** |
| Modals/Dialogs | **Headless UI** |
| Date Handling | **date-fns** |
| HTTP Client | **Axios** with interceptors |
| Auth | JWT stored in `httpOnly` cookie |

---

## 18. FOLDER STRUCTURE

```
src/
├── assets/           # Logos, icons, illustrations
├── components/
│   ├── ui/           # Buttons, inputs, badges, modals (reusable)
│   ├── layout/       # Topbar, Sidebar, Shell, PageHeader
│   ├── charts/       # Chart wrappers
│   └── tables/       # Table components
├── features/
│   ├── dashboard/
│   ├── admin/
│   ├── medical/
│   ├── followup/
│   ├── cellgroups/
│   ├── departments/
│   └── hr/
├── hooks/            # Custom React hooks
├── lib/              # Axios instance, API helpers
├── pages/            # Route-level page components
├── store/            # Zustand stores
├── styles/           # Global CSS, theme variables
└── utils/            # Formatters, validators, helpers
```
