# Edge Cases

**Scope:** Known edge cases and how the system handles them · **Audience:** Developers and QA

---

## 1. Concurrent Orders on the Same Table

**Scenario:** Two guests at the same table submit orders simultaneously (race condition on `POST /api/orders`).

**Handling:**
- Each `POST /api/orders` is independent; no lock is needed on table-level ordering
- Both orders are created successfully with unique `orderId`s
- Both trigger `OrderReceived` on the restaurant SignalR group
- Staff floor view shows both orders as separate cards under the same table label
- Guest tracker at `table/{id}/status` shows **both** orders, each with its own progress bar

**No risk:** The system intentionally allows multiple open orders per table (e.g., drinks ordered first, food ordered later).

---

## 2. SignalR Disconnect During Active Order

**Scenario:** Guest loses network after placing an order while waiting for `OrderStatusChanged`.

**Handling:**
1. Vue composable detects `connection.state === 'Disconnected'`
2. Exponential backoff reconnect: 1 s → 2 s → 4 s → 8 s → 16 s → 30 s (max)
3. On reconnect, client calls `GET /api/orders/{id}` once to fetch current status (reconciliation)
4. UI updates to the true current state — no missed status shown to guest

**Edge within edge:** If guest stays offline until order is `served`, the reconciliation call will show the final status immediately on reconnect.

---

## 3. CloudPRNT Printer Offline at Order Time

**Scenario:** A printer is offline (network drop, powered off) when a new order comes in.

**Handling:**
- Print job is enqueued with `status='pending'`, `created_at = now()`
- Printer polls every 2–3 s; while offline, no poll happens → job stays pending
- Background job checks for jobs with `age > 5 minutes` and marks them `failed`
- `PrintFailed` SignalR event is broadcast to the restaurant group
- Owner and staff see a toast: *"Printer [name] did not respond"*
- **The order itself is unaffected** — it continues through `received → preparing → ready → served` regardless of print status

**Recovery:** If printer comes back online within 5 minutes, it will poll, receive the job, and print normally.

---

## 4. Menu Item Becomes Unavailable After Guest Adds to Cart

**Scenario:** Owner marks an item unavailable while a guest already has it in their cart.

**Handling:**
- `MenuItemAvailabilityChanged` event is pushed to all connected clients
- Guest's menu/cart Vue store updates item's `isAvailable` flag reactively
- Cart shows an inline warning chip on the affected item: *"No longer available"*
- The **Place Order button is disabled** while any cart item is unavailable
- Guest must remove the item before they can submit the order

**API safeguard:** `POST /api/orders` validates item availability server-side. If an item is unavailable at submission time it returns `422 Unprocessable Entity` with a field-level error — even if the client missed the real-time event.

---

## 5. Staff PIN Lockout During a Shift

**Scenario:** A staff member enters the wrong PIN 3 times and is locked out for 15 minutes mid-shift.

**Handling:**
- `locked_until = now() + 15 minutes` is set on the `staff` row
- Login endpoint returns `423 Locked { unlocksAt }` with the unlock timestamp
- PIN entry screen shows: *"Account locked until HH:mm — please contact owner"*
- **Already-authenticated staff** (valid JWT) are unaffected — their existing session continues
- Owner can manually unlock via `PATCH /api/staff/{id}/unlock` (Owner role required)
- Lock expires automatically at `locked_until`; next login attempt proceeds normally

---

## 6. Network Loss Mid-Order on Guest Order-Status Page

**Scenario:** Guest at `table/{id}/status` loses connectivity after order is placed, before it is served.

**Handling:**
- Same reconnection strategy as scenario 2 (exponential backoff + reconciliation GET)
- Status page shows a `v-alert` *"Reconnecting…"* during backoff periods
- `v-progress-linear` indeterminate while reconnecting
- On reconnect, a single `GET /api/orders/{id}` call restores exact current state
- If the order was served while offline, guest sees the final state immediately

---

## 7. Large Menu (100+ Items) Performance

**Scenario:** A restaurant with many categories and 100+ items — menu page must remain responsive.

**Handling:**
- Menu items within each category are rendered using `v-virtual-scroll` — only visible items mount DOM nodes
- Category tabs use `v-tabs` with lazy rendering (`lazy` prop); inactive tabs are not rendered
- Images use `loading="lazy"` on `<img>` elements; Intersection Observer-based lazy load
- API response for `GET /api/menus/{id}` is a single payload (not paginated) but kept small via projection (no full descriptions unless expanded)
- Target: initial menu render < 1 s on a mid-tier Android device on 4G

---

## 8. QR Code Expiry and Table Reassignment

**Scenario:** A restaurant reassigns a table's QR code (e.g., reprints with a new token) while a guest session is active.

**Handling:**
- Old `qr_token` in the `tables` row is replaced with a new UUID
- Guest's existing JWT remains **valid** (it carries `tableId`, not `qrToken`) — their session is unaffected for its 24-hour lifetime
- Any **new** scan of the old QR code returns `401` (token not found in DB)
- Staff can confirm coverage: if old QR is physically replaced, previous guests with active JWTs can still view order status but cannot place new orders (cart checkout validates `tableId` is still active, not the token)

**Owner action:** If a table is decommissioned mid-session, `PATCH /api/tables/{id} { isActive: false }` causes `POST /api/orders` to return `410 Gone`.
