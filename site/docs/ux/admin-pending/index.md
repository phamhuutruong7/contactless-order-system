# UX Spec: Admin – Pending Approvals

**Route:** `/admin/pending` · **Role:** Admin (seeded account) · **Epic:** E5

---

## 1. Overview

A focused queue showing only restaurants with `pending_approval` status. Newly registered owners land here awaiting admin review. The admin can approve (activating the owner) or reject (optionally sending a rejection reason).

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | "Pending Approvals" + count badge |
| `v-list` / `v-list-item` | One row per pending registration |
| `v-card` | Expandable registration detail card |
| `v-chip` | "Pending Approval" — amber |
| `v-btn` | Approve (green) and Reject (outlined, red) per item |
| `v-dialog` | Rejection dialog with optional reason textarea |
| `v-textarea` | Rejection reason input (optional, sent by email) |
| `v-empty-state` | "No pending registrations" |
| `v-snackbar` | "Approved" / "Rejected" feedback |

---

## 3. Layout

```
┌─────────────────────────────────────────────────────┐
│  Pending Approvals                          (3)      │  ← v-app-bar + badge
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Pho Saigon                  Submitted 2h ago│    │  ← v-card
│  │  alice@example.com                           │    │
│  │  Cuisine: Vietnamese  |  Location: London    │    │
│  │                     [Approve]  [Reject]       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Bun Bo Hue                  Submitted 5h ago│    │
│  │  bob@example.com                             │    │
│  │  Cuisine: Vietnamese  |  Location: Manchester│    │
│  │                     [Approve]  [Reject]       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Loading
- `v-skeleton-loader` type `list-item-three-line` × 3

### 4.2 Empty Queue
- `v-empty-state` — "All caught up! No pending registrations."

### 4.3 Approve Flow
1. Admin clicks **Approve**
2. Immediate optimistic update — row fades out
3. `PATCH /api/admin/restaurants/{id}/status { status: 'active' }`
4. Snackbar: "Pho Saigon approved. Owner notified by email."
5. Pending count badge decrements

### 4.4 Reject Flow
1. Admin clicks **Reject**
2. Dialog opens:
```
Reject 'Pho Saigon'?

Reason (optional — will be included in rejection email)
┌────────────────────────────────────────┐
│                                        │
└────────────────────────────────────────┘

[Confirm Rejection]  [Cancel]
```
3. `PATCH /api/admin/restaurants/{id}/status { status: 'rejected', reason? }`
4. Snackbar: "Pho Saigon rejected."
5. Row removed from queue; badge decrements

### 4.5 Count Badge
- Shown in the app bar and potentially in the admin navigation sidebar
- Real-time count from `GET /api/admin/restaurants?status=pending_approval` total field
- Refreshes on every approve/reject action

---

## 5. Interactions

| Action | Result |
|--------|--------|
| Page load | `GET /api/admin/restaurants?status=pending_approval&limit=50` |
| Approve | `PATCH /api/admin/restaurants/{id}/status { status: 'active' }` |
| Reject (with/without reason) | `PATCH /api/admin/restaurants/{id}/status { status: 'rejected', reason? }` |

---

## 6. APIs

```typescript
GET  /api/admin/restaurants?status=pending_approval
Response: {
  data: [{
    id, name, ownerEmail, cuisineType, location, createdAt
  }],
  total: number
}

PATCH /api/admin/restaurants/{id}/status
Body: { status: 'active' | 'rejected', reason?: string }
200:  { id, status }
```

---

## 7. Acceptance Criteria

From **E5 — Admin & Platform**:

- [ ] Pending queue shows only `pending_approval` restaurants, sorted oldest-first
- [ ] Count badge reflects the real number of pending registrations
- [ ] Admin can approve a registration with one click; no confirmation required
- [ ] Admin can reject a registration with an optional rejection reason
- [ ] Rejection reason is included in the automated email to the owner
- [ ] Approved/rejected items disappear from the queue immediately
- [ ] Empty state displays when no pending registrations remain
