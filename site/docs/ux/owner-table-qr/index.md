# UX Spec: Owner – Table & QR Management

**Route:** `/owner/tables` · **Role:** Owner (authenticated via Google OAuth) · **Epic:** E3

---

## 1. Overview

Allows owners to manage physical tables for the restaurant and generate QR codes that encode the guest-menu URL for each table. Guests scan the QR code to land on the menu pre-loaded with the correct `restaurantId` and `tableId`.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | "Tables & QR Codes" + "Add Table" button |
| `v-data-table` | Paginated table list: number, seats, status, actions |
| `v-chip` | Table status (Active / Inactive) |
| `v-btn icon` | Edit, QR code, Delete actions per row |
| `v-dialog` | Add/edit table form |
| `v-dialog` (QR) | QR code preview + download button |
| `v-text-field` | Table number, seat count |
| `v-switch` | Active/inactive toggle |
| `v-img` | QR code rendered as SVG/PNG |
| `v-btn` | "Download PNG" in QR dialog |
| `v-snackbar` | "Table saved" / "QR link copied" feedback |
| `v-empty-state` | "No tables yet — add your first table" |

---

## 3. Layout

```
┌────────────────────────────────────────────┐
│  Tables & QR Codes              [+ Add Table] │  ← v-app-bar
├────────────────────────────────────────────┤
│  # │ Name   │ Seats │ Status    │ Actions   │
│ ───┼────────┼───────┼───────────┼─────────  │
│  1 │  T1    │   4   │ ● Active  │ ✎  ▣  🗑 │
│  2 │  T2    │   2   │ ● Active  │ ✎  ▣  🗑 │
│  3 │  Outside│  6   │ ○ Inactive│ ✎  ▣  🗑 │
│                                            │
│  < 1  2  3 >                               │  ← pagination
└────────────────────────────────────────────┘
```

▣ = QR code icon (opens QR dialog).

---

## 4. UI States

### 4.1 Loading
- `v-skeleton-loader` type `table`

### 4.2 Table Form Dialog (Add / Edit)
```
Table Number / Name  [________]  (required, unique)
Seats                [________]  (required, ≥ 1)
Active?              [● Yes]     (v-switch, default: on)
                     [Save]  [Cancel]
```

### 4.3 QR Code Dialog
```
┌────────────────────────────┐
│  QR Code — Table T1        │
│  ┌──────────────────────┐  │
│  │   [QR SVG/PNG]       │  │
│  └──────────────────────┘  │
│  URL: https://...          │
│  [Copy Link]  [Download PNG] │
│                  [Close]   │
└────────────────────────────┘
```

### 4.4 Delete Confirmation
- `v-dialog` — "Delete table 'T1'? Active QR codes for this table will stop working."

---

## 5. Interactions

| Action | Result |
|--------|--------|
| Page load | `GET /api/restaurants/{restaurantId}/tables` |
| Add table | Dialog save → `POST /api/restaurants/{restaurantId}/tables` |
| Edit table | Dialog save → `PATCH /api/restaurants/{restaurantId}/tables/{id}` |
| Delete table | Confirm → `DELETE /api/restaurants/{restaurantId}/tables/{id}` |
| Open QR dialog | `GET /api/tables/{id}/qr` → renders SVG in dialog |
| Copy link | Copies guest menu URL to clipboard; shows "Copied!" snackbar |
| Download PNG | Triggers browser download of QR as PNG |

---

## 6. API

```typescript
GET    /api/restaurants/{restaurantId}/tables
Response: [{ id, number, name, seatCount, active }]

POST   /api/restaurants/{restaurantId}/tables
Body:  { number, name, seatCount, active: bool }

PATCH  /api/restaurants/{restaurantId}/tables/{id}
Body:  Partial<Table>

DELETE /api/restaurants/{restaurantId}/tables/{id}  → 204

GET    /api/tables/{id}/qr
Response: { qrSvg: string, guestUrl: string }
```

`guestUrl` format: `https://<host>/menu/{restaurantId}?table={tableId}`

---

## 7. Acceptance Criteria

From **E3 — Table & QR Management**:

- [ ] Owner can add tables with number/name and seat count
- [ ] Each table has a unique QR code that encodes the correct guest URL
- [ ] QR code can be downloaded as PNG for printing
- [ ] Inactive tables are visually distinguished; their QR codes redirect to a "table unavailable" page
- [ ] Deleting a table warns that its QR code will stop working
