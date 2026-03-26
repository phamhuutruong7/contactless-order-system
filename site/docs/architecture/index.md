# System Architecture

**Contactless Order System** · Architecture Reference · v1.0

---

## Component Overview

```
┌───────────────────────────────────────────────────────────┐
│                     GUEST DEVICE                          │
│       Browser (no install) — scans QR code               │
└──────────────┬────────────────────────┬───────────────────┘
               │ SPA assets             │ API / WebSocket
      ┌────────▼──────────┐    ┌────────▼──────────────────────────┐
      │    VERCEL CDN      │    │       CIVO COMPUTE VM              │
      │ Vue 3 + Vuetify    │    │  Nginx (TLS) · .NET 8 · SignalR    │
      └────────────────────┘    └────────┬───────────────────────────┘
                                          │
                              ┌───────────▼────────────────────────┐
                              │           SUPABASE                  │
                              │  PostgreSQL · GoTrue Auth · S3      │
                              └────────────────────────────────────┘
┌───────────────────────────────────────────────────────────┐
│            RESTAURANT LOCAL NETWORK                        │
│  Print Client ──► Kitchen Thermal Printer  (food items)   │
│             └───► Bar Thermal Printer      (drink items)   │
│  (SignalR subscriber — receives print events from backend) │
└───────────────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### Frontend

| App | Users | Stack |
|-----|-------|-------|
| Unified SPA | All roles (Guest, Staff, Owner, Admin) | Vue 3 + Vuetify, role-based routing |

The single Vuetify SPA is deployed on **Vercel**. It renders different views based on user role: guests access it anonymously via QR scan, while staff, owners, and admins authenticate before reaching their respective dashboards.

### Backend API (.NET 8)

- **Minimal API** endpoints grouped by domain: `auth`, `restaurants`, `menus`, `tables`, `orders`
- JWT validation on all protected routes (Supabase-issued tokens)
- PIN-based staff auth returns a scoped short-lived JWT
- Multi-tenancy enforced: every query includes `restaurant_id` scope
- No ORM — raw SQL via Npgsql or Dapper for performance transparency

### Real-Time (SignalR)

- Hub: `OrderHub`
- Groups: per-restaurant, per-table, per-kitchen
- Events pushed:
  - `OrderReceived` → kitchen group
  - `OrderStatusChanged` → table group (guest sees update)
  - `TableSessionClosed` → table group
- Fallback: long-polling for environments where WebSocket is blocked

### Data Layer (Supabase)

- **PostgreSQL** with Row-Level Security (RLS) policies per tenant
- **Auth**: GoTrue — handles JWTs, refresh tokens, email verification
- **Storage**: S3-compatible bucket for menu item photos
- Migrations tracked in `supabase/migrations/`

---

## Infrastructure

### Environments

| Environment | Host | Deployment |
|-------------|------|------------|
| Dev | Civo Compute VM (1 vCPU / 2 GB) | Push to `dev` branch → GitHub Actions SSH deploy |
| Prod | Civo Compute VM (2 vCPU / 4 GB) | Push to `main` branch → blue-green switch |

### Blue-Green Deployment (Prod)

```
Nginx upstream
  ├── Blue  (docker-compose.blue.yml  — port 8001)  ← active
  └── Green (docker-compose.green.yml — port 8002)  ← standby
```

1. New image built and pushed to container registry
2. Standby stack pulled and started
3. Health check passes on standby
4. `switch-stack.sh` atomically rewrites Nginx upstream symlink
5. Nginx reloaded — zero downtime
6. Old stack kept warm for 10 minutes then stopped

### Container Layout

```yaml
services:
  api:    # .NET 8 API + SignalR Hub (co-hosted)
  # Frontend is deployed to Vercel — not part of this Docker Compose
```

---

## Thermal Print Architecture

Orders are analysed for item type before being persisted, then a `PrintEvent` is dispatched via SignalR:
- Items tagged **food** → `PrintEvent` to `kitchen` SignalR group
- Items tagged **drink** → `PrintEvent` to `bar` SignalR group

A **Print Client Agent** (lightweight daemon) runs on-premises at each restaurant:

```
SignalR Hub (Civo VM)
  └─► Print Client Agent (restaurant local PC)
        ├── Kitchen Thermal Printer — food items (ESC/POS over USB/LAN)
        └── Bar Thermal Printer    — drink items (ESC/POS over USB/LAN)
```

| Concern | Approach |
|---------|----------|
| Printer protocol | ESC/POS (industry standard thermal printers) |
| Separation | Each printer subscribes to its own SignalR group (`kitchen` vs `bar`) |
| Failure handling | Offline printer triggers `PrintFailed` event → Staff Dashboard alert |
| Ticket content | Table #, Order #, items + quantities + notes, timestamp |

---

## Security Architecture

| Control | Implementation |
|---------|----------------|
| Transport encryption | TLS 1.2+ via Nginx |
| Auth tokens | Supabase JWT (RS256, 1h expiry) |
| Multi-tenant isolation | Supabase RLS policies per `restaurant_id` |
| QR token safety | HMAC-signed table token — no PII embedded |
| Staff PIN storage | bcrypt-hashed, never stored in plaintext |
| CORS | API restricted to Vercel deployment domain and preview URLs |
| Rate limiting | Nginx + ASP.NET Core rate limiter middleware |
| Secrets | Environment variables only — no hardcoded credentials |

---

## CI/CD Pipeline

```
git push origin dev
  └─► GitHub Actions: deploy-dev.yml
        ├── docker build
        ├── docker push (registry)
        └── SSH → Civo Dev VM → docker compose pull && up -d

git push origin main
  └─► GitHub Actions: deploy-prod.yml
        ├── docker build
        ├── docker push (registry)
        └── SSH → Civo Prod VM → switch-stack.sh (blue-green)
```

---

*Architecture maintained by development team. Last updated: March 2026.*
