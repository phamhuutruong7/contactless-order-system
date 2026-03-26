# UX Spec: Staff Login

**Route:** `/staff/login` · **Role:** Staff · **Epic:** E2

---

## 1. Overview

Staff authenticate with a 4-digit PIN. There is no username or email field — identity is derived from the PIN itself scoped to the restaurant. On success the user is issued a short-lived JWT and redirected to the floor view. Three consecutive failures lock the PIN for 15 minutes.

---

## 2. Component Inventory

| Component | Purpose |
|-----------|---------|
| `v-container` | Centred card layout, vertical middle on desktop |
| `v-card` | Login card with restaurant logo header |
| `v-img` | Restaurant logo |
| `v-otp-input` (4-digit) | Custom PIN pad or Vuetify `v-otp-input`; each digit masked immediately |
| `v-btn` (numpad 0–9) | On-screen digit buttons (touch-friendly, 56×56 dp) |
| `v-btn` (backspace) | Delete last digit |
| `v-progress-linear` | Indeterminate bar shown while authenticating |
| `v-alert type="error"` | Wrong PIN / account locked messages |
| `v-chip` | "Attempts remaining: N" warning after first failure |

---

## 3. Layout

```
┌─────────────────────────────┐
│                             │
│       [Restaurant Logo]     │
│       Restaurant Name       │
│                             │
│    ● ● ○ ○   ← PIN dots     │
│                             │
│   [ 1 ] [ 2 ] [ 3 ]         │
│   [ 4 ] [ 5 ] [ 6 ]         │
│   [ 7 ] [ 8 ] [ 9 ]         │
│   [    0    ] [ ⌫ ]          │
│                             │
│  [⚠ 2 attempts remaining]   │  ← chip (conditional)
│  [✗ Incorrect PIN]          │  ← alert (conditional)
└─────────────────────────────┘
```

---

## 4. UI States

### 4.1 Idle
- Empty PIN dots, numpad enabled

### 4.2 Entry in Progress
- Dots fill sequentially as digits typed
- Auto-submit when 4th digit entered (no confirm button)

### 4.3 Authenticating
- `v-progress-linear` appears; numpad disabled

### 4.4 Error (1–2 failures)
- Dots shake (CSS keyframe)
- `v-alert type="error"` — "Incorrect PIN"
- `v-chip` — "Attempts remaining: N"
- Reset to empty after 800 ms

### 4.5 Locked
- `v-alert type="error"` — "Account locked for 15 minutes"
- Numpad fully disabled
- Countdown timer displayed

### 4.6 Success
- Brief green flash → redirect to `/staff/floor`

---

## 5. Interactions

| Action | Behaviour |
|--------|-----------|
| Tap digit | Appends digit, fills next dot |
| Fill 4th digit | Auto-submit `POST /api/auth/staff/login` |
| Tap backspace | Removes last digit |
| `POST` 401 | Shake animation + error alert + increment failure count |
| 3rd failure | Lock alert + disable numpad + start countdown |
| `POST` 200 | Store JWT in `sessionStorage` → navigate to floor |

---

## 6. API

```typescript
POST /api/auth/staff/login
Body:   { restaurantId: string, pin: string }
200:    { token: string, staffId: string, name: string }
401:    { error: 'invalid_pin', attemptsRemaining: number }
423:    { error: 'account_locked', retryAfterSeconds: number }
```

---

## 7. Security Notes

- PIN is hashed with bcrypt server-side (never stored in plaintext)
- JWT expires after 8 hours (shift length)
- `restaurantId` scope prevents PINs leaking across tenants
- No PIN autocomplete (`autocomplete="off"` on all inputs)

---

## 8. Acceptance Criteria

From **E2 — Staff Operations**:

- [ ] Staff can log in with a 4-digit PIN in under 5 seconds
- [ ] Incorrect PIN produces immediate shake feedback
- [ ] Three consecutive failures lock the account for 15 minutes
- [ ] PIN input works on physical POS tablets with touch and hardware keyboard
- [ ] JWT is stored per-session (cleared on tab close)
