# UX Spec: Guest Checkout (Order Confirmation)

**Route:** `/menu/:restaurantId/checkout` · **Role:** Guest (anonymous) · **Epic:** E1

---

## 1. Overview

Intermediate confirmation screen between Cart and Order Status. Presents a final read-only summary — table, items, total — before the guest taps the final confirm button which fires `POST /api/orders`. Distinct from the Cart screen: no editing here, only confirm or go back.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | Back to cart + "Confirm Order" title |
| `v-card` | Order summary container |
| `v-card-title` | "Your Order" heading |
| `v-list` + `v-list-item` | Read-only line items (name, qty, price) |
| `v-chip` (outlined) | Item type tag: Food / Drink |
| `v-divider` | Separates lines from totals |
| `v-list-item` (summary) | Subtotal, Service Fee, Total rows |
| `v-card` (outlined) | Table info card |
| `v-icon` + text | Table number + QR scan indicator |
| `v-btn` (block, large, primary) | "Confirm & Place Order" CTA |
| `v-btn` (text) | "← Edit Cart" secondary action |
| `v-progress-linear` | Top-of-screen loading bar while submitting |
| `v-snackbar` | Error notification |

---

## 3. Layout

```
┌────────────────────────────────┐
│ [←] Confirm Order              │  ← v-app-bar
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ 📍 Table 5               │  │  ← outlined card (table info)
│  └──────────────────────────┘  │
│                                │
│  Your Order                    │  ← v-card-title
│  ─────────────────────────     │
│   Burger ×2     [Food] $24.00  │
│   Large, Extra cheese          │
│   Beer ×1       [Drink] $5.00  │
│  ─────────────────────────     │
│  Subtotal              $29.00  │
│  Service fee (10%)      $2.90  │
│  Total                 $31.90  │
│                                │
│  [  Confirm & Place Order  ]   │  ← v-btn (block, primary)
│  [       ← Edit Cart       ]   │  ← v-btn (text)
└────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Default (review state)
- All fields read-only; no edit controls
- CTA is enabled and clearly visible

### 4.2 Submitting
- `v-progress-linear` indeterminate appears at top of screen
- CTA disabled + shows spinner label "Placing order…"
- "Edit Cart" button also disabled

### 4.3 Success
- Navigate immediately to `/menu/{restaurantId}/order/{orderId}/status`
- `useCartStore().clear()`

### 4.4 Error
- `v-progress-linear` hidden
- Buttons re-enabled
- `v-snackbar` error: "Failed to place order. Please try again."

---

## 5. Interactions

| Action | Behaviour |
|--------|-----------|
| Tap "← Edit Cart" | Navigate back to `/menu/{restaurantId}/cart` |
| Tap "Confirm & Place Order" | `POST /api/orders` → success → order status page |
| Back button (system / swipe) | Navigate back to cart |

---

## 6. Data & API

```typescript
// Read from useCartStore — no API call on this screen until submit

POST /api/orders
Body: { restaurantId, tableId, lines: [...] }
Response: { orderId: string, status: 'pending' }

// On success:
router.push(`/menu/${restaurantId}/order/${orderId}/status`)
useCartStore().clear()
```

---

## 7. Acceptance Criteria

From **E1 — Guest Ordering Flow**:

- [ ] Checkout screen is read-only; guest cannot edit from here
- [ ] Table information is clearly displayed
- [ ] Food vs drink items are visually distinguishable
- [ ] One tap confirms and submits the order
- [ ] On success, guest is immediately taken to order status
- [ ] On failure, guest can retry without losing cart data
