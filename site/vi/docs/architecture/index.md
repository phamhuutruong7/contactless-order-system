# Kiến trúc hệ thống

**Hệ thống đặt món không tiếp xúc** · Tài liệu tham khảo kiến trúc · v1.0

---

## Tổng quan thành phần

```
┌─────────────────────────────────────────────────────────────┐
│                     THIẾT BỊ THỰC KHÁCH                     │
│        Trình duyệt (không cài app) — quét mã QR             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                  NGINX (reverse proxy)                       │
│            Kết thúc TLS · Cache tài nguyên tĩnh             │
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

## Phân tầng kiến trúc

### Frontend

| Ứng dụng | Người dùng | Công nghệ |
|----------|------------|-----------|
| Menu thực khách | Thực khách (ẩn danh) | Vue 3 + Vite, ưu tiên mobile |
| Dashboard nhân viên | Nhân viên phục vụ (xác thực PIN) | Vue 3 + Vite |
| Dashboard chủ nhà hàng | Chủ/Quản lý nhà hàng | Vue 3 + Vite |
| Admin Panel | Vận hành nền tảng | Vue 3 + Vite |

Cả bốn ứng dụng được build thành các bundle SPA riêng biệt bằng Vite và phục vụ qua Nginx.

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
  api:    # .NET 8 API
  web:    # Vue 3 frontend (Nginx static)
  hub:    # SignalR hub (hoặc chạy cùng api)
```

---

## Kiến trúc bảo mật

| Biện pháp | Thực hiện |
|-----------|-----------|
| Mã hoá truyền dữ liệu | TLS 1.2+ qua Nginx |
| Token xác thực | Supabase JWT (RS256, hết hạn sau 1h) |
| Cô lập đa tenant | Chính sách RLS Supabase theo `restaurant_id` |
| Bảo mật token QR | Token bàn ký HMAC — không nhúng PII |
| Lưu PIN nhân viên | Băm bcrypt, không lưu dạng plaintext |
| CORS | API giới hạn các domain frontend đã biết |
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
