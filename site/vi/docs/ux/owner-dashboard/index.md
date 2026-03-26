# Đặc Tả UX: Chủ Quán – Bảng Điều Khiển

**Route:** `/owner/dashboard` · **Vai trò:** Chủ quán (xác thực Google OAuth) · **Epic:** E3

---

## 1. Tổng Quan

Màn hình chính sau khi đăng nhập. Cung cấp tổng quan doanh thu, công cụ quản lý nhân viên và cài đặt hồ sơ nhà hàng trong giao diện dạng tab.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Tiêu đề "Bảng Điều Khiển" + thanh tab |
| `v-tabs` / `v-tab` | Doanh Thu · Nhân Viên · Hồ Sơ |
| `v-window` / `v-window-item` | Nội dung từng tab |
| `v-card` | Card chỉ số (doanh thu, đơn hàng, giá trị trung bình) |
| `v-sparkline` | Biểu đồ xu hướng 7 ngày trên card chỉ số |
| `v-data-table` | Danh sách nhân viên với hành động inline |
| `v-dialog` | Thêm nhân viên / Đổi mã PIN |
| `v-text-field` | Tên nhân viên, ô nhập mã PIN |
| `v-switch` | Bật/tắt trạng thái hoạt động của nhân viên |
| `v-file-input` | Tải lên logo nhà hàng |
| `v-snackbar` | Xác nhận lưu và thông báo lỗi |

---

## 3. Bố Cục

```
┌──────────────────────────────────────────────────┐
│  Bảng Điều Khiển                                 │  ← v-app-bar
│  [Doanh Thu]  [Nhân Viên]  [Hồ Sơ]              │  ← v-tabs
├──────────────────────────────────────────────────┤
│                                                  │
│  TAB DOANH THU (mặc định)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Hôm Nay  │  │ Tuần Này │  │ Tháng Này│       │
│  │ 2.800K   │  │ 18.400K  │  │ 70.000K  │       │
│  │ [spark]  │  │ [spark]  │  │ [spark]  │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐                     │
│  │ Đơn Hàng │  │ TB/Đơn   │                     │
│  │  47      │  │  60K     │                     │
│  └──────────┘  └──────────┘                     │
│                                                  │
│  TAB NHÂN VIÊN                                   │
│  [+ Thêm Nhân Viên]                              │
│  ┌──┬────────────┬────────────┬────────┬─────┐  │
│  │ID│ Tên        │ Đăng nhập  │ Hoạt Đ.│ PIN │  │
│  ├──┼────────────┼────────────┼────────┼─────┤  │
│  │ 1│ Nguyễn Lan │ 2 giờ trước│  ●     │ [✎] │  │
│  │ 2│ Trần Hùng  │ Hôm qua    │  ●     │ [✎] │  │
│  └──┴────────────┴────────────┴────────┴─────┘  │
│                                                  │
│  TAB HỒ SƠ                                       │
│  Tên nhà hàng  [________________]                │
│  Mô tả         [________________]                │
│  Loại ẩm thực  [________________]                │
│  Logo          [Tải lên logo…]  [xem trước]     │
│                [Lưu Thay Đổi]                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 4. Các Trạng Thái UI

### 4.1 Tab Doanh Thu
- Ba card chỉ số theo khoảng thời gian: Hôm Nay / Tuần Này / Tháng Này
- Mỗi card hiển thị giá trị VND + đường xu hướng `v-sparkline` 7 ngày
- Hai card thêm: tổng số đơn hàng và giá trị trung bình mỗi đơn (trong ngày)
- Làm mới khi mount trang; không tự động làm mới (kéo để làm mới trên mobile)

### 4.2 Tab Nhân Viên

**Dialog Thêm Nhân Viên**
```
Tên nhân viên  [____________________]   (bắt buộc)
Mã PIN         [____________________]   (4–6 chữ số; ẩn khi nhập)
               [Thêm]  [Huỷ]
```
- Sau khi lưu: `POST /api/restaurants/{id}/staff`
- Nhân viên mới mặc định ở trạng thái hoạt động

**Dialog Đổi Mã PIN**
```
Mã PIN mới     [____________________]   (4–6 chữ số)
Xác nhận PIN   [____________________]
               [Lưu]  [Huỷ]
```
- Kích hoạt bởi biểu tượng bút chì trong bảng nhân viên → `PATCH /api/restaurants/{id}/staff/{staffId}`

**Toggle Trạng Thái Hoạt Động**
- `v-switch` inline trong bảng — nhân viên bị vô hiệu hoá không thể đăng nhập
- `PATCH /api/restaurants/{id}/staff/{staffId}` `{ active: false }`

**Banner Khoá PIN** (có điều kiện)
- Nếu `failedAttempts >= 3`, hiển thị chip cảnh báo: "Đã khoá – 3 lần nhập sai PIN"
- Chủ quán đặt lại bằng cách lưu mã PIN mới (xoá `failedAttempts`)

### 4.3 Tab Hồ Sơ
- Chỉnh sửa tên, mô tả, loại ẩm thực nhà hàng
- Logo: `v-file-input` — JPEG/PNG ≤ 2 MB; hiển thị xem trước sau khi chọn
- `PATCH /api/restaurants/{id}` gửi `multipart/form-data`
- Thành công: snackbar "Đã cập nhật hồ sơ"

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang (tab Doanh Thu) | `GET /api/restaurants/{id}/stats` |
| Chuyển sang tab Nhân Viên | `GET /api/restaurants/{id}/staff` (tải một lần khi mở) |
| Thêm nhân viên | `POST /api/restaurants/{id}/staff` → làm mới bảng |
| Đổi mã PIN | `PATCH /api/restaurants/{id}/staff/{staffId}` `{ pin }` → snackbar |
| Toggle trạng thái | `PATCH /api/restaurants/{id}/staff/{staffId}` `{ active }` |
| Lưu hồ sơ | `PATCH /api/restaurants/{id}` `multipart/form-data` → snackbar |

---

## 6. API

```typescript
GET    /api/restaurants/{id}/stats
Response: {
  todayRevenue:  number,   // VND
  weekRevenue:   number,
  monthRevenue:  number,
  todayOrders:   number,
  avgOrderValue: number,
  sparkline:     number[]  // doanh thu 7 ngày gần nhất
}

GET    /api/restaurants/{id}/staff
Response: [{ id, name, active, lastLoginAt, failedAttempts }]

POST   /api/restaurants/{id}/staff
Body:  { name, pin }

PATCH  /api/restaurants/{id}/staff/{staffId}
Body:  { pin?, active? }

PATCH  /api/restaurants/{id}
Body:  multipart/form-data { name?, description?, cuisineType?, logo? }
```

---

## 7. Tiêu Chí Nghiệm Thu

Từ **E3 — Quản Lý Chủ Quán**:

- [ ] Chỉ số doanh thu (hôm nay / tuần / tháng) tải khi vào bảng điều khiển
- [ ] Chủ quán có thể tạo nhân viên mới với tên và mã PIN số
- [ ] Chủ quán có thể đổi mã PIN nhân viên; thao tác xoá bỏ trạng thái khoá PIN hiện tại
- [ ] Chủ quán có thể vô hiệu hoá nhân viên; nhân viên bị vô hiệu hoá không thể đăng nhập
- [ ] Bảng nhân viên hiển thị thời gian đăng nhập gần nhất và trạng thái khoá (nếu có)
- [ ] Tên, mô tả và logo nhà hàng có thể cập nhật từ tab Hồ Sơ
