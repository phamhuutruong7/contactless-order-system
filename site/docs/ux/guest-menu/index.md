# UX Spec: Guest Menu Browse

**Route:** `/menu/:restaurantId` · **Role:** Guest (anonymous) · **Epic:** E1

---

## 1. Overview

The first screen a guest sees after scanning the table QR code. The URL encodes both the `restaurantId` and the `tableId` as query params so the system knows which restaurant and table the session belongs to. A Supabase anonymous session is automatically created on first load.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | Fixed top bar: restaurant logo + name + language toggle |
| `v-tabs` + `v-tab` | Horizontal category tabs (sticky below app bar) |
| `v-window` + `v-window-item` | Swipeable panels per category |
| `v-card` (flat, rounded) | Menu item card (photo, name, price, add button) |
| `v-img` | Item photo (lazy loaded, aspect-ratio 16:9, cover) |
| `v-skeleton-loader` | Loading placeholder while menu data fetches  |
| `v-badge` | Cart item count indicator on FAB / bottom nav |
| `v-bottom-navigation` | Cart, Order Status links (visible once cart has items) |
| `v-chip` | "Sold Out" tag overlay on unavailable items |
| `v-snackbar` | Confirmation when item added to cart |
| `v-progress-circular` | Full-screen spinner on initial load |
| `v-empty-state` | Zero items in category message |

---

## 3. Layout

```
┌────────────────────────────────┐
│ [Logo] Restaurant Name   [🌐]  │  ← v-app-bar (fixed, z-elevation-4)
├────────────────────────────────┤
│ [Cat A] [Cat B] [Cat C] […]   │  ← v-tabs (sticky, scrollable)
├────────────────────────────────┤
│                                │
│  ┌──────┐  ┌──────┐            │  ← v-col 6 (mobile) / 4 (tablet)
│  │ img  │  │ img  │            │
│  ├──────┤  ├──────┤            │
│  │ Name │  │ Name │            │
│  │$0.00 │  │$0.00 │            │
│  │ [+]  │  │ [+]  │            │
│  └──────┘  └──────┘            │
│                                │
└────────────────────────────────┘
│  [🛒 2]  [Menu]  [My Order]   │  ← v-bottom-navigation (fixed bottom)
```

- `v-row` with `dense` spacing fills the category window
- Cards are `v-col cols="6" md="4"` for responsive grid
- Language toggle (🌐) in app-bar right slot; switches `$i18n.locale` (en/vi)

---

## 4. UI States

### 4.1 Loading
- `v-progress-circular` centered, full screen on initial page mount
- `v-skeleton-loader` type `card` × 6 while fetching

### 4.2 Success (data loaded)
- Tabs render one per `MenuCategory`, sorted by `sort_order`
- Cards render per `MenuItem` in active category
- Sold-out items: `v-chip` "Sold Out" overlay + add button `disabled`

### 4.3 Empty Category
- `v-empty-state` with plate icon + "No items in this category" message
- Still shows in tab list but panel is empty

### 4.4 Error / Offline
- Full-page `v-alert type="error"` + Retry button
- PWA service worker serves cached menu if offline (stale-while-revalidate)

### 4.5 Cart Has Items
- `v-bottom-navigation` appears (slide-in animation)
- Cart tab has `v-badge` with count from `useCartStore().itemCount`

---

## 5. Interactions

| Action | Behaviour |
|--------|-----------|
| Scan QR | Open URL `/menu/{restaurantId}?table={tableId}` — auto-create anon session |
| Tap category tab | Switches `v-window` pane; smooth scroll back to top of pane |
| Swipe left/right | Navigate between category panes (touch-enabled `v-window`) |
| Tap item card | Navigate to `/menu/{restaurantId}/item/{itemId}` (Guest Item Detail) |
| Tap `[+]` add button | If no modifiers required: add 1 to cart immediately + `v-snackbar` confirm |
| Tap `[+]` on item with required modifiers | Navigate to Item Detail screen (modifier selection required first) |
| Tap cart icon / bottom nav | Navigate to `/menu/{restaurantId}/cart` |
| Tap language toggle | Switch locale; menu labels re-render (if API returns bilingual data) |

---

## 6. Data & API

```typescript
// Pinia store: useMenuStore
GET /api/menu/{restaurantId}
Response: {
  restaurant: { id, name, logoUrl },
  categories: [{ id, name, sortOrder, items: [{ id, name, description, priceEurCents, isAvailable, photoUrl, hasModifiers }] }]
}
```

- Fetched once on mount; no polling needed (availability changes come via SignalR `MenuItemAvailabilityChanged`)
- `restaurantId` + `tableId` stored in `useSessionStore` on first mount

---

## 7. SignalR Events

| Event | Effect |
|-------|--------|
| `MenuItemAvailabilityChanged` | Toggle `isAvailable` on item; show/hide Sold Out chip reactively |

---

## 8. Acceptance Criteria

From **E1 — Guest Ordering Flow**:

- [ ] Guest can browse all menu categories without login
- [ ] Unavailable items are clearly marked and cannot be added to cart
- [ ] Cart count is visible and updates as items are added
- [ ] Language toggle persists across navigation
- [ ] Menu loads within 2 seconds on 4G; skeleton shown during load
