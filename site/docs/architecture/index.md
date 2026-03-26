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

### Backend API (.NET 10 — Clean Architecture)

Structured following [Jason Taylor's Clean Architecture template](https://github.com/jasontaylordev/CleanArchitecture):

| Layer | Responsibilities |
|-------|------------------|
| **Domain** | Entities (`Order`, `MenuItem`, `Restaurant`, `Table`), Domain Events |
| **Application** | CQRS Commands/Queries (MediatR), Interfaces, DTOs, FluentValidation |
| **Infrastructure** | EF Core + Npgsql, SignalR hub implementation, ePOS-Print HTTP adapter |
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

When an order is confirmed, the backend splits items by `item_type` and dispatches SignalR events to restaurant-scoped groups:
- Food items → `KitchenPrintEvent` → group `restaurant-{restaurantId}-kitchen`
- Drink items → `BarPrintEvent` → group `restaurant-{restaurantId}-bar`

### Print Client Agent (.NET 10 Worker Service)

One **Print Client Agent** per restaurant runs on-premises. It subscribes to **both** SignalR groups and routes internally based on event type.

```
SignalR Hub (Civo VM)
  └─► Print Client Agent (restaurant local PC — .NET 10 Worker Service .exe)
        ├── Epson TM-T82III — Kitchen Printer (HTTP POST via ePOS-Print XML)
        └── Epson TM-T82III — Bar Printer     (HTTP POST via ePOS-Print XML)
```

Print is sent via **ePOS-Print XML** over HTTP to each printer's local IP:

```
POST http://{printerIp}/cgi-bin/epos/service.cgi
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://www.epson-pos.com/schemas/2011/03/epos-print"
```

Agent configuration (`appsettings.json`):

```json
{
  "PrintAgent": {
    "BackendUrl": "https://api.example.com",
    "RestaurantId": "<uuid>",
    "DeviceToken": "<owner-generated-token>",
    "KitchenPrinterIp": "192.168.1.101",
    "BarPrinterIp": "192.168.1.102"
  }
}
```

| Concern | Approach |
|---------|----------|
| Printer model | Epson TM-T82III |
| Print protocol | ePOS-Print XML over HTTP (Epson proprietary) |
| Routing | Single agent per restaurant; routes by event type to correct printer IP |
| Authentication | `DeviceToken` in SignalR connection header, generated by owner in Owner Dashboard |
| Failure handling | Fire-and-forget — failed print fires `PrintFailed` event → Staff Dashboard alert |
| IP configuration | Static IPs in `appsettings.json` (local config, not stored in backend) |
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
