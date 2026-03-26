# UX Spec: Guest Item Detail

**Route:** `/menu/:restaurantId/item/:itemId` · **Role:** Guest (anonymous) · **Epic:** E1

---

## 1. Overview

Full-screen item view showing the hero image, description, and all modifier groups. Pre-conditions for "Add to Cart": all required modifier groups must have a valid selection. Price updates in real-time as modifiers are toggled.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | Back button + item name |
| `v-img` | Full-width hero image (16:9 aspect, cover) |
| `v-card` | Item info container + modifier groups |
| `v-card-title` | Item name |
| `v-card-subtitle` | Description |
| `v-divider` | Separates description from modifier section |
| `v-list` + `v-list-item` | Each modifier option |
| `v-radio-group` + `v-radio` | "Pick one" modifier group (required or optional) |
| `v-checkbox` | Multi-select modifier group |
| `v-chip` | "Required" / "Optional" label on group heading |
| `v-counter` | Quantity stepper (−, number, +) |
| `v-textarea` | Special instructions (optional, max 200 chars) |
| `v-btn` (block + elevation-2) | "Add to Cart" CTA — fixed at bottom |
| `v-progress-circular` | Full-screen load spinner |

---

## 3. Layout

```
┌────────────────────────────────┐
│ [←] Item Name                 │  ← v-app-bar
├────────────────────────────────┤
│                                │
│  [       Hero Image      ]     │  ← v-img (16:9, lazy)
│                                │
│  Item Name             $0.00   │  ← v-card-title + dynamic price
│  Short description text…       │  ← v-card-subtitle
│  ─────────────────────────     │
│  [Required] Size               │  ← group heading + chip
│    ○ Small                     │
│    ○ Medium  +$0.50            │
│    ○ Large   +$1.00            │
│  ─────────────────────────     │
│  [Optional] Extra Toppings     │
│    ☐ Extra cheese  +$0.50      │
│    ☐ Spicy sauce   +$0.30     │
│  ─────────────────────────     │
│  Special instructions          │
│  [Allergies, special request…] │
│  ─────────────────────────     │
│  Quantity: [−] 1 [+]           │
│                                │
│  [     Add to Cart — $0.00   ] │  ← fixed v-btn at bottom
└────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Loading
- `v-progress-circular` centered full-screen

### 4.2 Loaded
- All modifier groups in API order
- Radio groups: nothing selected on load; Add to Cart disabled until required groups are satisfied
- Checkboxes: all unchecked on load

### 4.3 Dynamic Price Update
- Price shown in `v-card-title` slot + CTA button label: `basePrice + Σ(selectedModifierDeltas) × quantity`
- Updates reactively on every selection change and quantity change

### 4.4 Validation Error
- Press Add to Cart with unsatisfied required group → scroll to group + red outline on group heading
- Note exceeds 200 chars → char count turns red + CTA disabled

### 4.5 Sold Out Item
- Red "Sold Out" `v-chip` in title + all inputs disabled + CTA hidden

---

## 5. Interactions

| Action | Behaviour |
|--------|-----------|
| Tap [←] back | Navigate back to menu browse |
| Select radio | Price updates immediately |
| Tick / untick checkbox | Price updates; enforces `maxSelections` limit |
| Tap [−] quantity (min=1) | Minimum is 1; button visually disabled at 1 |
| Tap [+] quantity (max=20) | Cap at 20; no further increase |
| Tap Add to Cart (valid) | `useCartStore().addItem(…)` → navigate back to menu + `v-snackbar` "Added to cart" |
| Tap Add to Cart (invalid) | Scroll to + highlight unsatisfied required group(s) |

---

## 6. Data & API

```typescript
// useMenuStore — item detail already loaded in the full menu fetch
// No additional API call if menu is cached in Pinia
interface CartItem {
  itemId: string
  name: string
  quantity: number
  unitPriceEurCents: number  // base + modifier deltas
  selectedModifiers: ModifierOption[]
  note: string
}
// useCartStore().addItem(CartItem) → updates Pinia state
```

---

## 7. Acceptance Criteria

From **E1 — Guest Ordering Flow**:

- [ ] All modifier groups shown with clear required/optional labels
- [ ] Cannot add to cart when required modifier group has no selection
- [ ] Price auto-updates to include selected modifier prices
- [ ] Quantity stepper bounded between 1 and 20
- [ ] Special note is stored per order line
