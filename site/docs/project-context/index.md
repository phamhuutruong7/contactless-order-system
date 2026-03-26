# Project Context

**Contactless Order System** · Generated via BMAD GPC · March 2026

---

## 1. Project Overview

A multi-tenant SaaS platform that lets restaurants offer a fully digital, app-free ordering experience: guests scan a QR code, browse a live menu, and place orders from their own device. Orders flow in real-time to kitchen and bar printers via CloudPRNT, while staff manage tables and owners administer the platform through dedicated dashboards.

---

## 2. Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| UI Framework | **Vue 3** (Composition API + `<script setup>`) |
| Component Library | **Vuetify 3** (Material Design components) |
| State Management | **Pinia** |
| Routing | **Vue Router 4** |
| Real-time | **@microsoft/signalr** (WebSocket client) |
| Build Tool | **Vite** |
| PWA | Service Worker + Web App Manifest (offline fallback, installable) |
| Docs Site | **VitePress** → GitHub Pages |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | **.NET 10** (C# 14) |
| Web Framework | **ASP.NET Core Minimal API** |
| Real-time Hub | **SignalR** (ASP.NET Core) |
| ORM | **Supabase .NET SDK** + raw SQL via Npgsql |
| Auth | **Supabase GoTrue** (Google OAuth + anonymous sessions + bcrypt PIN) |
| Database | **Supabase PostgreSQL** (managed) |
| File Storage | **Supabase Storage** (S3-compatible) |
| Print Jobs | **Star CloudPRNT** — printers poll REST endpoint for ESC/POS payloads |
| Local Dev Orchestration | **.NET Aspire AppHost** (dev-only) |

### Infrastructure
| Concern | Technology |
|---------|-----------|
| Hosting: Frontend CDN | **Vercel** |
| Hosting: Backend | **Civo** Linux VMs (blue/green containers) |
| Container Runtime | **Docker** + Docker Compose |
| Reverse Proxy / TLS | **Nginx** |
| CI/CD | **GitHub Actions** |
| Secret Management | GitHub Actions Secrets + environment variables |
| Branch Strategy | `main` → prod, `dev` → dev; branch protection on `main` |

---

## 3. Repository Structure

```
/
├── .github/
│   └── workflows/
│       ├── deploy-dev.yml         # Push to dev → deploy to Civo Dev VM
│       ├── deploy-prod.yml        # Push to main → blue-green deploy to Civo Prod VM
│       └── docs.yml               # Push to main → build VitePress → GitHub Pages
│
├── src/
│   ├── Api/                       # ASP.NET Core Minimal API + SignalR Hub
│   │   ├── Endpoints/             # Route handlers grouped by domain
│   │   ├── Hubs/                  # OrderHub.cs (SignalR)
│   │   ├── Models/                # Request/Response DTOs
│   │   ├── Services/              # Business logic (OrderService, PrintService, etc.)
│   │   ├── Middleware/            # Auth middleware, tenant resolution
│   │   └── Program.cs
│   │
│   ├── Frontend/                  # Vue 3 + Vuetify SPA
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/        # Shared UI components
│   │   │   ├── composables/       # Vue composables (useCart, useOrder, etc.)
│   │   │   ├── layouts/           # App layouts (GuestLayout, StaffLayout, OwnerLayout)
│   │   │   ├── pages/             # Route-level page components
│   │   │   ├── router/            # Vue Router route definitions
│   │   │   ├── stores/            # Pinia stores
│   │   │   └── main.ts
│   │   ├── public/
│   │   │   ├── manifest.json      # PWA manifest
│   │   │   └── sw.js              # Service Worker
│   │   └── vite.config.ts
│   │
│   └── AppHost/                   # .NET Aspire (dev-only)
│
├── site/                          # VitePress documentation site
│   ├── .vitepress/config.ts
│   └── docs/                      # English documentation pages
│
├── docker-compose.blue.yml        # Blue stack (Civo prod)
├── docker-compose.green.yml       # Green stack (Civo prod)
├── docker-compose.dev.yml         # Dev VM stack
└── nginx.conf                     # Reverse proxy config
```

---

## 4. Architecture Patterns

### 4.1 Multi-Tenancy

Every API request carries a `restaurant_id` claim resolved from the JWT. Supabase Row Level Security (RLS) policies enforce tenant isolation at the database layer — no cross-tenant data leaks possible through the ORM.

```
JWT → Middleware resolves restaurant_id → appended to every DB query
Supabase RLS: auth.jwt() ->> 'restaurant_id' = restaurant_id
```

### 4.2 Authentication Flows

| Role | Method | Token |
|------|--------|-------|
| Guest | Anonymous session created on QR scan | Supabase anon JWT (restaurant-scoped) |
| Staff | 6-digit PIN → bcrypt compare | Supabase JWT (staff role, restaurant-scoped) |
| Owner | Google OAuth via Supabase GoTrue | Supabase OAuth JWT (owner role) |
| PlatformAdmin | Seeded admin account | Supabase JWT (admin role) |

Owner accounts are created with `status = 'pending_approval'`. The `PlatformAdmin` must approve the account — only then is `status` set to `'active'` and the owner can access their dashboard.

### 4.3 Real-Time (SignalR)

```
Guest confirms order
  → POST /api/orders
  → OrderHub.Clients.Group(restaurantId).SendAsync("OrderReceived", order)
  → Kitchen screen + Staff Dashboard + Guest status page all update simultaneously
```

Clients join a SignalR group scoped to their `restaurant_id`. State reconciliation via REST GET on reconnect.

### 4.4 CloudPRNT Print Routing

```
Order submitted with food items AND/OR drink items
  → OrderService.RouteForPrinting(order)
  → Food items → PrintJob(type=kitchen, deviceToken=kitchenToken)
  → Drink items → PrintJob(type=bar, deviceToken=barToken)

Printer polls: GET /api/print/poll?deviceToken=<token>
  → If pending job: 200 { jobId, contentType, content: "<base64 ESC/POS>" }
  → If idle:        204 No Content

Printer confirms: POST /api/print/status/{jobId}  { status: "OK" | "Error" }
  → Timeout (unconfirmed after threshold): alert surfaced to Staff Dashboard via SignalR
```

### 4.5 Order State Machine

```
Pending → Received → Preparing → Ready → Served
                                       ↘ Cancelled (Staff action)
```

State transitions trigger SignalR events that push to all role-appropriate clients (guest session, kitchen screen, staff floor view).

---

## 5. Key API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/guest` | Create anonymous guest session |
| POST | `/auth/pin` | Staff PIN login |
| GET | `/auth/callback` | Google OAuth callback (Supabase handles) |

### Menu (Guest)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/menu/{restaurantId}` | Fetch full menu (categories + items + modifiers) |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/orders` | Guest submits order |
| GET | `/api/orders/{orderId}` | Get order status (guest polling fallback) |
| PUT | `/api/orders/{orderId}/status` | Staff / kitchen update order status |
| DELETE | `/api/orders/{orderId}` | Staff cancel order |

### Staff Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tables` | List tables with status |
| PUT | `/api/tables/{tableId}/close` | Close table session |
| GET | `/api/tables/{tableId}/orders` | Get all orders for a table |

### Owner Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST/PUT/DELETE | `/api/menu/categories` | Category CRUD |
| GET/POST/PUT/DELETE | `/api/menu/items` | Item CRUD |
| PUT | `/api/menu/items/{itemId}/availability` | Toggle availability |
| GET/POST/PUT/DELETE | `/api/menu/items/{itemId}/modifier-groups` | Modifier group CRUD |
| GET/POST/PUT/DELETE | `/api/tables` | Table CRUD |
| GET | `/api/qr/{restaurantId}` | Get QR code PNG |
| POST | `/api/qr/{restaurantId}/regenerate` | Regenerate QR token |
| PUT | `/api/printers/kitchen` | Register/update kitchen printer token |
| PUT | `/api/printers/bar` | Register/update bar printer token |

### Platform Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/tenants` | List all restaurant tenants |
| POST | `/api/admin/tenants` | Create new tenant |
| PUT | `/api/admin/tenants/{id}/status` | Approve / suspend / reactivate |
| GET | `/api/admin/pending` | List pending owner approvals |

### CloudPRNT
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/print/poll` | Printer polling endpoint (query: `deviceToken`) |
| POST | `/api/print/status/{jobId}` | Printer job status callback |

### SignalR
| Hub | Route | Key Events |
|-----|-------|-----------|
| `OrderHub` | `/hubs/orders` | `OrderReceived`, `OrderStatusChanged`, `PrintFailed` |

---

## 6. Database Schema (Key Tables)

| Table | Key Columns |
|-------|-------------|
| `restaurants` | `id`, `name`, `owner_id`, `status` (pending/active/suspended), `kitchen_printer_token`, `bar_printer_token` |
| `menu_categories` | `id`, `restaurant_id`, `name`, `sort_order`, `archived_at` |
| `menu_items` | `id`, `category_id`, `name`, `description`, `price_eur_cents`, `item_type` (food/drink), `is_available`, `photo_url` |
| `modifier_groups` | `id`, `item_id`, `name`, `is_required`, `min_selections`, `max_selections`, `sort_order` |
| `modifiers` | `id`, `group_id`, `name`, `price_delta_eur_cents`, `sort_order` |
| `tables` | `id`, `restaurant_id`, `name`, `is_active` |
| `orders` | `id`, `restaurant_id`, `table_id` (nullable), `order_type` (`table`/`take_away`), `status`, `created_at` |
| `order_lines` | `id`, `order_id`, `item_id`, `quantity`, `note`, `unit_price_eur_cents` |
| `order_line_modifiers` | `id`, `order_line_id`, `modifier_id`, `price_delta_eur_cents` |
| `print_jobs` | `id`, `restaurant_id`, `order_id`, `printer_type` (kitchen/bar), `device_token`, `status`, `created_at`, `confirmed_at` |
| `staff` | `id`, `restaurant_id`, `name`, `pin_hash`, `is_active` |
| `users` | Supabase `auth.users` (owners + PlatformAdmin) |

---

## 7. Local Development

### Prerequisites
- [.NET 10 SDK](https://dot.net)
- [Node.js 22 LTS](https://nodejs.org)
- [Docker Desktop](https://docker.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local Supabase instance, optional)

### Start the Full Dev Stack

```bash
# Backend + local Supabase (via .NET Aspire)
cd src/AppHost
dotnet run

# Frontend (separate terminal)
cd src/Frontend
npm install
npm run dev
```

### Docs Site

```bash
cd site
npm install
npm run dev      # Local preview at http://localhost:5173
npm run build    # Production build
```

### Environment Variables

```env
# Backend (.env or GitHub Secrets)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
SUPABASE_JWT_SECRET=<jwt_secret>
SIGNALR_ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Aspire local dev overrides (when running src/AppHost via dotnet run)
SUPABASE_DB_HOST=localhost
SUPABASE_DB_PORT=54322
SUPABASE_AUTH_PORT=9999
SUPABASE_DB_PASSWORD=postgres

# Frontend (.env.local)
VITE_API_BASE=http://localhost:5000
VITE_SIGNALR_HUB=/hubs/orders
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

---

## 8. Coding Conventions

| Concern | Convention |
|---------|-----------|
| Vue components | PascalCase filenames; Composition API only; `<script setup lang="ts">` |
| Stores (Pinia) | One store per domain (`useCartStore`, `useOrderStore`, `useMenuStore`) |
| Composables | `use` prefix; return reactive refs + functions; no side effects on import |
| API endpoints | Kebab-case routes; versioning via `/api/v1/` prefix in v2 |
| Error Handling | Global Vue error handler → toast notification; API errors return `{ error: string, code: string }` |
| Formatting | Prettier (frontend), `dotnet format` (backend) — run in pre-commit hook |
| Commit Messages | Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` |
| Branch Naming | `feature/E5-guest-ordering`, `fix/E7-print-timeout` |
