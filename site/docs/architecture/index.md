# System Architecture

**Contactless Order System** · Architecture Reference · v1.0

---

## Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        GUEST DEVICE                         │
│          Browser (no install) — scans QR code               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                     NGINX (reverse proxy)                    │
│           TLS termination · static asset cache              │
└──────┬────────────────────────────────────────┬─────────────┘
       │ /api/*                                  │ /hub/*
┌──────▼──────────────┐              ┌──────────▼──────────────┐
│   .NET 8 REST API   │              │  ASP.NET Core SignalR   │
│   (Minimal API)     │              │  WebSocket Hub          │
└──────┬──────────────┘              └──────────┬──────────────┘
       │                                         │
┌──────▼─────────────────────────────────────────▼─────────────┐
│                        SUPABASE                               │
│   PostgreSQL (RLS) · GoTrue Auth · File Storage               │
└───────────────────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### Frontend

| App | Users | Stack |
|-----|-------|-------|
| Guest Menu | Diners (anonymous) | Vue 3 + Vite, mobile-first |
| Staff Dashboard | Waiters (PIN auth) | Vue 3 + Vite |
| Owner Dashboard | Restaurant managers | Vue 3 + Vite |
| Admin Panel | Platform operators | Vue 3 + Vite |

All four apps are built as separate Vite SPA bundles and served by Nginx.

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
  api:    # .NET 8 API
  web:    # Vue 3 frontend (Nginx static)
  hub:    # SignalR hub (or co-hosted with api)
```

---

## Security Architecture

| Control | Implementation |
|---------|----------------|
| Transport encryption | TLS 1.2+ via Nginx |
| Auth tokens | Supabase JWT (RS256, 1h expiry) |
| Multi-tenant isolation | Supabase RLS policies per `restaurant_id` |
| QR token safety | HMAC-signed table token — no PII embedded |
| Staff PIN storage | bcrypt-hashed, never stored in plaintext |
| CORS | API restricted to known frontend origins |
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
