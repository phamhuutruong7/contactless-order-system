# Architecture: Authentication Flow

**Type:** Sequence Diagrams · **Scope:** All four authentication paths

---

## 1. Path Overview

| Actor | Method | Token |
|-------|--------|-------|
| Guest | Anonymous — no credentials | JWT (anonymous, 24 hr) |
| Staff | 4-digit PIN → bcrypt verify | JWT (8 hr) |
| Owner | Google OAuth 2.0 (OIDC) | JWT (session-based) |
| Admin | Seeded email + password | JWT (8 hr) |

---

## 2. Guest Anonymous Auth

```mermaid
sequenceDiagram
  participant G as Guest (Browser)
  participant API as API
  participant DB as Supabase

  G->>G: Scans QR → opens /table/{restaurantId}/{qrToken}
  G->>API: POST /api/auth/anonymous { restaurantId, qrToken }
  API->>DB: SELECT tables WHERE qr_token = qrToken
  DB-->>API: { tableId, restaurantId }
  API->>API: Sign anonymous JWT { sub: uuid(), role: 'guest', tableId, restaurantId, exp: 24hr }
  API-->>G: 200 { token }
  G->>G: Store token in localStorage
  Note over G: All subsequent requests include Authorization: Bearer <token>
```

---

## 3. Staff PIN Auth

```mermaid
sequenceDiagram
  participant S as Staff (Browser)
  participant API as API
  participant DB as Supabase

  S->>API: POST /api/auth/staff { restaurantId, pin }
  API->>DB: SELECT staff WHERE restaurant_id = X AND is_active = true
  DB-->>API: [ { id, pin_hash, failed_pin_attempts, locked_until } ]
  
  alt Account locked
    API->>API: locked_until > now()
    API-->>S: 423 { error: 'Account locked', unlocksAt }
  else PIN correct
    API->>API: bcrypt.verify(pin, pin_hash) → true
    API->>DB: UPDATE staff SET failed_pin_attempts = 0
    API->>API: Sign JWT { sub: staffId, role: 'staff', restaurantId, exp: 8hr }
    API-->>S: 200 { token, staffName }
  else PIN wrong
    API->>API: bcrypt.verify(pin, pin_hash) → false
    API->>DB: UPDATE staff SET failed_pin_attempts += 1
    alt 3rd consecutive failure
      API->>DB: UPDATE staff SET locked_until = now() + 15min
      API-->>S: 423 { error: 'Account locked', unlocksAt }
    else
      API-->>S: 401 { error: 'Invalid PIN', remainingAttempts }
    end
  end
```

---

## 4. Owner Google OAuth

```mermaid
sequenceDiagram
  participant O as Owner (Browser)
  participant API as API
  participant G as Google OAuth 2.0
  participant DB as Supabase GoTrue

  O->>API: GET /api/auth/owner/google/login
  API-->>O: 302 → Google consent screen URL
  O->>G: User grants permission
  G->>API: GET /api/auth/owner/google/callback?code=...
  API->>G: POST token exchange (code → id_token + access_token)
  G-->>API: { id_token: { email, sub, name } }
  API->>DB: UPSERT users WHERE email = X
  DB-->>API: { userId, restaurantId? }
  alt No restaurant yet
    API-->>O: 200 { token, onboardingRequired: true }
  else Existing owner
    API->>API: Sign JWT { sub: userId, role: 'owner', restaurantId, exp: session }
    API-->>O: 200 { token, restaurantId }
  end
  O->>O: Store token; redirect to /owner/dashboard
```

---

## 5. Admin Auth

```mermaid
sequenceDiagram
  participant A as Admin (Browser)
  participant API as API
  participant DB as Supabase

  A->>API: POST /api/auth/admin { email, password }
  API->>DB: SELECT users WHERE email = X AND role = 'admin'
  DB-->>API: { id, password_hash }
  API->>API: bcrypt.verify(password, password_hash) → true/false
  alt Valid
    API->>API: Sign JWT { sub: adminId, role: 'admin', exp: 8hr }
    API-->>A: 200 { token }
  else Invalid
    API-->>A: 401 { error: 'Invalid credentials' }
  end
```

---

## 6. JWT Authorization Summary

All protected API endpoints examine the JWT `role` claim:

| Role claim | Accessible paths |
|------------|-----------------|
| `guest` | `GET /api/menus/*`, `POST /api/orders`, `GET /api/orders/{id}` |
| `staff` | All guest paths + `PATCH /api/orders/{id}/status`, `GET /api/tables` |
| `owner` | All staff paths + `/api/restaurants/{id}/*`, `/api/print/*` |
| `admin` | `/api/admin/*` only |

Staff and owner claims also include `restaurantId`; all data queries are scoped to that restaurant.
