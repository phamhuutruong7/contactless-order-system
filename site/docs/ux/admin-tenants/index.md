# UX Spec: Admin – Tenant Management

**Route:** `/admin/tenants` · **Role:** Admin (seeded account) · **Epic:** E5

---

## 1. Overview

Provides the seeded admin user with a paginated list of all registered restaurants across the platform. The admin can approve pending registrations, suspend active tenants, and reactivate suspended ones. This is the primary day-to-day oversight screen.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | "Tenant Management" + search field |
| `v-data-table` | Paginated restaurant list |
| `v-chip` | Status: Active (green) / Pending Approval (amber) / Suspended (red) |
| `v-btn` | Per-row action buttons: Approve / Suspend / Reactivate |
| `v-dialog` | Confirm dialog for Suspend and Reactivate actions |
| `v-text-field` | Search by restaurant name / owner email |
| `v-select` | Filter by status |
| `v-snackbar` | Action confirmations and errors |

---

## 3. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Tenant Management                       [Search…] [Status ▾]   │  ← v-app-bar
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────┬──────────────┬────────────────┬────────────┬───────┐  │
│  │  ID  │ Restaurant   │ Owner Email    │ Status     │ Action│  │
│  ├──────┼──────────────┼────────────────┼────────────┼───────┤  │
│  │  1   │ Pho Saigon   │ alice@...      │ ● Active   │[Susp] │  │
│  │  2   │ Bun Bo Hue   │ bob@...        │ ⏳ Pending  │[Appr] │  │
│  │  3   │ Com Tam Vy   │ carol@...      │ ✕ Suspended│[React]│  │
│  └──────┴──────────────┴────────────────┴────────────┴───────┘  │
│                                                                 │
│  Rows per page: [10 ▾]          1–3 of 47   [< >]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Loading
- `v-skeleton-loader` type `table-row` × 5

### 4.2 Empty / No Results
- "No tenants found matching your filters."

### 4.3 Status Chips

| Status | Chip colour | Label |
|--------|-------------|-------|
| `active` | Green | Active |
| `pending_approval` | Amber | Pending Approval |
| `suspended` | Red | Suspended |

### 4.4 Action Buttons (per row)

| Current status | Button shown | API call |
|----------------|-------------|----------|
| `pending_approval` | Approve | `PATCH /api/admin/restaurants/{id}/status` `{ status: 'active' }` |
| `active` | Suspend | `PATCH /api/admin/restaurants/{id}/status` `{ status: 'suspended' }` |
| `suspended` | Reactivate | `PATCH /api/admin/restaurants/{id}/status` `{ status: 'active' }` |

### 4.5 Confirm Dialogs

**Suspend:**
> "Suspend 'Pho Saigon'? The owner and staff will be unable to log in until reactivated."
> [Suspend] [Cancel]

**Reactivate:**
> "Reactivate 'Com Tam Vy'? The owner will regain full access immediately."
> [Reactivate] [Cancel]

No confirmation needed for Approve — it is a low-risk additive action.

### 4.6 Search & Filter
- Search field queries restaurant name or owner email (client-side on current page; server-side on full dataset)
- Status filter dropdown: All / Active / Pending / Suspended
- Both filters combine; table updates on change

---

## 5. Interactions

| Action | Result |
|--------|--------|
| Page load | `GET /api/admin/restaurants?page=1&limit=10` |
| Change page / page size | `GET /api/admin/restaurants?page={n}&limit={size}` |
| Search | `GET /api/admin/restaurants?search={q}` |
| Filter by status | `GET /api/admin/restaurants?status={status}` |
| Approve | `PATCH /api/admin/restaurants/{id}/status { status:'active' }` |
| Suspend (confirmed) | `PATCH /api/admin/restaurants/{id}/status { status:'suspended' }` |
| Reactivate (confirmed) | `PATCH /api/admin/restaurants/{id}/status { status:'active' }` |

All mutating actions refresh the current page on success and show a snackbar.

---

## 6. APIs

```typescript
GET  /api/admin/restaurants
Query: { page?, limit?, search?, status? }
Response: {
  data: [{ id, name, ownerEmail, status, createdAt }],
  total: number,
  page:  number,
  limit: number
}

PATCH /api/admin/restaurants/{id}/status
Body: { status: 'active' | 'suspended' }
200:  { id, status }
```

---

## 7. Acceptance Criteria

From **E5 — Admin & Platform**:

- [ ] Admin can view all restaurants with pagination (10/25/50 per page)
- [ ] Admin can filter tenants by status and search by name or owner email
- [ ] Admin can approve, suspend, and reactivate tenants
- [ ] Suspend action requires confirmation; Approve does not
- [ ] Status change is reflected immediately in the table row without a full reload
- [ ] Suspended tenant owner and staff receive 401/403 on all authenticated requests
