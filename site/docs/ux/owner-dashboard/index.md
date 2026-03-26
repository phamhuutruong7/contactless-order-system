# UX Spec: Owner – Dashboard

**Route:** `/owner/dashboard` · **Role:** Owner (Google OAuth) · **Epic:** E3

---

## 1. Overview

The primary landing screen after owner login. Provides a revenue summary, staff management tools, and restaurant profile settings in a tabbed interface.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | "Dashboard" title + tab bar |
| `v-tabs` / `v-tab` | Revenue · Staff · Profile |
| `v-window` / `v-window-item` | Tab content panels |
| `v-card` | Metric cards (revenue, orders, avg value) |
| `v-sparkline` | Trend line on metric cards (7-day) |
| `v-data-table` | Staff list with inline actions |
| `v-dialog` | Add staff / Change PIN |
| `v-text-field` | Staff name, PIN fields |
| `v-switch` | Staff active / inactive toggle |
| `v-file-input` | Restaurant logo upload |
| `v-snackbar` | Save confirmations and errors |

---

## 3. Layout

```
┌──────────────────────────────────────────────────────┐
│  Dashboard                                           │  ← v-app-bar
│  [Revenue]  [Staff]  [Profile]                       │  ← v-tabs
├──────────────────────────────────────────────────────┤
│                                                      │
│  REVENUE TAB (default)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Today    │  │ This Week│  │ This Month│           │  ← v-card metric
│  │ £128.50  │  │ £842.00  │  │ £3,204.00 │           │
│  │  [spark] │  │  [spark] │  │  [spark]  │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐                         │
│  │ Orders   │  │ Avg Value│                         │
│  │  47      │  │  £6.82   │                         │
│  └──────────┘  └──────────┘                         │
│                                                      │
│  STAFF TAB                                           │
│  [+ Add Staff]                                       │
│  ┌────┬───────────┬────────────┬──────────┬──────┐  │
│  │ ID │ Name      │ Last Login │ Active   │ PIN  │  │  ← v-data-table
│  ├────┼───────────┼────────────┼──────────┼──────┤  │
│  │  1 │ Wang Fang │ 2 hrs ago  │  ●       │ [✎] │  │
│  │  2 │ Ali Hassan│ Yesterday  │  ●       │ [✎] │  │
│  └────┴───────────┴────────────┴──────────┴──────┘  │
│                                                      │
│  PROFILE TAB                                         │
│  Restaurant name  [________________]                 │
│  Description      [________________]                 │
│  Cuisine type     [________________]                 │
│  Logo             [Upload logo…]  [current preview] │
│                   [Save Changes]                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Revenue Tab
- Three date-range metric cards: Today / This Week / This Month
- Each card shows currency value + 7-day `v-sparkline` trend line
- Two additional cards: total order count and average order value (current day)
- Refreshes on mount; no auto-refresh (pull-to-refresh on mobile)

### 4.2 Staff Tab

**Add Staff Dialog**
```
Name     [____________________]   (required)
PIN      [____________________]   (4–6 digits; hidden input)
         [Add]  [Cancel]
```
- On save: `POST /api/restaurants/{id}/staff`
- New staff receives an active status by default

**Change PIN Dialog**
```
New PIN  [____________________]   (4–6 digits)
Confirm  [____________________]
         [Save]  [Cancel]
```
- Triggered by the pencil icon in the staff table → `PATCH /api/restaurants/{id}/staff/{staffId}`

**Active Toggle**
- Inline `v-switch` in the table — deactivated staff cannot log in
- `PATCH /api/restaurants/{id}/staff/{staffId}` `{ active: false }`

**PIN Lockout Banner** (conditional)
- If a staff member has `failedAttempts >= 3`, show a warning chip: "Locked – 3 failed PINs"
- Owner can reset the lockout by saving a new PIN (clears `failedAttempts`)

### 4.3 Profile Tab
- Editable restaurant name, description, cuisine type
- Logo: `v-file-input` — JPEG/PNG ≤ 2 MB; preview thumbnail after selection
- `PATCH /api/restaurants/{id}` with `multipart/form-data`
- Success: snackbar "Profile updated"

---

## 5. Interactions

| Action | Result |
|--------|--------|
| Page load (Revenue tab) | `GET /api/restaurants/{id}/stats` |
| Switch to Staff tab | `GET /api/restaurants/{id}/staff` (lazy load once) |
| Add staff | `POST /api/restaurants/{id}/staff` → refresh staff table |
| Change PIN | `PATCH /api/restaurants/{id}/staff/{staffId}` `{ pin }` → success snackbar |
| Toggle active | `PATCH /api/restaurants/{id}/staff/{staffId}` `{ active }` |
| Save profile | `PATCH /api/restaurants/{id}` `multipart/form-data` → success snackbar |

---

## 6. APIs

```typescript
GET    /api/restaurants/{id}/stats
Response: {
  todayRevenue: number,
  weekRevenue:  number,
  monthRevenue: number,
  todayOrders:  number,
  avgOrderValue: number,
  sparkline: number[]   // last 7 days daily revenue
}

GET    /api/restaurants/{id}/staff
Response: [{ id, name, active, lastLoginAt, failedAttempts }]

POST   /api/restaurants/{id}/staff
Body:  { name, pin }

PATCH  /api/restaurants/{id}/staff/{staffId}
Body:  { pin?, active? }

PATCH  /api/restaurants/{id}
Body:  multipart/form-data { name?, description?, cuisineType?, logo? }
```

---

## 7. Acceptance Criteria

From **E3 — Owner Management**:

- [ ] Revenue metrics (today / week / month) load on dashboard mount
- [ ] Owner can create staff members with a name and numeric PIN
- [ ] Owner can change a staff PIN; change clears any active PIN lockout
- [ ] Owner can deactivate a staff member; deactivated staff cannot log in
- [ ] Staff table shows last login time and locked status where applicable
- [ ] Restaurant name, description, and logo can be updated from the Profile tab
