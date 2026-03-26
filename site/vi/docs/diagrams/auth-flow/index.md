# Kiến Trúc: Luồng Xác Thực

**Loại:** Sơ đồ trình tự · **Phạm vi:** Bốn luồng xác thực trong hệ thống

---

## 1. Xác Thực Ẩn Danh Khách

```mermaid
sequenceDiagram
  participant G as Khách (Trình Duyệt)
  participant API as ASP.NET Core API
  participant DB as Supabase DB

  G->>G: Quét mã QR bàn
  G->>API: POST /api/auth/anonymous { qrToken }
  API->>DB: SELECT * FROM tables WHERE qr_token = ?
  alt Mã QR hợp lệ
    DB-->>API: Thông tin bàn (tableId, restaurantId)
    API->>API: Tạo JWT ẩn danh (role=guest, 24 giờ)
    API-->>G: 200 { token, tableId, restaurantId }
    G->>G: Lưu token, chuyển đến trang menu
  else Mã QR không hợp lệ hoặc hết hạn
    DB-->>API: Không tìm thấy
    API-->>G: 401 Unauthorised
    G->>G: Hiển thị trang lỗi "Mã QR không hợp lệ"
  end
```

---

## 2. Xác Thực PIN Nhân Viên

```mermaid
sequenceDiagram
  participant S as Nhân Viên (Máy Tính Bảng)
  participant API as ASP.NET Core API
  participant DB as Supabase DB

  S->>API: POST /api/auth/staff { restaurantId, pin }
  API->>DB: SELECT * FROM staff WHERE restaurant_id = ?

  alt Tài khoản đang bị khoá (locked_until > now())
    DB-->>API: Trả về trường locked_until
    API-->>S: 423 Locked { unlocksAt }
    S->>S: Hiển thị "Tài khoản bị khoá đến {unlocksAt}"
  else Tài khoản hoạt động bình thường
    DB-->>API: Dữ liệu nhân viên (pin_hash, failed_attempts)
    API->>API: bcrypt.verify(pin, pin_hash)

    alt Xác thực PIN thành công
      API->>DB: UPDATE staff SET failed_attempts = 0
      API->>API: Tạo JWT nhân viên (role=staff, restaurantId, 8 giờ)
      API-->>S: 200 { token, staffId, name }
      S->>S: Chuyển đến màn hình sàn nhà hàng
    else PIN sai
      API->>DB: UPDATE staff SET failed_attempts = failed_attempts + 1
      alt Đạt 3 lần sai
        API->>DB: UPDATE staff SET locked_until = now() + 15 phút
        API-->>S: 423 Locked { unlocksAt }
        S->>S: Hiển thị "Tài khoản bị khoá 15 phút"
      else Dưới 3 lần sai
        API-->>S: 401 Unauthorised { attemptsRemaining }
        S->>S: Hiển thị "PIN sai, còn {attemptsRemaining} lần thử"
      end
    end
  end
```

---

## 3. Google OAuth Chủ Nhà Hàng

```mermaid
sequenceDiagram
  participant O as Chủ Nhà Hàng (Trình Duyệt)
  participant API as ASP.NET Core API
  participant GG as Google OIDC
  participant DB as Supabase DB

  O->>API: GET /api/auth/google
  API-->>O: Chuyển hướng đến Google OAuth
  O->>GG: Đăng nhập Google + chấp thuận quyền
  GG-->>O: Redirect + code
  O->>API: GET /api/auth/google/callback?code=...
  API->>GG: Đổi code lấy id_token
  GG-->>API: id_token (sub, email, name)
  API->>DB: UPSERT INTO users (google_sub, email, name)
  DB-->>API: Dữ liệu người dùng (userId, restaurantId?)

  alt Chưa có nhà hàng (restaurantId = null)
    API->>API: Tạo JWT (role=owner, restaurantId=null)
    API-->>O: 200 { token, requiresOnboarding: true }
    O->>O: Chuyển đến luồng onboarding
  else Đã có nhà hàng
    API->>API: Tạo JWT (role=owner, restaurantId)
    API-->>O: 200 { token, requiresOnboarding: false }
    O->>O: Chuyển đến trang tổng quan chủ nhà hàng
  end
```

---

## 4. Xác Thực Admin Được Cấu Hình Sẵn

```mermaid
sequenceDiagram
  participant A as Admin (Trình Duyệt)
  participant API as ASP.NET Core API
  participant DB as Supabase DB

  A->>API: POST /api/auth/admin { email, password }
  API->>DB: SELECT * FROM users WHERE email = ? AND role = 'admin'
  DB-->>API: Dữ liệu admin (password_hash)
  API->>API: bcrypt.verify(password, password_hash)

  alt Xác thực thành công
    API->>API: Tạo JWT (role=admin, 8 giờ)
    API-->>A: 200 { token, adminId }
    A->>A: Chuyển đến trang tổng quan admin
  else Mật khẩu sai
    API-->>A: 401 Unauthorised
    A->>A: Hiển thị "Thông tin đăng nhập không đúng"
  end
```

> **Tài khoản Admin được tạo sẵn** trong quá trình triển khai thông qua biến môi trường `ADMIN_EMAIL` và `ADMIN_PASSWORD`. Admin không thể tự đăng ký — tài khoản phải được tạo thủ công bởi nhóm vận hành.

---

## 5. Bảng Phân Quyền JWT

| Vai Trò | Phạm Vi Token | Đường Dẫn Được Phép | Ghi Chú |
|---------|--------------|---------------------|---------|
| `guest` | 24 giờ | `/api/menus/*`, `/api/orders` (POST), `/api/orders/{id}` (GET) | Ràng buộc theo `tableId` và `restaurantId` |
| `staff` | 8 giờ | `/api/orders/*`, `/api/items/availability` | Ràng buộc theo `restaurantId` |
| `owner` | Phiên làm việc | Tất cả `/api/restaurants/{id}/*` | Ràng buộc theo `restaurantId` |
| `admin` | 8 giờ | `/api/admin/*` | Không ràng buộc nhà hàng |
