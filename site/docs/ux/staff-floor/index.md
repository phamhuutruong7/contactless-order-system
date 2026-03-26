# UX Spec: Staff Floor View

**Route:** `/staff/floor` · **Role:** Staff (authenticated) · **Epic:** E2

---

## 1. Overview

The primary working screen for floor staff. Shows all tables in the restaurant as a grid of cards, each reflecting current occupancy and order state. Cards update in real time via SignalR. Tapping a table opens its order list.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | Restaurant name, staff name chip, logout icon |
| `v-chip` (staff name) | Shows logged-in staff name; tapping opens profile |
| `v-container` | Responsive grid wrapper |
| `v-card` | Table card — number, status colour, seat count |
| `v-badge` | Order count badge on card (red dot = has ready items) |
| `v-icon` | Seat icon, bell icon for ready orders |
| `v-progress-linear` | Global indeterminate loading bar on SignalR disconnect |
| `v-snackbar` | Toast when an order transitions to Ready |
| `v-btn` (icon) | Refresh button (manual fallback) |

---

## 3. Layout

```
┌─────────────────────────────────────┐
│ Restaurant Name    [Staff: Ana] [⏏] │  ← v-app-bar
├─────────────────────────────────────┤
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │  T1  │  │  T2  │  │  T3  │       │  ← table grid
│  │ Free │  │  ●3  │  │ 🔔1  │       │      green=free
│  │ 👥4  │  │ 👥2  │  │ 👥6  │       │      amber=occupied
│  └──────┘  └──────┘  └──────┘       │      red=ready order
│  ┌──────┐  ┌──────┐  . . .          │
│  │  T4  │  │  T5  │                 │
│  │ Busy │  │ Busy │                 │
│  └──────┘  └──────┘                 │
│                                     │
└─────────────────────────────────────┘
```

**Card colour semantics:**
- Green — table is free (no active orders)
- Amber — table has active orders; all in-progress
- Red (pulsing) — at least one order line is Ready

---

## 4. UI States

### 4.1 Loading
- Skeleton grid while `GET /api/restaurants/{id}/tables` loads

### 4.2 Normal
- All tables rendered per restaurant layout

### 4.3 Ready Order Notification
- Affected table card turns red with pulse animation
- `v-snackbar` — "Table 3: Order ready for delivery"

### 4.4 SignalR Disconnected
- `v-progress-linear` indeterminate at top of page
- Table cards grey out with a connection-lost overlay

---

## 5. Interactions

| Action | Behaviour |
|--------|-----------|
| Page load | `GET /api/restaurants/{id}/tables` + subscribe SignalR |
| SignalR `OrderStatusChanged` (any → Ready) | Update table card to red, show snackbar |
| SignalR `OrderStatusChanged` (Ready → Served) | Update card colour back |
| Tap table card | Navigate to `/staff/table/:tableId/orders` |
| Tap logout | Clear session → `/staff/login` |

---

## 6. SignalR Integration

```typescript
connection.on('OrderStatusChanged', (payload) => {
  const table = tables.value.find(t => t.id === payload.tableId)
  if (table) {
    table.hasReadyOrder = payload.status === 'ready'
    if (payload.status === 'ready') showReadySnackbar(table.number)
  }
})
```

---

## 7. API

```typescript
GET /api/restaurants/{restaurantId}/tables
Response: [{
  id, number, seatCount,
  status: 'free' | 'occupied',
  activeOrders: number,
  hasReadyOrder: boolean
}]
```

---

## 8. Acceptance Criteria

From **E2 — Staff Operations**:

- [ ] All tables visible in a grid ordered by table number
- [ ] Ready-order tables visually distinct (red + pulse) from occupied tables
- [ ] Staff are notified via snackbar when any table transitions to Ready
- [ ] Tapping a table card navigates to that table's order list
- [ ] Screen reflects live state after SignalR reconnect
