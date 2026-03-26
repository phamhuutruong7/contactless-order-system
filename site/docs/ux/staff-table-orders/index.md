# UX Spec: Staff Table Orders

**Route:** `/staff/table/:tableId/orders` · **Role:** Staff (authenticated) · **Epic:** E2

---

## 1. Overview

Drill-down screen for a single table. Staff see all active orders for the table grouped by order, with the ability to advance each order's status. Completed/served orders are hidden by default to reduce noise. The back button returns to the floor view.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | "Table N · Orders" title + back arrow |
| `v-list` | Per-order sections |
| `v-list-group` | Collapsible per order (order ID + creation time header) |
| `v-list-item` | Each line item: name, modifiers, note, quantity |
| `v-chip` | Status badge per order (colour matches state) |
| `v-btn` | Status advance action: "Mark Received", "Mark Preparing", "Mark Ready" |
| `v-btn type="text"` | "Mark Served" (final action, subdued style) |
| `v-divider` | Visual separator between orders |
| `v-empty-state` | "No active orders" when table is free |
| `v-dialog` | Confirm dialog before advancing to Served (destructive-ish) |

---

## 3. Layout

```
┌──────────────────────────────────┐
│ ← Table 3 · Orders               │  ← v-app-bar
├──────────────────────────────────┤
│                                  │
│ ▾ Order #A1B2  12:01  [Received] │  ← list-group header
│   Burger ×2                      │
│     + Extra cheese               │
│   Beer (large) ×1                │
│   Note: no ice                   │
│                    [Mark Ready]  │
│                                  │
│ ▾ Order #C3D4  12:15  [Pending]  │
│   Pizza Margherita ×1            │
│               [Mark Received]    │
│                                  │
│ (Served orders hidden)           │
│ [Show served orders]  ←toggle    │
│                                  │
└──────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Loading
- `v-skeleton-loader` for list while data fetches

### 4.2 Active Orders
- Groups listed chronologically (oldest on top)
- Each group shows items + current status chip + one advance action

### 4.3 All Served / No Orders
- `v-empty-state` — "No active orders for this table"

### 4.4 Confirm Served
- `v-dialog` — "Mark order as served? This closes the order."
- Two actions: Confirm / Cancel

---

## 5. Status → Action Mapping

| Current Status | CTA Button Label | Next Status |
|----------------|-----------------|-------------|
| Pending | Mark Received | Received |
| Received | Mark Preparing | Preparing |
| Preparing | Mark Ready | Ready |
| Ready | Mark Served | Served |
| Served | — (hidden) | n/a |

---

## 6. Interactions

| Action | Behaviour |
|--------|-----------|
| Page load | `GET /api/tables/{tableId}/orders?status=active` |
| Tap advance CTA | `PATCH /api/orders/{orderId}/status` → optimistic UI update |
| SignalR `OrderStatusChanged` | Sync chip + CTA reactively (e.g., kitchen advances status) |
| Tap "Mark Served" | Open confirm dialog first |
| Confirm Served | `PATCH` → remove order from list with slide-out transition |
| Toggle served | Show/hide served orders in-page |

---

## 7. API

```typescript
GET /api/tables/{tableId}/orders?status=active
Response: [{ id, status, createdAt, lines: [{ itemName, quantity, modifiers, note }] }]

PATCH /api/orders/{orderId}/status
Body: { status: 'received' | 'preparing' | 'ready' | 'served' }
200:  { id, status, updatedAt }
```

---

## 8. Acceptance Criteria

From **E2 — Staff Operations**:

- [ ] Staff can advance order status with a single tap
- [ ] All active orders for the table are visible on one screen
- [ ] Modifiers and notes are visible per line item (no drill-down needed)
- [ ] Served orders are hidden by default to reduce cognitive load
- [ ] Status changes are reflected immediately (optimistic UI + SignalR confirmation)
