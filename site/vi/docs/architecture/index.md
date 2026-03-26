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
│              MÁY IN CLOUDPRNT (polling)                    │
│  Máy in bếp mC-Print3   ──► gọi GET /api/print/poll      │
│  Máy in bar mC-Print3   ──► gọi GET /api/print/poll      │
│  (Máy in tự polling — không cần phần mềm cục bộ)         │
└───────────────────────────────────────────────────────────┘
```

---

## Phân tầng kiến trúc

### Frontend

| Ứng dụng | Người dùng | Công nghệ |
|----------|------------|-----------|
| SPA duy nhất | Tất cả vai trò (Thực khách, Nhân viên, Chủ nhà hàng, Admin) | Vue 3 + Vuetify, định tuyến theo vai trò |
| Hỗ trợ PWA | Thực khách (chính) | Service Worker (cache tài nguyên SPA, fallback offline) + Web App Manifest; có thể cài đặt trên iOS Safari 15+ và Android Chrome 100+ |

SPA Vuetify duy nhất được triển khai trên **Vercel**. Hiển thị giao diện khác nhau dựa trên vai trò người dùng: thực khách truy cập ẩn danh qua mã QR, nhân viên/chủ nhà hàng/admin xác thực trước khi vào dashboard của họ.

### Backend API (.NET 10 — Minimal API)

Dự án đơn ASP.NET Core Minimal API (`src/Api/`):

| Thư mục / File | Mục đích |
|---------------|----------|
| `Endpoints/` | Route handler nhóm theo domain |
| `Hubs/` | SignalR hub (`OrderHub`) |
| `Models/` | Request / response DTO |
| `Services/` | Logic nghiệp vụ và wrapper Supabase client |
| `Middleware/` | Xác thực JWT, phạm vi tenant |
| `Program.cs` | Đăng ký DI, middleware pipeline, ánh xạ route |

- Xác thực JWT trên tất cả route được bảo vệ (token phát hành bởi Supabase)
- Xác thực nhân viên bằng PIN trả về JWT ngắn hạn giới hạn phạm vi
- Đảm bảo multi-tenancy: mọi truy vấn đều có vùng `restaurant_id`
- **Truy cập dữ liệu**: Supabase .NET SDK + Npgsql (SQL thuần — không dùng ORM, không migration)

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

Máy in Star Micronics mC-Print3 sử dụng giao thức **CloudPRNT** — máy in tự chủ động polling backend, không cần phần mềm cục bộ.

### Luồng hoạt động

1. Khi đơn hàng được xác nhận, backend tạo job in trong outbox PostgreSQL bền vững (Wolverine) và phân theo `item_type`:
   - Đồ ăn → job gắn với device token máy in bếp
   - Đồ uống → job gắn với device token máy in bar
2. Máy in mC-Print3 **tự polling** `GET /api/print/poll?deviceToken=<token>` mỗi 2–3 giây.
3. Backend trả về payload Base64 ESC/POS chuẩn Star khi có job đang chờ.
4. Máy in xác nhận `POST /api/print/status/{jobId}` sau khi in xong.

```
Backend (Civo VM)
  ├─► GET /api/print/poll?deviceToken=<kitchen-token>  ◄── Máy in bếp mC-Print3 (tự polling)
  └─► GET /api/print/poll?deviceToken=<bar-token>     ◄── Máy in bar mC-Print3  (tự polling)
```

| Vấn đề | Cách xử lý |
|--------|------------|
| Model máy in | Star Micronics mC-Print3 |
| Giao thức in | CloudPRNT (máy in tự polling HTTP — không cần phần mềm cục bộ) |
| Định tuyến | Hai device token riêng biệt — kitchen token và bar token; đăng ký trong Owner Dashboard |
| Xác thực | `deviceToken` trên query string `GET /api/print/poll`; được tạo và quản lý trong Owner Dashboard |
| Xử lý lỗi | Job không được nhận trong thời gian chờ → cảnh báo trên Staff Dashboard kèm chi tiết đơn hàng |
| Nội dung vé | Số bàn, số đơn, món + số lượng + ghi chú, thời gian |
| Chi phí đầu tư | ~€400–600/máy |

---

## Kiến trúc bảo mật

| Biện pháp | Thực hiện |
|-----------|-----------|
| Mã hoá truyền dữ liệu | TLS 1.2+ qua Nginx |
| Token xác thực | Supabase JWT (RS256, hết hạn sau 1h) |
| Cô lập đa tenant | Chính sách RLS Supabase theo `restaurant_id` |
| Bảo mật token QR | Token cấp nhà hàng ký HMAC — không chứa thông tin cá nhân; số bàn được khách chọn khi thanh toán |
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
