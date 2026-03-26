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
      │ Vue 3 + Vuetify    │    │  Nginx (TLS) · .NET 10 · SignalR   │
      └────────────────────┘    └────────┬───────────────────────────┘
                                          │
                              ┌───────────▼────────────────────────┐
                              │           SUPABASE                  │
                              │  PostgreSQL · GoTrue Auth · S3      │
                              └────────────────────────────────────┘
┌───────────────────────────────────────────────────────────┐
│            CLOUDPRNT PRINTERS (polling)                    │
│  Kitchen mC-Print3 ──► polls GET /api/print/poll           │
│  Bar mC-Print3     ──► polls GET /api/print/poll           │
│  (each printer polls backend every 2–3 s via CloudPRNT)    │
└───────────────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### Frontend

| App | Users | Stack |
|-----|-------|-------|
| Unified SPA | All roles (Guest, Staff, Owner, Admin) | Vue 3 + Vuetify, role-based routing |
| PWA Support | Guest (primary) | Service Worker (asset caching, offline fallback) + Web App Manifest; installable on iOS Safari 15+ and Android Chrome 100+ |

The single Vuetify SPA is deployed on **Vercel**. It renders different views based on user role: guests access it anonymously via QR scan, while staff, owners, and admins authenticate before reaching their respective dashboards.

### Backend API (.NET 10 — Clean Architecture)

Structured following [Jason Taylor's Clean Architecture template](https://github.com/jasontaylordev/CleanArchitecture):

| Layer | Responsibilities |
|-------|------------------|
| **Domain** | Entities (`Order`, `MenuItem`, `Restaurant`, `Table`), Domain Events |
| **Application** | CQRS Commands/Queries (Wolverine), Interfaces, DTOs, FluentValidation, durable PostgreSQL outbox |
| **Infrastructure** | EF Core + Npgsql, SignalR hub implementation, CloudPRNT polling controller |
| **Api** | ASP.NET Core Web API — controllers or minimal endpoints; JWT middleware |

- JWT validation on all protected routes (Supabase-issued tokens)
- PIN-based staff auth returns a scoped short-lived JWT
- Multi-tenancy enforced: every query includes `restaurant_id` scope
- **ORM**: EF Core 10 with Npgsql provider; migrations in `Infrastructure/Persistence/Migrations/`

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
  api:    # .NET 10 API + SignalR Hub (co-hosted)
  # Frontend is deployed to Vercel — not part of this Docker Compose
```

### Development Environment (.NET Aspire)

.NET Aspire is used **for local development only** — not deployed to production.

| Component | Role |
|-----------|------|
| **AppHost** project | Orchestrates API project + local Supabase container stack |
| **ServiceDefaults** project | OpenTelemetry traces/metrics, health checks, service discovery |
| Supabase local container | Full self-hosted Supabase stack (PostgreSQL + GoTrue Auth + Storage) |

```csharp
// AppHost Program.cs (dev only)
var supabase = builder.AddContainer("supabase", "supabase/postgres");
var api = builder.AddProject<Projects.Api>("api")
                 .WithReference(supabase);
```

> Production uses Docker Compose blue-green (unchanged). Aspire is not present in production images.

---

## Thermal Print Architecture

When an order is confirmed, the backend creates print jobs — persisted via Wolverine's durable PostgreSQL outbox — for each printer station:
- Food items → kitchen print job queued for kitchen device token
- Drink items → bar print job queued for bar device token

### CloudPRNT Polling Architecture (Star mC-Print3)

Each **Star mC-Print3** printer connects directly to the internet and polls the backend via the **Star CloudPRNT** protocol. No local software or agents are required.

```
Star mC-Print3 (kitchen) ──► polls GET /api/print/poll?deviceToken=<kitchen-token>
Star mC-Print3 (bar)     ──► polls GET /api/print/poll?deviceToken=<bar-token>
                                        │
                               .NET 10 API (Civo VM)
                               Wolverine outbox (PostgreSQL)
```

The CloudPRNT flow:

1. **Printer polls** `GET /api/print/poll?deviceToken=<token>` every 2–3 seconds
2. Backend responds with `{"jobReady": true, ...}` when a print job is queued
3. **Printer fetches content** `GET /api/print/content/{jobToken}` — backend returns Base64-encoded Star ESC/POS commands
4. **Printer confirms** `POST /api/print/status/{jobId}` after printing

| Concern | Approach |
|---------|----------|
| Printer model | Star Micronics mC-Print3 (CloudPRNT-enabled, ~€400–600/unit) |
| Print protocol | Star CloudPRNT over HTTPS — printer initiates and polls backend |
| Routing | Two device tokens per restaurant: one kitchen, one bar — registered by owner in Owner Dashboard |
| Authentication | Per-printer `deviceToken` validated on every poll request |
| Local installation | None — printer connects via Ethernet/Wi-Fi directly to the internet |
| Print format | Star ESC/POS commands, Base64-encoded in CloudPRNT content response |
| Failure durability | Wolverine PostgreSQL outbox ensures jobs survive API restarts |
| Failure alerting | Unconsumed job after timeout fires `PrintFailed` event → Staff Dashboard alert |
| Ticket content | Table #, Order #, items + quantities + notes, timestamp |

---

## Security Architecture

| Control | Implementation |
|---------|----------------|
| Transport encryption | TLS 1.2+ via Nginx |
| Auth tokens | Supabase JWT (RS256, 1h expiry) |
| Multi-tenant isolation | Supabase RLS policies per `restaurant_id` |
| QR token safety | HMAC-signed restaurant-level token — no PII embedded; table number entered by guest at checkout |
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
