# Bối Cảnh Dự Án

**Hệ thống đặt món không tiếp xúc** · Tạo qua BMAD GPC · Tháng 3, 2026

---

## 1. Tổng Quan Dự Án

Nền tảng SaaS đa tenant cho phép nhà hàng cung cấp trải nghiệm đặt món số hóa hoàn toàn — không cần cài ứng dụng: khách hàng quét mã QR, duyệt menu trực tuyến và đặt món từ thiết bị cá nhân. Đơn hàng được truyền theo thời gian thực tới máy in bếp và quầy bar qua giao thức CloudPRNT, trong khi nhân viên quản lý bàn và chủ nhà hàng điều hành qua bảng điều khiển chuyên dụng.

---

## 2. Công Nghệ Sử Dụng

### Frontend
| Tầng | Công nghệ |
|------|----------|
| Framework UI | **Vue 3** (Composition API + `<script setup>`) |
| Thư viện UI | **Vuetify 3** (Material Design) |
| Quản lý state | **Pinia** |
| Routing | **Vue Router 4** |
| Thời gian thực | **@microsoft/signalr** (WebSocket client) |
| Build | **Vite** |
| PWA | Service Worker + Web App Manifest (offline fallback, có thể cài) |
| Tài liệu | **VitePress** → GitHub Pages |

### Backend
| Tầng | Công nghệ |
|------|----------|
| Runtime | **.NET 10** (C# 14) |
| Framework web | **ASP.NET Core Minimal API** |
| Thời gian thực | **SignalR** (ASP.NET Core) |
| ORM | **Supabase .NET SDK** + SQL thuần qua Npgsql |
| Xác thực | **Supabase GoTrue** (Google OAuth + phiên ẩn danh + PIN bcrypt) |
| Cơ sở dữ liệu | **Supabase PostgreSQL** (managed) |
| Lưu trữ file | **Supabase Storage** (S3-compatible) |
| In ấn | **Star CloudPRNT** — máy in polling REST endpoint để nhận lệnh ESC/POS |
| Dev local | **.NET Aspire AppHost** (chỉ dùng khi phát triển) |

### Hạ Tầng
| Mục | Công nghệ |
|-----|----------|
| CDN Frontend | **Vercel** |
| Backend | **Civo** Linux VMs (blue/green containers) |
| Container | **Docker** + Docker Compose |
| Reverse Proxy / TLS | **Nginx** |
| CI/CD | **GitHub Actions** |
| Quản lý bí mật | GitHub Actions Secrets + biến môi trường |
| Chiến lược branch | `main` → prod, `dev` → dev; bảo vệ branch trên `main` |

---

## 3. Cấu Trúc Repository

```
/
├── .github/
│   └── workflows/
│       ├── deploy-dev.yml         # Push lên dev → deploy lên Civo Dev VM
│       ├── deploy-prod.yml        # Push lên main → blue-green deploy lên Civo Prod VM
│       └── docs.yml               # Push lên main → build VitePress → GitHub Pages
│
├── src/
│   ├── Api/                       # ASP.NET Core Minimal API + SignalR Hub
│   │   ├── Endpoints/             # Các route handler theo từng domain
│   │   ├── Hubs/                  # OrderHub.cs (SignalR)
│   │   ├── Models/                # DTO Request/Response
│   │   ├── Services/              # Logic nghiệp vụ
│   │   ├── Middleware/            # Auth middleware, tenant resolution
│   │   └── Program.cs
│   │
│   ├── Frontend/                  # Vue 3 + Vuetify SPA
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/        # UI components dùng chung
│   │   │   ├── composables/       # Vue composables
│   │   │   ├── layouts/           # Layouts (GuestLayout, StaffLayout, OwnerLayout)
│   │   │   ├── pages/             # Các trang theo route
│   │   │   ├── router/            # Định nghĩa route Vue Router
│   │   │   ├── stores/            # Pinia stores
│   │   │   └── main.ts
│   │   ├── public/
│   │   │   ├── manifest.json      # PWA manifest
│   │   │   └── sw.js              # Service Worker
│   │   └── vite.config.ts
│   │
│   └── AppHost/                   # .NET Aspire (chỉ dùng khi dev)
│
├── site/                          # Trang tài liệu VitePress
│   ├── .vitepress/config.ts
│   └── docs/                      # Tài liệu tiếng Anh
│
├── docker-compose.blue.yml        # Stack blue (Civo prod)
├── docker-compose.green.yml       # Stack green (Civo prod)
├── docker-compose.dev.yml         # Stack môi trường dev
└── nginx.conf                     # Cấu hình reverse proxy
```

---

## 4. Các Mẫu Kiến Trúc

### 4.1 Multi-Tenancy

Mỗi request API mang `restaurant_id` được giải quyết từ JWT. Chính sách Row Level Security (RLS) của Supabase bảo vệ dữ liệu theo từng tenant ngay ở tầng database.

```
JWT → Middleware giải quyết restaurant_id → gắn vào mọi query DB
Supabase RLS: auth.jwt() ->> 'restaurant_id' = restaurant_id
```

### 4.2 Luồng Xác Thực

| Vai trò | Phương thức | Token |
|---------|-------------|-------|
| Khách | Phiên ẩn danh khi quét QR | Supabase anon JWT (theo restaurant) |
| Nhân viên | PIN 6 chữ số → so sánh bcrypt | Supabase JWT (role staff) |
| Chủ nhà hàng | Google OAuth qua Supabase GoTrue | Supabase OAuth JWT (role owner) |
| Quản trị nền tảng | Tài khoản admin được tạo sẵn | Supabase JWT (role admin) |

Tài khoản chủ nhà hàng được tạo với `status = 'pending_approval'`. Quản trị viên nền tảng phải phê duyệt — chỉ khi đó `status` mới được đặt thành `'active'`.

### 4.3 Thời Gian Thực (SignalR)

```
Khách xác nhận đơn hàng
  → POST /api/orders
  → OrderHub.Clients.Group(restaurantId).SendAsync("OrderReceived", order)
  → Màn hình bếp + Bảng điều khiển nhân viên + Trang trạng thái khách cùng cập nhật
```

Clients tham gia nhóm SignalR theo `restaurant_id`. Đồng bộ trạng thái qua REST GET khi kết nối lại.

### 4.4 Định Tuyến In CloudPRNT

```
Đơn hàng được gửi với món ăn VÀ/HOẶC đồ uống
  → OrderService.RouteForPrinting(order)
  → Món ăn → PrintJob(type=kitchen, deviceToken=kitchenToken)
  → Đồ uống → PrintJob(type=bar, deviceToken=barToken)

Máy in polling: GET /api/print/poll?deviceToken=<token>
  → Nếu có job: 200 { jobId, contentType, content: "<base64 ESC/POS>" }
  → Nếu rảnh:   204 No Content

Máy in xác nhận: POST /api/print/status/{jobId}  { status: "OK" | "Error" }
  → Timeout: cảnh báo đến Bảng điều khiển nhân viên qua SignalR
```

### 4.5 Máy Trạng Thái Đơn Hàng

```
Chờ → Đã nhận → Đang chuẩn bị → Sẵn sàng → Đã phục vụ
                                           ↘ Đã hủy (hành động của nhân viên)
```

---

## 5. Các Route API Chính

### Xác Thực
| Method | Route | Mô tả |
|--------|-------|-------|
| POST | `/auth/guest` | Tạo phiên ẩn danh cho khách |
| POST | `/auth/pin` | Đăng nhập PIN nhân viên |
| GET | `/auth/callback` | Callback Google OAuth |

### Menu (Khách)
| Method | Route | Mô tả |
|--------|-------|-------|
| GET | `/api/menu/{restaurantId}` | Lấy toàn bộ menu |

### Đơn Hàng
| Method | Route | Mô tả |
|--------|-------|-------|
| POST | `/api/orders` | Khách gửi đơn hàng |
| GET | `/api/orders/{orderId}` | Lấy trạng thái đơn hàng |
| PUT | `/api/orders/{orderId}/status` | Nhân viên/bếp cập nhật trạng thái |
| DELETE | `/api/orders/{orderId}` | Nhân viên hủy đơn hàng |

### Bảng Điều Khiển Nhân Viên
| Method | Route | Mô tả |
|--------|-------|-------|
| GET | `/api/tables` | Danh sách bàn và trạng thái |
| PUT | `/api/tables/{tableId}/close` | Đóng phiên bàn |
| GET | `/api/tables/{tableId}/orders` | Đơn hàng của một bàn |

### CloudPRNT
| Method | Route | Mô tả |
|--------|-------|-------|
| GET | `/api/print/poll` | Máy in polling (query: `deviceToken`) |
| POST | `/api/print/status/{jobId}` | Callback trạng thái in |

### SignalR
| Hub | Route | Sự kiện chính |
|-----|-------|--------------|
| `OrderHub` | `/hubs/orders` | `OrderReceived`, `OrderStatusChanged`, `PrintFailed` |

---

## 6. Sơ Đồ Cơ Sở Dữ Liệu (Các Bảng Chính)

| Bảng | Cột quan trọng |
|------|---------------|
| `restaurants` | `id`, `name`, `owner_id`, `status`, `kitchen_printer_token`, `bar_printer_token` |
| `menu_categories` | `id`, `restaurant_id`, `name`, `sort_order`, `archived_at` |
| `menu_items` | `id`, `category_id`, `name`, `description`, `price_eur_cents`, `item_type` (food/drink), `is_available`, `photo_url` |
| `modifier_groups` | `id`, `item_id`, `name`, `is_required`, `min_selections`, `max_selections` |
| `modifiers` | `id`, `group_id`, `name`, `price_delta_eur_cents` |
| `tables` | `id`, `restaurant_id`, `name`, `is_active` |
| `orders` | `id`, `restaurant_id`, `table_id` (nullable), `order_type` (`table`/`take_away`), `status`, `created_at` |
| `order_lines` | `id`, `order_id`, `item_id`, `quantity`, `note`, `unit_price_eur_cents` |
| `print_jobs` | `id`, `restaurant_id`, `order_id`, `printer_type`, `device_token`, `status` |
| `staff` | `id`, `restaurant_id`, `name`, `pin_hash`, `is_active` |

---

## 7. Phát Triển Local

### Yêu Cầu
- [.NET 10 SDK](https://dot.net)
- [Node.js 22 LTS](https://nodejs.org)
- [Docker Desktop](https://docker.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (tùy chọn)

### Khởi Động Stack Dev

```bash
# Backend + Supabase local (qua .NET Aspire)
cd src/AppHost
dotnet run

# Frontend (terminal riêng)
cd src/Frontend
npm install
npm run dev
```

### Trang Tài Liệu

```bash
cd site
npm install
npm run dev      # Xem trước tại http://localhost:5173
npm run build    # Build production
```

---

## 8. Quy Ước Viết Code

| Mục | Quy ước |
|-----|---------|
| Vue components | PascalCase; Composition API; `<script setup lang="ts">` |
| Stores (Pinia) | Một store mỗi domain (`useCartStore`, `useOrderStore`) |
| Composables | Tiền tố `use`; trả về reactive refs + functions |
| API routes | Kebab-case; versioning theo `/api/v1/` ở v2 |
| Xử lý lỗi | Global error handler → toast notification |
| Commit | Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:` |
| Tên branch | `feature/E5-guest-ordering`, `fix/E7-print-timeout` |
