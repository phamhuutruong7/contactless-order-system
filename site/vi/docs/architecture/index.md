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
      │ Vue 3 + Vuetify    │    │  Nginx (TLS) · .NET 8 · SignalR    │
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

### Backend API (.NET 8)

- Endpoints **Minimal API** được nhóm theo domain: `auth`, `restaurants`, `menus`, `tables`, `orders`
- Xác thực JWT trên tất cả route được bảo vệ (token phát hành bởi Supabase)
- Xác thực nhân viên bằng PIN trả về JWT ngắn hạn giới hạn phạm vi
- Đảm bảo multi-tenancy: mọi truy vấn đều có vùng `restaurant_id`
- Không dùng ORM — truy vấn SQL thuần qua Npgsql hoặc Dapper để minh bạch hiệu năng

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
  api:    # .NET 8 API + SignalR Hub (co-hosted)
  # Frontend được triển khai trên Vercel — không nằm trong Docker Compose này
```

---

## Kiến trúc in vé nhiệt

Đơn hàng được phân tích loại món trước khi lưu, sau đó một `PrintEvent` được gửi qua SignalR:
- Món gắn nhãn **đồ ăn** → `PrintEvent` đến nhóm SignalR `kitchen`
- Món gắn nhãn **đồ uống** → `PrintEvent` đến nhóm SignalR `bar`

Một **phần mềm client in** (daemon nhẹ) chạy tại chỗ ở mỗi nhà hàng:

```
SignalR Hub (Civo VM)
  └─► Print Client Agent (PC nội bộ nhà hàng)
        ├── Máy in nhiệt bếp — đồ ăn (ESC/POS qua USB/LAN)
        └── Máy in nhiệt quầy bar — đồ uống (ESC/POS qua USB/LAN)
```

| Vấn đề | Cách xử lý |
|--------|------------|
| Giao thức máy in | ESC/POS (chuẩn công nghiệp cho máy in nhiệt) |
| Phân tách | Mỗi máy in đăng ký nhóm SignalR riêng (`kitchen` vs `bar`) |
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
