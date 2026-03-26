# UX Spec: Owner – Menu Manager

**Route:** `/owner/menu` · **Role:** Owner (authenticated via Google OAuth) · **Epic:** E3

---

## 1. Overview

The primary content-management screen for restaurant owners. Allows full CRUD on menu categories and items, drag-to-reorder, availability toggling, and image upload. Changes propagate to guests in real time via SignalR `MenuItemAvailabilityChanged`.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-app-bar` | "Menu Manager" title + "Add Category" FAB |
| `v-expansion-panels` | One panel per category (name, reorder handle) |
| `v-expansion-panel-title` | Category name + item count chip + edit/delete icons |
| `v-expansion-panel-text` | Sortable list of items within the category |
| `v-list-item` | Item row: image thumb, name, price, availability switch |
| `v-switch` | Toggle item availability (fires `MenuItemAvailabilityChanged`) |
| `v-btn icon` | Edit item (opens dialog), Delete item (confirm) |
| `v-dialog` | Add/edit category form + add/edit item form |
| `v-text-field` | Name, description, price inputs |
| `v-file-input` | Image upload (JPEG/PNG, max 2 MB) |
| `v-img` | Item thumbnail preview |
| `v-snackbar` | "Changes saved" / "Error saving" feedback |
| `v-skeleton-loader` | While initial menu data loads |
| `v-empty-state` | "No menu items yet — add your first category" |

---

## 3. Layout

```
┌────────────────────────────────────────┐
│  Menu Manager               [+ Category] │  ← v-app-bar
├────────────────────────────────────────┤
│                                        │
│  ▾ Drinks  (3 items)  [Edit] [Delete]  │  ← expansion panel
│    ⠿  [img] Espresso      £2.50  ●——  │
│    ⠿  [img] Latte         £3.00  ●——  │
│    ⠿  [img] Cold Brew     £3.50  ○——  │  ← availability off
│                            [+ Add Item] │
│                                        │
│  ▾ Food    (2 items)  [Edit] [Delete]  │
│    ⠿  [img] Croissant     £2.80  ●——  │
│    ⠿  [img] Club Sandwich £7.50  ●——  │
│                            [+ Add Item] │
│                                        │
└────────────────────────────────────────┘
```

`⠿` = drag handle for reorder within category.

---

## 4. UI States

### 4.1 Loading
- `v-skeleton-loader` type `list-item-avatar-three-line` repeated 4×

### 4.2 Populated
- Categories expand/collapse independently
- Availability switch updates optimistically, then syncs

### 4.3 Empty
- `v-empty-state` with illustration + "Add Category" button

### 4.4 Category Form Dialog (Add / Edit)
- Single `v-text-field` — Category name (required)
- Save / Cancel buttons

### 4.5 Item Form Dialog (Add / Edit)
```
Name         [__________________]  (required)
Description  [__________________]  (optional)
Price        [__________________]  (required, ≥ 0)
Image        [Choose file]  [preview]
Category     (pre-filled, read-only in edit mode)
             [Save]  [Cancel]
```

### 4.6 Delete Confirmation
- `v-dialog` — "Delete 'Cold Brew'? This cannot be undone."
- Confirm (destructive) / Cancel

---

## 5. Interactions

| Action | Result |
|--------|--------|
| Page load | `GET /api/menu/{restaurantId}` → categories + items |
| Add Category | POST dialog → `POST /api/menu/{restaurantId}/categories` |
| Edit Category | Edit dialog → `PATCH /api/menu/{restaurantId}/categories/{id}` |
| Delete Category | Confirm dialog → `DELETE /api/menu/{restaurantId}/categories/{id}` |
| Add Item | POST dialog → `POST /api/menu/{restaurantId}/items` |
| Edit Item | Edit dialog → `PATCH /api/menu/{restaurantId}/items/{id}` |
| Delete Item | Confirm dialog → `DELETE /api/menu/{restaurantId}/items/{id}` |
| Toggle availability | `PATCH /api/menu/{restaurantId}/items/{id}` `{ available: bool }` → SignalR broadcast |
| Drag-reorder item | `PATCH /api/menu/{restaurantId}/items/{id}` `{ sortOrder: int }` |
| Drag-reorder category | `PATCH /api/menu/{restaurantId}/categories/{id}` `{ sortOrder: int }` |

---

## 6. API

```typescript
GET    /api/menu/{restaurantId}
Response: { categories: [{ id, name, sortOrder, items: [{ id, name, description, price, imageUrl, available, sortOrder }] }] }

POST   /api/menu/{restaurantId}/categories        Body: { name, sortOrder }
PATCH  /api/menu/{restaurantId}/categories/{id}   Body: Partial<Category>
DELETE /api/menu/{restaurantId}/categories/{id}   → 204

POST   /api/menu/{restaurantId}/items             Body: { categoryId, name, description, price, imageUrl?, available }
PATCH  /api/menu/{restaurantId}/items/{id}        Body: Partial<Item>
DELETE /api/menu/{restaurantId}/items/{id}        → 204
```

Image upload: `POST /api/menu/{restaurantId}/items/{id}/image` (multipart/form-data) → `{ imageUrl }`.

---

## 7. Acceptance Criteria

From **E3 — Menu Management**:

- [ ] Owner can add, edit, and delete categories with immediate UI feedback
- [ ] Owner can add, edit, and delete items within any category
- [ ] Availability toggle broadcasts `MenuItemAvailabilityChanged` to connected guests
- [ ] Items and categories can be reordered by drag-and-drop
- [ ] Image upload accepts JPEG/PNG ≤ 2 MB; preview shown before save
- [ ] Unsaved changes prompt a confirmation before navigating away
