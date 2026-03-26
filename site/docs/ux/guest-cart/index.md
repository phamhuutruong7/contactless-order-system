# UX Spec: Guest Cart

**Route:** `/menu/:restaurantId/cart` · **Role:** Guest (anonymous) · **Epic:** E1

---

## 1. Overview

Order review screen before confirmation. Shows all selected items, allows quantity adjustments and line removal, confirms the table assignment, and submits the order. This is the final screen before the order is sent to the server.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | Back button + "Cart" title |
| `v-list` | Cart line items list |
| `v-list-item` | Each line: item name, modifiers, qty, price |
| `v-counter` | Per-line quantity adjuster |
| `v-btn` (icon, danger) | Remove line button (trash icon) |
| `v-slide-x-transition` | Animate line removal |
| `v-divider` | Separates each line |
| `v-btn-toggle` | Order type selector: "🍽 Table" / "🛍 Take Away" |
| `v-card` + `v-card-text` | Table confirmation panel (shown only when orderType = table) |
| `v-text-field` (readonly) | Table pre-filled from QR session |
| `v-list-item` (summary rows) | Subtotal, Service Fee, Total |
| `v-btn` (block, primary) | "Place Order" CTA |
| `v-empty-state` | Empty cart — back to menu prompt |
| `v-dialog` | Order confirmation summary (2 actions) |
| `v-snackbar` | Error feedback |

---

## 3. Layout

```
┌────────────────────────────────┐
│ [←] Cart (3 items)             │  ← v-app-bar
├────────────────────────────────┤
│ [🍽 Table]  [🛍 Take Away]     │  ← v-btn-toggle
│ Table: Table 5 (from QR)       │  ← readonly v-text-field (hidden for take-away)
│ ─────────────────────────      │
│  [🍔] Burger              x2   │
│       Large, Extra cheese      │  ← modifier summary
│       [−][2][+]    $24.00 [🗑] │
│ ─────────────────────────      │
│  [🍺] Beer               x1   │
│       [−][1][+]     $5.00 [🗑] │
│ ─────────────────────────      │
│                                │
│  Subtotal:          $29.00     │
│  Service fee (10%):  $2.90     │  (if configured)
│  Total:             $31.90     │
│                                │
│  [       Place Order →       ] │  ← v-btn
└────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Items Present
- Full list with line items rendered
- Summary totals calculated from cart store

### 4.2 Empty Cart
- `v-empty-state` with shopping cart icon + "Your cart is empty"
- "Back to Menu" button; Place Order CTA hidden

### 4.3 Submitting
- Place Order button shows loading spinner, disabled
- All form controls disabled to prevent double-submit

### 4.4 Submit Success
- Navigate to `/menu/{restaurantId}/order/{orderId}/status`
- `useCartStore().clear()` called

### 4.5 Submit Error
- Red `v-snackbar` with error message + Retry action

---

## 5. Interactions

| Action | Behaviour |
|--------|-----------|
| Tap [−] / [+] quantity | Updates cart store; totals recalculate |
| Quantity reaches 0 | Line auto-removes with slide-out animation |
| Tap trash icon | Mini confirmation: "Remove item?" → confirm removes line |
| Switch order type | If items in cart, `v-dialog` warns "Switching to Take Away will clear your table selection. Continue?"; confirms → clears `tableId` from store |
| Tap "Place Order" | Shows `v-dialog` summary (order type, item count, total) |
| Confirm in dialog | `POST /api/orders` with cart payload |
| Cancel in dialog | Close dialog; return to cart view |

---

## 6. Data & API

```typescript
// useCartStore (Pinia)
interface Cart {
  restaurantId: string
  orderType: 'table' | 'take_away'
  tableId?: string
  items: CartItem[]
}

// Submit order
POST /api/orders
Body: {
  restaurantId: string
  orderType: 'table' | 'take_away'
  tableId?: string
  lines: [{
    itemId: string
    quantity: number
    selectedModifierIds: string[]
    note: string
  }]
}
Response: { orderId: string, status: 'pending' }
```

---

## 7. Acceptance Criteria

From **E1 — Guest Ordering Flow**:

- [ ] Guest can adjust quantities and remove items from cart
- [ ] Total price updates immediately on quantity change
- [ ] Confirmation dialog shown before order submission
- [ ] Cart clears after successful order placement
- [ ] Clear error feedback + Retry on submission failure
- [ ] Guest can switch between Table and Take Away order types
- [ ] Table panel is hidden when Take Away is selected
- [ ] Take Away orders submit successfully without a tableId
