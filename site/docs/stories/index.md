# Epics & User Stories

**Contactless Order System** · Sprint Backlog · v1.0

---

## Epic Overview

| ID | Epic | Status |
|----|------|--------|
| E1 | Infrastructure & CI/CD | ✅ Done |
| E2 | Authentication & Multi-Tenancy | 🔲 Planned |
| E3 | Menu Management | 🔲 Planned |
| E4 | Table & QR Code Management | 🔲 Planned |
| E5 | Guest Ordering Flow | 🔲 Planned |
| E6 | Real-Time Order Tracking | 🔲 Planned |
| E7 | Thermal Print System | 🔲 Planned |
| E8 | Staff Dashboard | 🔲 Planned |
| E9 | Owner Dashboard & Reporting | 🔲 Planned |
| E10 | Platform Admin Panel | 🔲 Planned |

---

## E1 — Infrastructure & CI/CD

**As a** developer, **I want** a reliable automated pipeline **so that** code changes deploy safely to dev and prod.

| Story | Acceptance Criteria | Status |
|-------|---------------------|--------|
| Set up GitHub repo and branch strategy | `main` → prod, `dev` → dev; branch protection rules active | ✅ Done |
| VitePress docs site deployed to GitHub Pages | Site live at GitHub Pages URL; auto-deploys on push to main | ✅ Done |
| Civo Dev VM provisioned with Docker | VM running, `vm-setup.sh` idempotent, Docker + Compose installed | 🔲 Planned |
| Civo Prod VM provisioned with blue-green | Both stacks (blue/green) startable; Nginx upstream switch works | 🔲 Planned |
| GitHub Actions: deploy-dev workflow | Push to `dev` → SSH deploy → app accessible on dev VM | 🔲 Planned |
| GitHub Actions: deploy-prod workflow | Push to `main` → blue-green deploy → zero-downtime confirmed | 🔲 Planned |

---

## E2 — Authentication & Multi-Tenancy

**As a** restaurant owner / staff member, **I want** secure role-based authentication **so that** only authorised users access the right data.

| Story | Acceptance Criteria |
|-------|---------------------|
| Owner signs up via Google OAuth | Supabase social login; account created with status "Pending Approval"; cannot access platform until approved |
| PlatformAdmin approves owner account | Admin approves after fee payment confirmation; owner status changes to "Active" |
| Staff can log in with PIN | PIN validated against bcrypt hash; scoped JWT issued; expires in 8h |
| Guest session created on QR scan | Anonymous session scoped to `restaurant_id` + `table_id`; no PII stored |
| Tenant data isolation enforced | Owner A cannot read Restaurant B's data — verified by integration test |
| Platform admin account creation | Seeded admin can log in; can create restaurant tenants |

---

## E3 — Menu Management

**As a** restaurant owner, **I want** to manage my digital menu **so that** guests always see accurate, up-to-date offerings.

| Story | Acceptance Criteria |
|-------|---------------------|
| Create / edit / archive menu category | Category appears in menu; archived category hidden from guests |
| Create / edit / archive menu item | Item shows name, description, price, optional photo |
| Toggle item availability in real time | Owner sets unavailable → item greys out for guests within 5s |
| Upload item photo | Photo stored in Supabase Storage; served via CDN URL |
| Reorder categories and items | Drag-and-drop reorder; persisted; reflected in guest menu |

---

## E4 — Table & QR Code Management

**As a** restaurant owner, **I want** to manage tables and QR codes **so that** guests can always reach the correct session.

| Story | Acceptance Criteria |
|-------|---------------------|
| Add / rename / deactivate tables | Table list reflects changes immediately |
| Generate QR code for a table | QR encodes signed URL; scanning opens correct restaurant + table |
| Download QR code as PNG | File downloads with table name in filename |
| Regenerate QR code (invalidate old) | Old QR link redirects to "invalid" page; new code works |

---

## E5 — Guest Ordering Flow

**As a** guest, **I want** to browse the menu and place an order from my phone **so that** I don't need to wait for a waiter.

| Story | Acceptance Criteria |
|-------|---------------------|
| Guest scans QR and sees menu | Page loads < 2s on 4G; no install prompt; menu renders correctly |
| Guest browses categories and items | Categories shown; item detail (name, description, price, photo) visible |
| Guest adds items to cart | Cart updates; badge shows item count |
| Guest adds note to item | Free-text note saved with order line |
| Guest reviews and confirms order | Summary shown; order submitted on confirm; confirmation screen with order # |
| Guest places additional order in same session | Subsequent orders linked to same table session |
| Unavailable items shown but unorderable | Greyed out; "Unavailable" label; add-to-cart button disabled |

---

## E6 — Real-Time Order Tracking

**As a** guest and kitchen staff, **I want** order status to update automatically **so that** no one needs to ask or refresh.

| Story | Acceptance Criteria |
|-------|---------------------|
| Order arrives in kitchen instantly | SignalR pushes `OrderReceived` event < 1s after guest confirms |
| Kitchen updates status to "Preparing" | Guest sees status update without page refresh |
| Kitchen marks order "Ready" | Guest sees "Ready" indicator; staff notified |
| Connection drop recovery | SignalR reconnects automatically; missed events reconciled via REST fallback |

---

## E7 — Thermal Print System

**As a** kitchen or bar staff member, **I want** orders to print automatically on my thermal printer **so that** I can prepare items without needing to watch a screen.

| Story | Acceptance Criteria |
|-------|---------------------|
| Menu items tagged as food or drink | Owner sets `item_type` (food/drink) per menu item; required field |
| Food items auto-print to kitchen printer | On order submit, food items routed to kitchen thermal printer; ticket shows table #, order #, items, quantities, notes |
| Drink items auto-print to bar printer | On order submit, drink items routed to bar thermal printer; same ticket format |
| Mixed orders print to both printers | An order with both food and drink triggers both printers independently |
| Print client agent setup | Agent installed on restaurant local PC; authenticates to SignalR hub using restaurant credentials |
| Staff alerted on print failure | If printer is offline, Staff Dashboard shows a banner alert with the affected order details |

---

## E8 — Staff Dashboard

**As a** waiter, **I want** to see all table statuses and orders **so that** I can manage service efficiently.

| Story | Acceptance Criteria |
|-------|---------------------|
| Staff logs in with PIN | PIN validated; staff scoped to their restaurant |
| Floor view shows all tables | Each table shows: free / occupied / has-ready-order |
| Staff can view orders per table | Full order list for a table; item status visible |
| Staff closes table after guest payment | After guest pays at the counter, staff closes session; table status returns to "free" |
| Staff can cancel an order | Order status set to "Cancelled"; guest notified via SignalR |

---

## E9 — Owner Dashboard & Reporting

**As a** restaurant owner, **I want** a management dashboard **so that** I can run my restaurant and track performance.

| Story | Acceptance Criteria |
|-------|---------------------|
| Owner sees today's order summary | Count of orders, total revenue, avg order value shown |
| Owner filters order history | Filter by date range, table, status |
| Owner manages staff PINs | Can create, update, deactivate staff accounts |
| Owner edits restaurant profile | Name, logo, address, opening hours saved and reflected publicly |

---

## E10 — Platform Admin Panel

**As a** platform administrator, **I want** to manage restaurant tenants **so that** I can onboard and support clients.

| Story | Acceptance Criteria |
|-------|---------------------|
| Admin creates restaurant tenant | Restaurant record created; owner account email invitation sent |
| Admin views all tenants | Table shows restaurant name, owner email, status (pending/active/suspended), order count |
| Admin reviews pending registrations | List of owners with "Pending Approval" status; Google account info shown; approve/reject actions available |
| Admin approves restaurant owner | Owner status set to "Active"; owner receives notification and can access dashboard |
| Admin suspends / reactivates restaurant | Suspended restaurant shows maintenance page to guests |

---

*Stories continuously updated as sprints progress. Last updated: March 2026.*
