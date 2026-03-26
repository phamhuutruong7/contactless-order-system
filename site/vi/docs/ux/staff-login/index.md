# Đặc Tả UX: Nhân Viên – Đăng Nhập

**Route:** `/staff/login` · **Vai trò:** Nhân viên · **Epic:** E2

---

## 1. Tổng Quan

Nhân viên xác thực bằng mã PIN 4 chữ số. Không có trường tên đăng nhập hay email — danh tính được xác định từ PIN trong phạm vi nhà hàng. Đăng nhập thành công sẽ cấp JWT ngắn hạn và chuyển đến trang quản lý tầng. Ba lần nhập sai liên tiếp sẽ khoá PIN trong 15 phút.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-container` | Bố cục card căn giữa, giữa chiều dọc trên desktop |
| `v-card` | Card đăng nhập với header logo nhà hàng |
| `v-img` | Logo nhà hàng |
| `v-otp-input` (4 chữ số) | Bàn phím PIN tuỳ chỉnh hoặc `v-otp-input` của Vuetify; mỗi chữ số được ẩn ngay |
| `v-btn` (numpad 0–9) | Nút số trên màn hình (thân thiện cảm ứng, 56×56 dp) |
| `v-btn` (xoá lùi) | Xoá chữ số cuối |
| `v-progress-linear` | Thanh indeterminate khi đang xác thực |
| `v-alert type="error"` | Thông báo sai PIN / tài khoản bị khoá |
| `v-chip` | "Còn N lần thử" cảnh báo sau lần nhập sai đầu tiên |

---

## 3. Bố Cục

```
┌─────────────────────────────┐
│                             │
│       [Logo Nhà Hàng]       │
│       Tên Nhà Hàng          │
│                             │
│    ● ● ○ ○   ← chấm PIN     │
│                             │
│   [ 1 ] [ 2 ] [ 3 ]         │
│   [ 4 ] [ 5 ] [ 6 ]         │
│   [ 7 ] [ 8 ] [ 9 ]         │
│   [      0   ] [ ⌫ ]        │
│                             │
│  [⚠ Còn 2 lần thử]          │  ← chip (có điều kiện)
│  [✗ Sai PIN]                │  ← alert (có điều kiện)
└─────────────────────────────┘
```

---

## 4. Các Trạng Thái UI

### 4.1 Rảnh
- Các chấm PIN trống, bàn phím bật

### 4.2 Đang Nhập
- Các chấm lấp đầy theo thứ tự khi nhập số
- Tự động submit khi nhập chữ số thứ 4 (không cần nút xác nhận)

### 4.3 Đang Xác Thực
- `v-progress-linear` xuất hiện; bàn phím bị vô hiệu hoá

### 4.4 Lỗi (1–2 lần thất bại)
- Các chấm rung (CSS keyframe)
- `v-alert type="error"` — "Sai mã PIN"
- `v-chip` — "Còn N lần thử"
- Reset về trống sau 800 ms

### 4.5 Bị Khoá
- `v-alert type="error"` — "Tài khoản bị khoá trong 15 phút"
- Bàn phím bị vô hiệu hoá hoàn toàn
- Hiển thị đếm ngược thời gian

### 4.6 Thành Công
- Nhấp nháy xanh ngắn → chuyển đến `/staff/floor`

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Nhấn số | Thêm chữ số, tô chấm tiếp theo |
| Nhập chữ số thứ 4 | Tự động submit `POST /api/auth/staff/login` |
| Nhấn xoá lùi | Xoá chữ số cuối |
| `POST` 401 | Animation rung + alert lỗi + tăng đếm thất bại |
| Lần thất bại thứ 3 | Alert khoá + vô hiệu bàn phím + bắt đầu đếm ngược |
| `POST` 200 | Lưu JWT vào `sessionStorage` → điều hướng đến floor |

---

## 6. API

```typescript
POST /api/auth/staff/login
Body:   { restaurantId: string, pin: string }
200:    { token: string, staffId: string, name: string }
401:    { error: 'invalid_pin', attemptsRemaining: number }
423:    { error: 'account_locked', retryAfterSeconds: number }
```

---

## 7. Ghi Chú Bảo Mật

- PIN được hash với bcrypt phía server (không bao giờ lưu dạng plaintext)
- JWT hết hạn sau 8 giờ (độ dài ca làm việc)
- Scope `restaurantId` ngăn PIN bị rò rỉ giữa các tenant
- Không autocomplete PIN (`autocomplete="off"` trên mọi input)

---

## 8. Tiêu Chí Nghiệm Thu

Từ **E2 — Thao Tác Nhân Viên**:

- [ ] Nhân viên đăng nhập bằng PIN 4 chữ số trong dưới 5 giây
- [ ] Sai PIN phản hồi rung ngay lập tức
- [ ] Ba lần sai liên tiếp khoá tài khoản trong 15 phút
- [ ] Nhập PIN hoạt động trên máy tính bảng POS cảm ứng và bàn phím phần cứng
- [ ] JWT được lưu theo phiên (xoá khi đóng tab)
