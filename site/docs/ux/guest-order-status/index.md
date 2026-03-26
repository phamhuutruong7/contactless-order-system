# UX Spec: Guest Order Status

**Route:** `/menu/:restaurantId/order/:orderId/status` · **Role:** Guest (anonymous) · **Epic:** E1

---

## 1. Overview

Real-time order tracking screen. Guests land here immediately after placing an order and can leave this tab open to watch their order progress through the kitchen pipeline. Status updates arrive via SignalR — no polling required. A progress stepper visualises the state machine.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | Restaurant name + "Order Status" title; no back button (complete flow) |
| `v-stepper` (vertical) | Visual pipeline: Pending → Received → Preparing → Ready → Served |
| `v-stepper-item` | Each state with icon + label + timestamp |
| `v-icon` (animated) | Spinning chef hat while Preparing; checkmark on Served |
| `v-card` | Order summary panel (order ID, table, items) |
| `v-list` + `v-list-item` | Read-only line items for reference |
| `v-chip` | Current state badge (colour-coded) |
| `v-alert type="success"` | "Your order is ready! A staff member will bring it to you" — shown on Ready |
| `v-alert type="warning"` | Print failure banner (if `PrintFailed` SignalR event received) |
| `v-btn` | "Order More" — navigates back to menu keeping session |
| `v-progress-circular` | Spinner during initial status fetch |

---

## 3. Layout

```
┌────────────────────────────────┐
│ Restaurant Name · Order Status │  ← v-app-bar
├────────────────────────────────┤
│                                │
│  Order #A1B2 · Table 5         │  ← v-card header
│  ─────────────────────────     │
│  ● Pending       12:01         │  ← v-stepper-item (completed)
│  ● Received      12:01         │  ← completed
│  ⟳ Preparing     12:02         │  ← active (animated icon)
│  ○ Ready                       │  ← upcoming
│  ○ Served                      │  ← upcoming
│  ─────────────────────────     │
│  Burger ×2             $24.00  │  ← read-only lines
│  Beer ×1                $5.00  │
│  ─────────────────────────     │
│  [  🍽 Order More from Menu  ] │  ← v-btn
│                                │
│  [⚠ Printer issue — staff     │  ← v-alert warning (conditional)
│    has been notified]          │
└────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Loading (initial fetch)
- `v-progress-circular` shown while `GET /api/orders/{orderId}` resolves

### 4.2 Pending
- Stepper: step 1 active (orange dot)
- Chip: "Pending" (grey)
- Copy: "Your order has been sent to the kitchen"

### 4.3 Received
- Step 1–2 complete; animated transition
- Chip: "Received" (blue)

### 4.4 Preparing
- Steps 1–2 checked; step 3 animated
- Chip: "Preparing" (amber)
- Animated spinning chef hat icon on active step

### 4.5 Ready
- Steps 1–3 checked; step 4 active
- `v-alert type="success"` — "Your order is ready!"
- Chip turns green

### 4.6 Served
- All steps checked; final step active
- Subtle confetti animation (CSS only, accessible)
- `v-btn` — "Order More" to restart flow

### 4.7 Cancelled
- Stepper shows red X on cancelled step
- `v-alert type="error"` — "Your order has been cancelled. Please ask a staff member."

### 4.8 Print Failed (background event)
- `v-alert type="warning"` banner injected at bottom
- Copy: "We're experiencing a printing issue. Staff have been notified."

---

## 5. Interactions

| Action | Behaviour |
|--------|-----------|
| Page loads | `GET /api/orders/{orderId}` → set initial state |
| SignalR `OrderStatusChanged` | Update stepper state reactively (no reload) |
| SignalR `PrintFailed` | Show warning alert |
| Tap "Order More" | Navigate to `/menu/{restaurantId}` keeping `tableId` in session |
| Page refresh | Re-connect SignalR + re-fetch current status |

---

## 6. SignalR Integration

```typescript
// useOrderStatusStore composable
const connection = new HubConnectionBuilder()
  .withUrl('/hubs/orders')
  .withAutomaticReconnect()
  .build()

connection.on('OrderStatusChanged', (payload: { orderId, status, timestamp }) => {
  if (payload.orderId === currentOrderId) {
    orderStatus.value = payload.status
    statusHistory.value.push({ status: payload.status, at: payload.timestamp })
  }
})

connection.on('PrintFailed', (payload: { orderId }) => {
  if (payload.orderId === currentOrderId) showPrintWarning.value = true
})

// Join restaurant group on connect
connection.invoke('JoinRestaurant', restaurantId)
```

---

## 7. Data & API

```typescript
GET /api/orders/{orderId}
Response: {
  id: string
  tableId: string
  status: 'pending' | 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
  lines: [{ itemName, quantity, unitPriceEurCents, modifierSummary }]
  statusHistory: [{ status, occurredAt }]
}
```

---

## 8. Acceptance Criteria

From **E1 — Guest Ordering Flow**:

- [ ] Guest sees real-time status updates without refreshing
- [ ] All 5 order states are visually distinct in the stepper
- [ ] "Ready" state triggers a prominent notification (alert + green chip)
- [ ] Print failure does not block guest from seeing order status
- [ ] Guest can navigate back to menu and place another order from this screen
- [ ] SignalR reconnects automatically if connection drops
