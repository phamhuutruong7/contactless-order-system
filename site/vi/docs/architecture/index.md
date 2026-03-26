# Kiến trúc hệ thống

**Hệ thống đặt món không tiếp xúc** · Tài liệu tham khảo kiến trúc · v1.0

---

## Tổng quan thành phần

```
┌───────────────────────────────────────────────────────────┐
│                     THIẾT BỊ THỰC KHÁCH                   │
│       Trình duyệt (không cài app) — quét mã QR           │
└──────────────┬────────────────────────┬───────────────────┘
               │ Tài nguyên SPA             │ API / WebSocket
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
│            MẠNG NỘI BỘ NHÀ HÀNG                           │
│  Client In ──► Máy in nhiệt bếp  (đồ ăn)                 │
│             └──► Máy in nhiệt quầy bar (đồ uống)          │
│  (Subscriber SignalR — nhận sự kiện in từ backend)        │
└───────────────────────────────────────────────────────────┘
```

---

## Phân tầng kiến trúc

### Frontend

| Ứng dụng | Người dùng | Công nghệ |
|----------|------------|-----------|
| SPA duy nhất | Tất cả vai trò (Thực khách, Nhân viên, Chủ nhà hàng, Admin) | Vue 3 + Vuetify, định tuyến theo vai trò |

SPA Vuetify duy nhất được triển khai trên **Vercel**. Hiển thị giao diện khác nhau dựa trên vai trò người dùng: thực khách truy cập ẩn danh qua mã QR, nhân viên/chủ nhà hàng/admin xác thực trước khi vào dashboard của họ.

### Backend API (.NET 10 — Clean Architecture)

Xây dựng theo [mẫu Clean Architecture của Jason Taylor](https://github.com/jasontaylordev/CleanArchitecture):

| Tầng | Trách nhiệm |
|------|-------------|
| **Domain** | Entities (`Order`, `MenuItem`, `Restaurant`, `Table`), Domain Events |
| **Application** | CQRS Commands/Queries (MediatR), Interfaces, DTOs, FluentValidation |
| **Infrastructure** | EF Core + Npgsql, triển khai SignalR hub, HTTP adapter ePOS-Print |
| **Api** | ASP.NET Core Web API — controllers hoặc minimal endpoints; JWT middleware |

- Xác thực JWT trên tất cả route được bảo vệ (token phát hành bởi Supabase)
- Xác thực nhân viên bằng PIN trả về JWT ngắn hạn giới hạn phạm vi
- Đảm bảo multi-tenancy: mọi truy vấn đều có vùng `restaurant_id`
- **ORM**: EF Core 10 với Npgsql provider; migrations tại `Infrastructure/Persistence/Migrations/`

### Thời gian thực (SignalR)

- Hub: `OrderHub`
- Nhóm: theo nhà hàng, theo bàn, theo bếp
- Sự kiện được đẩy:
  - `OrderReceived` → nhóm bếp
  - `OrderStatusChanged` → nhóm bàn (thực khách nhận cập nhật)
  - `TableSessionClosed` → nhóm bàn
- Dự phòng: long-polling cho môi trường chặn WebSocket

### Tầng dữ liệu (Supabase)

- **PostgreSQL** với chính sách Row-Level Security (RLS) theo từng tenant
- **Auth**: GoTrue — quản lý JWT, refresh token, xác minh email
- **Storage**: Bucket tương thích S3 để lưu ảnh món ăn
- Migration được theo dõi tại `supabase/migrations/`

---

## Hạ tầng

### Môi trường

| Môi trường | Máy chủ | Triển khai |
|------------|---------|------------|
| Dev | Civo Compute VM (1 vCPU / 2 GB) | Push lên nhánh `dev` → GitHub Actions SSH deploy |
| Prod | Civo Compute VM (2 vCPU / 4 GB) | Push lên nhánh `main` → blue-green switch |

### Triển khai Blue-Green (Prod)

```
Nginx upstream
  ├── Blue  (docker-compose.blue.yml  — cổng 8001)  ← đang hoạt động
  └── Green (docker-compose.green.yml — cổng 8002)  ← dự phòng
```

1. Build image mới và đẩy lên container registry
2. Kéo và khởi động stack dự phòng
3. Health check thành công trên stack dự phòng
4. `switch-stack.sh` nguyên tử ghi đè symlink upstream Nginx
5. Nginx reload — không có downtime
6. Stack cũ giữ ấm 10 phút rồi dừng lại

### Cấu trúc Container

```yaml
services:
  api:    # .NET 10 API + SignalR Hub (co-hosted)
  # Frontend được triển khai trên Vercel — không nằm trong Docker Compose này
```

### Môi trường phát triển (.NET Aspire)

.NET Aspire được dùng **chỉ cho phát triển local** — không triển khai lên production.

| Thành phần | Vai trò |
|------------|---------|
| Project **AppHost** | Điều phối API project + local Supabase container stack |
| Project **ServiceDefaults** | OpenTelemetry traces/metrics, health checks, service discovery |
| Supabase local container | Supabase tự-host đầy đủ (PostgreSQL + GoTrue Auth + Storage) |

```csharp
// AppHost Program.cs (chỉ dùng khi dev)
var supabase = builder.AddContainer("supabase", "supabase/postgres");
var api = builder.AddProject<Projects.Api>("api")
                 .WithReference(supabase);
```

> Production dùng Docker Compose blue-green (không thay đổi). Aspire không có trong production images.

---

## Kiến trúc in vé nhiệt

Khi đơn hàng được xác nhận, backend phân loại món theo `item_type` và gửi sự kiện SignalR đến nhóm theo nhà hàng:
- Đồ ăn → `KitchenPrintEvent` → nhóm `restaurant-{restaurantId}-kitchen`
- Đồ uống → `BarPrintEvent` → nhóm `restaurant-{restaurantId}-bar`

### Phần mềm client in (.NET 10 Worker Service)

Mỗi nhà hàng có một **phần mềm client in** chạy tại chỗ. Agent đăng ký **cả hai** nhóm SignalR và định tuyến nội bộ theo loại sự kiện.

```
SignalR Hub (Civo VM)
  └─► Print Client Agent (PC nội bộ nhà hàng — .NET 10 Worker Service .exe)
        ├── Epson TM-T82III — Máy in bếp (HTTP POST qua ePOS-Print XML)
        └── Epson TM-T82III — Máy in bar  (HTTP POST qua ePOS-Print XML)
```

In được gửi qua **ePOS-Print XML** over HTTP đến IP nội bộ của từng máy in:

```
POST http://{printerIp}/cgi-bin/epos/service.cgi
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://www.epson-pos.com/schemas/2011/03/epos-print"
```

Cấu hình agent (`appsettings.json`):

```json
{
  "PrintAgent": {
    "BackendUrl": "https://api.example.com",
    "RestaurantId": "<uuid>",
    "DeviceToken": "<token-do-chủ-nhà-hàng-tạo>",
    "KitchenPrinterIp": "192.168.1.101",
    "BarPrinterIp": "192.168.1.102"
  }
}
```

| Vấn đề | Cách xử lý |
|--------|------------|
| Model máy in | Epson TM-T82III |
| Giao thức in | ePOS-Print XML over HTTP (độc quyền Epson) |
| Định tuyến | Một agent mỗi nhà hàng; định tuyến theo loại sự kiện đến đúng IP máy in |
| Xác thực | `DeviceToken` trong header kết nối SignalR, được chủ nhà hàng tạo trong Owner Dashboard |
| Xử lý lỗi | Fire-and-forget — lỗi in kích hoạt sự kiện `PrintFailed` → cảnh báo trên Staff Dashboard |
| Cấu hình IP | IP tĩnh trong `appsettings.json` (cấu hình local, không lưu trong backend) |
| Xử lý lỗi | Máy in offline kích hoạt sự kiện `PrintFailed` → cảnh báo trên Dashboard nhân viên |
| Nội dung vé | Số bàn, số đơn, món + số lượng + ghi chú, thời gian |

---

## Kiến trúc bảo mật

| Biện pháp | Thực hiện |
|-----------|-----------|
| Mã hoá truyền dữ liệu | TLS 1.2+ qua Nginx |
| Token xác thực | Supabase JWT (RS256, hết hạn sau 1h) |
| Cô lập đa tenant | Chính sách RLS Supabase theo `restaurant_id` |
| Bảo mật token QR | Token bàn ký HMAC — không nhúng PII |
| Lưu PIN nhân viên | Băm bcrypt, không lưu dạng plaintext |
| CORS | API giới hạn domain triển khai Vercel và preview URL |
| Giới hạn tốc độ | Nginx + middleware rate limiter ASP.NET Core |
| Bí mật | Chỉ dùng biến môi trường — không hardcode credential |

---

## Pipeline CI/CD

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

*Tài liệu kiến trúc được duy trì bởi nhóm phát triển. Cập nhật lần cuối: Tháng 3 năm 2026.*
