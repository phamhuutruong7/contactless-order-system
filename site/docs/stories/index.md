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
| E11 | Staff Work Sessions & Trinkgeld | 🔲 Planned |
| E12 | Restaurant Identity & Subdomains | 🔲 Planned |
| E11 | Staff Work Sessions & Trinkgeld | 🔲 Planned |
| E12 | Restaurant Identity & Subdomains | 🔲 Planned |

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
| Set up .NET Aspire AppHost for local dev | AppHost project references API + local Supabase container; `dotnet run --project AppHost` starts full dev stack; dev-only, not present in production images | 🔲 Planned |
| PWA manifest and Service Worker in place | `/manifest.json` present with name, icons, theme_color; Service Worker caches SPA assets and returns offline fallback; app is installable on iOS Safari 15+ and Android Chrome 100+ | 🔲 Planned |

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
| Create modifier group for a menu item | Group has name, is_required flag, min_selections, max_selections; appears in item editor |
| Add modifiers to a group | Each modifier has a name and optional price_delta_eur_cents; modifier list visible when guest adds item to cart |
| Reorder and delete modifier groups | Changes persisted; reflected immediately in guest menu |

---

## E4 — Table & QR Code Management

**As a** restaurant owner, **I want** to manage tables and QR codes **so that** guests can always reach the correct session.

| Story | Acceptance Criteria |
|-------|---------------------|
| Add / rename / deactivate tables | Table list reflects changes immediately |
| View and download restaurant QR code | Single restaurant QR displayed in Owner Dashboard; downloadable as PNG |
| Regenerate restaurant QR code | Old QR link shows "invalid" message; new code works; owner confirms action before regenerating |
| Guest selects table number at checkout | After scanning QR, guest picks their table number from a dropdown before confirming order; table number is saved with the order |

---

## E5 — Guest Ordering Flow

**As a** guest, **I want** to browse the menu and place an order from my phone **so that** I don't need to wait for a waiter.

| Story | Acceptance Criteria |
|-------|---------------------|
| Guest scans QR and sees menu | Page loads < 2s on 4G; no install prompt; menu renders correctly |
| Guest browses categories and items | Categories shown; item detail (name, description, price, photo) visible |
| Guest adds items to cart | Cart updates; badge shows item count |
| Guest adds note to item | Free-text note saved with order line |
| Guest selects required modifiers before adding to cart | Required modifier groups show validation; add-to-cart button disabled until all required groups have a selection |
| Guest selects optional modifiers | Optional modifier groups shown as selectable add-ons; price delta displayed per option and reflected in total |
| Guest selects table number at checkout | Dropdown lists the restaurant's tables; selection is required before order can be confirmed |
| Guest reviews and confirms order | Summary shown; order submitted on confirm; confirmation screen with order # |
| Multiple guests at the same table order together | Each guest scans the same QR code and browses independently; all their orders are grouped under the same table session automatically — no coordination needed between guests |
| Guest places a take-away order | A take-away session works the same way — guest browses, orders, tracks status; no table assignment needed; the session closes automatically when all items are marked served |
| Table resets cleanly for the next group of guests | After staff closes a table, the QR code immediately starts a fresh session; a new group of guests can scan and begin ordering without any delay |
| Guest places additional order in same session | Subsequent orders linked to same table session |
| Unavailable items shown but unorderable | Greyed out; "Unavailable" label; add-to-cart button disabled |
| Multiple guests at the same table order together | Each guest scans the same QR code and browses independently; all their orders are grouped under the same table session automatically — no coordination needed between guests |
| Guest places a take-away order | A take-away session works the same way — guest browses, orders, tracks status; no table assignment needed; the session closes automatically when all items are marked served |
| Table resets cleanly for the next group of guests | After staff closes a table, the QR code immediately starts a fresh session; a new group of guests can scan and begin ordering without any delay |

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
| Owner registers kitchen printer device token | Owner enters device token for kitchen Star mC-Print3 in Owner Dashboard; token stored and used for CloudPRNT polling authentication |
| Owner registers bar printer device token | Owner enters device token for bar Star mC-Print3 independently; can be updated or rotated without affecting kitchen token |
| Kitchen printer polls and prints | Kitchen mC-Print3 polls `GET /api/print/poll?deviceToken=<token>` every 2–3 s; backend responds with Base64 Star ESC/POS payload when a food job is pending; printer confirms with `POST /api/print/status/{jobId}` |
| Bar printer polls and prints | Bar mC-Print3 polls independently; receives drink jobs via same CloudPRNT protocol |
| Staff alerted on print failure | If a job is not consumed within the timeout threshold, Staff Dashboard shows a banner alert with the affected order details |

---

## E8 — Staff Dashboard

**Staff checks in to start serving | After logging in, staff taps a "Check In" button to mark the start of their active serving period; the system records the exact time |
| Staff checks out temporarily | Staff can tap "Check Out" at any point — for example during a break or handover — without ending their overall working session; the time away is not counted in their sales total |
| Staff checks in again after a break | Staff can check back in as many times as needed within the same working day; each check-in / check-out pair is tracked separately |
| Staff only sees their assigned tables | The floor view shows only the tables assigned to that staff member by the owner; other tables are visible but greyed out and cannot be interacted with |
| Floor view shows table statuses | Each of the staff's assigned tables shows: free / occupied / has-ready-order — updated in real time |
| Staff can view orders per table | Full order list for a table; item status visible |
| Staff closes table after guest payment | After the guests pay, staff taps "Close Table"; the table resets to free and the next guests can start a new session immediately |
| Staff can cancel an order | Order status set to "Cancelled"; guest notified |
| Staff ends their working session | When their shift is done, staff taps "End Session" to finalise their work day; the system calculates the total value of all orders served at their tables during the active check-in windows |
| Staff sees their Trinkgeld summary | After ending the session, staff sees a clear summary: how many tables they served, the total order value, and the amount they need to hand back to the cashier; the rest is their Trinkgeld — [detailed spec →](staff-sessions-spec/)
| Staff logs in with PIN | PIN validated; staff scoped to their restaurant |
| Staff checks in to start serving | After logging in, staff taps a "Check In" button to mark the start of their active serving period; the system records the exact time |
| Staff checks out temporarily | Staff can tap "Check Out" at any point — for example during a break or handover — without ending their overall working session; the time away is not counted in their sales total |
| Staff checks in again after a break | Staff can check back in as many times as needed within the same working day; each check-in / check-out pair is tracked separately |
| Staff only sees their assigned tables | The floor view shows only the tables assigned to that staff member by the owner; other tables are visible but greyed out and cannot be interacted with |
| Floor view shows table statuses | Each of the staff's assigned tables shows: free / occupied / has-ready-order — updated in real time |
| Staff can view orders per table | Full order list for a table; item status visible |
| Staff closes table after guest payment | After the guests pay, staff taps "Close Table"; the table resets to free and the next guests can start a new session immediately |
| Staff can cancel an order | Order status set to "Cancelled"; guest notified |
| Staff ends their working session | When their shift is done, staff taps "End Session" to finalise their work day; the system calculates the total value of all orders served at their tables during the active check-in windows |
| Staff sees their Trinkgeld summary | After ending the session, staff sees a clear summary: how many tables they served, the total order value, and the amount they need to hand back to the cashier; the rest is their Trinkgeld — [detailed spec →](staff-sessions-spec/) |

| Owner assigns tables to each staff member | In the Staff Management section, owner selects which tables belong to which staff member; staff only see and manage their assigned tables during service |
| Owner closes the day | Owner taps "Close Day" to generate the final daily sales report; the report includes all orders served that day (excluding cancellations), the total revenue, and a per-staff sales breakdown |
| Daily report is available for 48 hours | The generated daily report remains accessible for 48 hours; after that it is automatically removed; owner is clearly shown the expiry time when the report is opened |
---

## E9 — Owner Dashboard & Reporting

**As a** restaurant owner, **I want** a management dashboard **so that** I can run my restaurant and track performance.

| Story | Acceptance Criteria |
|-------|---------------------|
| Owner manages staff PINs | Can create, update, deactivate staff accounts |
| Owner edits restaurant profile | Name, logo, address, opening hours saved and reflected publicly |
| Owner views daily sales report | Date picker defaults to today; table shows item name, unit price, qty ordered (excl. cancelled), and subtotal per item; summary card shows grand total Estimated Revenue; "Export PDF" triggers server-side PDF generation (QuestPDF); loading indicator shown on button while generating; browser auto-downloads the PDF when ready; graceful empty state if no orders on selected date; 403 returned for another restaurant's data — [detailed spec →](daily-report-spec.md) |
| Owner assigns tables to each staff member | In the Staff Management section, owner selects which tables belong to which staff member; staff only see and manage their assigned tables during service |
| Owner closes the day | Owner taps "Close Day" to generate the final daily sales report; the report includes all orders served that day (excluding cancellations), the total revenue, and a per-staff sales breakdown |
| Daily report is available for 48 hours | The generated daily report remains accessible for 48 hours; after that it is automatically removed; owner is clearly shown the expiry time when the report is opened |
| Admin assigns a URL slug to a restaurant | When approving a new restaurant, admin confirms the restaurant's unique short name (slug), e.g. "pho-saigon"; this becomes part of their web address at pho-saigon.contactless-order-system.de |
| Admin views aggregate daily report | Admin can select any date and see a summary across all active restaurants: number of orders and total revenue per restaurant for that day |

---

## E11 — Staff Work Sessions & Trinkgeld

**As a** waiter, **I want** to track my own sales during a shift **so that** I know how much I earned in tips (Trinkgeld) and can settle up with the cashier correctly.

| Story | Acceptance Criteria |
|-------|---------------------|
| Staff understands the check-in concept | The app makes it clear that checking in means "I am now actively serving"; nothing is counted while checked out |
| Check-in and check-out can happen multiple times | A staff member may check in and check out three times in one day (e.g. lunch shift, break, dinner shift); all active periods are counted together |
| Sales are only counted during active periods | Orders served while the staff member was checked out are not included in their Trinkgeld calculation |
| Session summary is shown at end of day | The summary screen clearly shows: total value of orders served, the amount to hand to the cashier, and the remainder which is the staff's Trinkgeld |
| Session data persists during a break | If staff checks out and logs off the app, their session is still open; checking back in from any device continues the same session |
| Owner can see each staff member's session summary | Owner can review the session breakdown per staff member from the owner dashboard — useful for end-of-day reconciliation |

*Detailed flow and screen descriptions → [Staff Sessions Spec](staff-sessions-spec/)*

---

## E12 — Restaurant Identity & Subdomains

**As a** restaurant owner, **I want** my restaurant to have its own web address **so that** my guests have a clean and recognisable link to scan.

| Story | Acceptance Criteria |
|-------|---------------------|
| Each restaurant gets a unique short name (slug) | When a restaurant is approved, it receives a short name like "pho-saigon"; this is used in all URLs for that restaurant |
| Restaurant is accessible at its own subdomain | Guests and staff reach the restaurant at pho-saigon.contactless-order-system.de — no restaurant ID numbers visible in the address |
| QR codes use the branded subdomain URL | All QR codes generated for tables use the restaurant's subdomain address; scanning the QR takes the guest directly to that restaurant's menu |
| Staff login is also scoped to the subdomain | Staff log in at the restaurant's own subdomain; the correct restaurant is detected automatically |
| Owner dashboard accessible at the subdomain | Owner manages their restaurant from their own subdomain address |
| Slug is unique across the platform | Two restaurants cannot have the same slug; admin resolves conflicts at registration time |

---

*Stories continuously updated as sprints progress. Last updated: April

**As a** platform administrator, **I want** to manage restaurant tenants **so that** I can onboard and support clients.

| Story | Acceptance Criteria |
|-------|---------------------|
| Admin creates restaurant tenant | Restaurant record created; owner account email invitation sent |
| Admin views all tenants | Table shows restaurant name, owner email, status (pending/active/suspended), order count |
| Admin reviews pending registrations | List of owners with "Pending Approval" status; Google account info shown; approve/reject actions available |
| Admin approves restaurant owner | Owner status set to "Active"; owner receives notification and can access dashboard |
| Admin suspends / reactivates restaurant | Suspended restaurant shows maintenance page to guests |
| Admin assigns a URL slug to a restaurant | When approving a new restaurant, admin confirms the restaurant's unique short name (slug), e.g. "pho-saigon"; this becomes part of their web address at pho-saigon.contactless-order-system.de |
| Admin views aggregate daily report | Admin can select any date and see a summary across all active restaurants: number of orders and total revenue per restaurant for that day |

---

## E11 — Staff Work Sessions & Trinkgeld

**As a** waiter, **I want** to track my own sales during a shift **so that** I know how much I earned in tips (Trinkgeld) and can settle up with the cashier correctly.

| Story | Acceptance Criteria |
|-------|---------------------|
| Staff understands the check-in concept | The app makes it clear that checking in means "I am now actively serving"; nothing is counted while checked out |
| Check-in and check-out can happen multiple times | A staff member may check in and check out three times in one day (e.g. lunch shift, break, dinner shift); all active periods are counted together |
| Sales are only counted during active periods | Orders served while the staff member was checked out are not included in their Trinkgeld calculation |
| Session summary is shown at end of day | The summary screen clearly shows: total value of orders served, the amount to hand to the cashier, and the remainder which is the staff's Trinkgeld |
| Session data persists during a break | If staff checks out and logs off the app, their session is still open; checking back in from any device continues the same session |
| Owner can see each staff member's session summary | Owner can review the session breakdown per staff member from the owner dashboard — useful for end-of-day reconciliation |

*Detailed flow and screen descriptions → [Staff Sessions Spec](staff-sessions-spec/)*

---

## E12 — Restaurant Identity & Subdomains

**As a** restaurant owner, **I want** my restaurant to have its own web address **so that** my guests have a clean and recognisable link to scan.

| Story | Acceptance Criteria |
|-------|---------------------|
| Each restaurant gets a unique short name (slug) | When a restaurant is approved, it receives a short name like "pho-saigon"; this is used in all URLs for that restaurant |
| Restaurant is accessible at its own subdomain | Guests and staff reach the restaurant at pho-saigon.contactless-order-system.de — no restaurant ID numbers visible in the address |
| QR codes use the branded subdomain URL | All QR codes generated for tables use the restaurant's subdomain address; scanning the QR takes the guest directly to that restaurant's menu |
| Staff login is also scoped to the subdomain | Staff log in at the restaurant's own subdomain; the correct restaurant is detected automatically |
| Owner dashboard accessible at the subdomain | Owner manages their restaurant from their own subdomain address |
| Slug is unique across the platform | Two restaurants cannot have the same slug; admin resolves conflicts at registration time |

---

*Stories continuously updated as sprints progress. Last updated: April 2026.*
