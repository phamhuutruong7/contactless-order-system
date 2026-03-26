# UX Spec: Owner – Printer Setup

**Route:** `/owner/printers` · **Role:** Owner (authenticated via Google OAuth) · **Epic:** E4

---

## 1. Overview

Allows owners to register Star CloudPRNT-compatible printers by entering the device token and giving each printer a label (e.g. "Kitchen", "Bar"). Displays last-poll time and connection status. Supports test print to verify configuration.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | "Printer Setup" + "Add Printer" button |
| `v-card` | One card per registered printer |
| `v-card-title` | Printer name + status chip |
| `v-card-subtitle` | Last seen: "2 minutes ago" / "Never" |
| `v-chip` | Online (green) / Offline (grey) / Error (red) |
| `v-btn` | "Test Print", "Edit", "Delete" per card |
| `v-dialog` | Add/edit printer form |
| `v-text-field` | Printer name (label), Device token |
| `v-snackbar` | "Test print sent" / "Printer not responding" |
| `v-empty-state` | "No printers registered" |
| `v-progress-circular` | While test print is in-flight |

---

## 3. Layout

```
┌────────────────────────────────────────┐
│  Printer Setup              [+ Add Printer] │  ← v-app-bar
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Kitchen Printer     ● Online     │  │  ← v-card
│  │ Last seen: 30 s ago              │  │
│  │ Token: abc123…                   │  │
│  │  [Test Print]  [Edit]  [Delete]  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Bar Printer         ○ Offline    │  │
│  │ Last seen: 4 hours ago           │  │
│  │ Token: xyz789…                   │  │
│  │  [Test Print]  [Edit]  [Delete]  │  │
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Loading
- `v-skeleton-loader` type `card` × 2

### 4.2 Empty
- `v-empty-state` — "No printers registered. Add a printer to start accepting print jobs."

### 4.3 Printer Form Dialog (Add / Edit)
```
Printer Name  [____________________]  (required, e.g. "Kitchen")
Device Token  [____________________]  (required, from CloudPRNT portal)
              [Save]  [Cancel]
```
Device token is masked after save (shows first 6 chars + `…`).

### 4.4 Online Status Logic
- **Online**: last poll within 60 s
- **Idle**: last poll 1–5 min ago (shown as Online but with note "Idle")
- **Offline**: last poll > 5 min ago, or no poll received yet

### 4.5 Test Print
- Clicking "Test Print" → button shows spinner, sends `POST /api/print/test`
- Success: snackbar "Test print sent to [Name]"
- Failure (printer offline): snackbar "Printer not responding — check device"

### 4.6 Delete Confirmation
- `v-dialog` — "Delete 'Kitchen Printer'? Pending print jobs for this printer will be discarded."

---

## 5. Interactions

| Action | Result |
|--------|--------|
| Page load | `GET /api/restaurants/{restaurantId}/printers` |
| Add printer | Dialog save → `POST /api/restaurants/{restaurantId}/printers` |
| Edit printer | Dialog save → `PATCH /api/restaurants/{restaurantId}/printers/{id}` |
| Delete printer | Confirm → `DELETE /api/restaurants/{restaurantId}/printers/{id}` |
| Test print | `POST /api/print/test` `{ printerId }` → success/failure snackbar |
| Auto-refresh status | Poll `GET /api/restaurants/{restaurantId}/printers` every 30 s |

---

## 6. API

```typescript
GET    /api/restaurants/{restaurantId}/printers
Response: [{ id, name, deviceToken, lastSeenAt, status: 'online' | 'idle' | 'offline' }]

POST   /api/restaurants/{restaurantId}/printers
Body:  { name, deviceToken }

PATCH  /api/restaurants/{restaurantId}/printers/{id}
Body:  { name?, deviceToken? }

DELETE /api/restaurants/{restaurantId}/printers/{id}  → 204

POST   /api/print/test
Body:  { printerId: string }
200:   { queued: true }
503:   { error: 'printer_offline' }
```

---

## 7. Acceptance Criteria

From **E4 — Printing**:

- [ ] Owner can register a printer with a name and CloudPRNT device token
- [ ] Connection status (Online / Idle / Offline) refreshes every 30 seconds
- [ ] Test print validates the printer is reachable before going live
- [ ] Device token is masked on display (security: not shown in plain text)
- [ ] Deleting a printer warns that pending jobs will be discarded
