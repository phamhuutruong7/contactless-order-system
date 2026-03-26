# Architecture: Data Model

**Type:** ER Diagram · **Scope:** Supabase PostgreSQL schema

---

## 1. Entity Relationship Diagram

```mermaid
erDiagram
  restaurants {
    uuid id PK
    string name
    string description
    string cuisine_type
    string logo_url
    string owner_id FK
    string status
    timestamp created_at
  }

  users {
    uuid id PK
    string email
    string provider
    timestamp created_at
  }

  staff {
    uuid id PK
    uuid restaurant_id FK
    string name
    string pin_hash
    bool is_active
    int failed_pin_attempts
    timestamp locked_until
    timestamp created_at
  }

  tables {
    uuid id PK
    uuid restaurant_id FK
    string label
    string qr_token
    timestamp qr_generated_at
  }

  menus {
    uuid id PK
    uuid restaurant_id FK
    string name
    bool is_active
    timestamp created_at
  }

  categories {
    uuid id PK
    uuid menu_id FK
    string name
    int sort_order
  }

  items {
    uuid id PK
    uuid category_id FK
    string name
    text description
    int price_pence
    string image_url
    bool is_available
    int sort_order
  }

  modifier_groups {
    uuid id PK
    uuid item_id FK
    string name
    bool required
    int min_selections
    int max_selections
  }

  modifiers {
    uuid id PK
    uuid group_id FK
    string name
    int price_pence
    bool is_available
  }

  orders {
    uuid id PK
    uuid restaurant_id FK
    uuid table_id FK
    string status
    int total_pence
    timestamp created_at
    timestamp updated_at
  }

  order_lines {
    uuid id PK
    uuid order_id FK
    uuid item_id FK
    string item_name_snapshot
    int unit_price_snapshot
    int quantity
    text special_instructions
    jsonb modifiers_snapshot
  }

  printers {
    uuid id PK
    uuid restaurant_id FK
    string name
    string device_token
    string cloud_prnt_url
    string status
    timestamp last_seen_at
  }

  restaurants ||--o{ staff : "employs"
  restaurants ||--o{ tables : "has"
  restaurants ||--o{ menus : "has"
  restaurants ||--o{ orders : "receives"
  restaurants ||--o{ printers : "has"
  users ||--o{ restaurants : "owns"
  menus ||--o{ categories : "contains"
  categories ||--o{ items : "lists"
  items ||--o{ modifier_groups : "has"
  modifier_groups ||--o{ modifiers : "contains"
  tables ||--o{ orders : "generates"
  orders ||--o{ order_lines : "contains"
  items ||--o{ order_lines : "referenced by"
```

---

## 2. Key Design Decisions

### 2.1 Snapshot fields on `order_lines`
`item_name_snapshot`, `unit_price_snapshot`, and `modifiers_snapshot` capture the item state at order time. Menu edits after order placement do not retroactively change order records.

### 2.2 Restaurant `status` column
- `pending_approval` — newly registered, not yet approved by admin
- `active` — fully operational
- `suspended` — admin-disabled; all logins blocked
- `rejected` — registration rejected by admin

### 2.3 Staff PIN security
- `pin_hash` — bcrypt hash, never stored in plain text
- `failed_pin_attempts` — counter incremented on each failure
- `locked_until` — 15-minute lockout after 3 consecutive failures

### 2.4 Table QR tokens
- `qr_token` — UUID, changes when "Regenerate QR" is triggered
- Old tokens immediately invalid; outstanding guest sessions are treated as expired

### 2.5 Price storage
All prices stored as integer pence (or whole currency units in VND context). No floating-point arithmetic in the database or API.

---

## 3. Table Summary

| Table | Row estimate | Notes |
|-------|-------------|-------|
| `restaurants` | 1 per tenant | Core tenant entity |
| `users` | 1 per owner | Managed by Supabase GoTrue |
| `staff` | ~5–30 per restaurant | PIN-auth, not in GoTrue |
| `tables` | ~5–50 per restaurant | QR-linked |
| `menus` | 1–3 per restaurant | Typically 1 active |
| `categories` | ~3–15 per menu | |
| `items` | ~10–100 per category | Image in cloud storage |
| `modifier_groups` | 0–10 per item | |
| `modifiers` | 2–10 per group | |
| `orders` | High volume | Partitioned by date recommended |
| `order_lines` | ~3–10 per order | Append-only |
| `printers` | 1–5 per restaurant | CloudPRNT devices |
