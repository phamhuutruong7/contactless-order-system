# UX Spec: Owner – Modifier Editor

**Route:** `/owner/modifiers` · **Role:** Owner (authenticated via Google OAuth) · **Epic:** E3

---

## 1. Overview

Allows owners to define modifier groups (e.g. "Milk choice", "Add-ons") and associate them with menu items. Each group has a name, required/optional flag, min/max selection count, and an ordered list of options with optional price deltas.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | "Modifier Editor" + "Add Group" button |
| `v-expansion-panels` | One panel per modifier group |
| `v-expansion-panel-title` | Group name + selection rule summary + edit/delete icons |
| `v-expansion-panel-text` | Sortable list of modifier options |
| `v-list-item` | Option row: name, price delta (±), drag handle, delete icon |
| `v-text-field` | Option name + price delta inputs |
| `v-btn` | "Add Option" within each group |
| `v-dialog` | Add/edit group form |
| `v-select` | Min/max selection count pickers in group form |
| `v-switch` | "Required" toggle on group form |
| `v-snackbar` | "Saved" / error toast |
| `v-empty-state` | "No modifier groups yet" |

---

## 3. Layout

```
┌──────────────────────────────────────────┐
│  Modifier Editor              [+ Add Group] │  ← v-app-bar
├──────────────────────────────────────────┤
│                                          │
│  ▾ Milk Choice  (pick exactly 1)         │
│    [Edit] [Delete]                       │
│    ⠿  Whole Milk        +£0.00           │
│    ⠿  Oat Milk          +£0.50           │
│    ⠿  Soy Milk          +£0.50           │
│                          [+ Add Option]  │
│                                          │
│  ▾ Extras  (pick 0–3)                    │
│    [Edit] [Delete]                       │
│    ⠿  Extra Shot        +£0.80           │
│    ⠿  Syrup             +£0.40           │
│                          [+ Add Option]  │
│                                          │
└──────────────────────────────────────────┘
```

---

## 4. UI States

### 4.1 Loading
- `v-skeleton-loader` while fetching modifier groups

### 4.2 Group Form Dialog (Add / Edit)
```
Group Name     [____________________]  (required)
Required?      [○ No  ● Yes]          (v-switch)
Min selections [1 ▾]
Max selections [1 ▾]
               [Save]  [Cancel]
```
Validation: max ≥ min; if required, min ≥ 1.

### 4.3 Inline Option Add
- Clicking "Add Option" appends an editable row at the bottom of the group
- Row has: name field, price delta field (± prefix), confirm tick, discard X

### 4.4 Option Edit
- Clicking option row makes it inline-editable (same fields)

### 4.5 Delete Confirmation
- `v-dialog` — for group deletion (cascades to all options)
- Individual option deletion has no confirmation dialog (inline X button, reversible via snackbar undo)

---

## 5. Interactions

| Action | Result |
|--------|--------|
| Page load | `GET /api/menu/{restaurantId}/modifier-groups` |
| Add group | Dialog save → `POST /api/menu/{restaurantId}/modifier-groups` |
| Edit group | Dialog save → `PATCH /api/menu/{restaurantId}/modifier-groups/{id}` |
| Delete group | Confirm → `DELETE /api/menu/{restaurantId}/modifier-groups/{id}` |
| Add option | Inline save → `POST /api/menu/{restaurantId}/modifier-groups/{id}/options` |
| Edit option | Inline save → `PATCH /api/menu/{restaurantId}/modifier-groups/{groupId}/options/{id}` |
| Delete option | Inline X → `DELETE …/options/{id}` + snackbar undo (5 s) |
| Drag-reorder option | `PATCH …/options/{id}` `{ sortOrder: int }` |

---

## 6. API

```typescript
GET    /api/menu/{restaurantId}/modifier-groups
Response: [{ id, name, required, min, max, options: [{ id, name, priceDelta, sortOrder }] }]

POST   /api/menu/{restaurantId}/modifier-groups
Body:  { name, required: bool, min: int, max: int }

PATCH  /api/menu/{restaurantId}/modifier-groups/{id}
Body:  Partial<ModifierGroup>

DELETE /api/menu/{restaurantId}/modifier-groups/{id}   → 204

POST   /api/menu/{restaurantId}/modifier-groups/{id}/options
Body:  { name, priceDelta: number, sortOrder: int }

PATCH  /api/menu/{restaurantId}/modifier-groups/{id}/options/{optId}
Body:  Partial<Option>

DELETE /api/menu/{restaurantId}/modifier-groups/{id}/options/{optId}  → 204
```

---

## 7. Acceptance Criteria

From **E3 — Menu Management**:

- [ ] Owner can create modifier groups with name, required flag, min/max counts
- [ ] Owner can add, rename, reprice, reorder, and delete options within a group
- [ ] Group deletion warns that all options will be removed
- [ ] Single-option deletion supports 5-second undo via snackbar
- [ ] Min/max validation prevents saving an invalid configuration
