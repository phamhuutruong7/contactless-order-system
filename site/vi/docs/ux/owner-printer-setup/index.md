# Đặc Tả UX: Chủ Quán – Cài Đặt Máy In

**Route:** `/owner/printers` · **Vai trò:** Chủ quán (xác thực Google OAuth) · **Epic:** E4

---

## 1. Tổng Quan

Cho phép chủ quán đăng ký máy in tương thích Star CloudPRNT bằng cách nhập mã thiết bị và đặt nhãn cho mỗi máy (ví dụ: "Bếp", "Bar"). Hiển thị thời gian kết nối lần cuối và trạng thái. Hỗ trợ in thử để kiểm tra cấu hình.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | "Cài Đặt Máy In" + nút "Thêm Máy In" |
| `v-card` | Một card cho mỗi máy in đăng ký |
| `v-card-title` | Tên máy in + chip trạng thái |
| `v-card-subtitle` | Lần cuối thấy: "2 phút trước" / "Chưa bao giờ" |
| `v-chip` | Trực tuyến (xanh) / Ngoại tuyến (xám) / Lỗi (đỏ) |
| `v-btn` | "In Thử", "Sửa", "Xoá" cho mỗi card |
| `v-dialog` | Form thêm/sửa máy in |
| `v-text-field` | Tên máy in (nhãn), Mã thiết bị |
| `v-snackbar` | "Đã gửi lệnh in thử" / "Máy in không phản hồi" |
| `v-empty-state` | "Chưa có máy in nào" |
| `v-progress-circular` | Trong khi lệnh in thử đang xử lý |

---

## 3. Bố Cục

```
┌────────────────────────────────────────────┐
│  Cài Đặt Máy In             [+ Thêm Máy In] │  ← v-app-bar
├────────────────────────────────────────────┤
│                                            │
│  ┌────────────────────────────────────┐    │
│  │ Máy In Bếp          ● Trực Tuyến  │    │  ← v-card
│  │ Lần cuối thấy: 30 giây trước       │    │
│  │ Token: abc123…                     │    │
│  │  [In Thử]  [Sửa]  [Xoá]           │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │ Máy In Bar          ○ Ngoại Tuyến  │    │
│  │ Lần cuối thấy: 4 giờ trước         │    │
│  │ Token: xyz789…                     │    │
│  │  [In Thử]  [Sửa]  [Xoá]           │    │
│  └────────────────────────────────────┘    │
│                                            │
└────────────────────────────────────────────┘
```

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải
- `v-skeleton-loader` kiểu `card` × 2

### 4.2 Trống
- `v-empty-state` — "Chưa có máy in nào. Thêm máy in để bắt đầu nhận lệnh in."

### 4.3 Dialog Form Máy In (Thêm / Sửa)
```
Tên máy in   [____________________]  (bắt buộc, ví dụ: "Bếp")
Mã thiết bị  [____________________]  (bắt buộc, từ cổng CloudPRNT)
             [Lưu]  [Huỷ]
```
Mã thiết bị bị ẩn sau khi lưu (hiện 6 ký tự đầu + `…`).

### 4.4 Logic Trạng Thái Trực Tuyến
- **Trực tuyến**: lần poll cuối trong vòng 60 giây
- **Nhàn rỗi**: lần poll cuối 1–5 phút trước (hiển thị là Trực tuyến nhưng có ghi chú)
- **Ngoại tuyến**: lần poll cuối > 5 phút, hoặc chưa nhận poll nào

### 4.5 In Thử
- Nhấn "In Thử" → nút hiển thị spinner, gửi `POST /api/print/test`
- Thành công: snackbar "Đã gửi lệnh in thử tới [Tên]"
- Thất bại (máy in ngoại tuyến): snackbar "Máy in không phản hồi — kiểm tra thiết bị"

### 4.6 Xác Nhận Xoá
- `v-dialog` — "Xoá 'Máy In Bếp'? Các lệnh in đang chờ của máy in này sẽ bị huỷ."

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang | `GET /api/restaurants/{restaurantId}/printers` |
| Thêm máy in | Lưu dialog → `POST /api/restaurants/{restaurantId}/printers` |
| Sửa máy in | Lưu dialog → `PATCH /api/restaurants/{restaurantId}/printers/{id}` |
| Xoá máy in | Xác nhận → `DELETE /api/restaurants/{restaurantId}/printers/{id}` |
| In thử | `POST /api/print/test` `{ printerId }` → thông báo kết quả |
| Tự làm mới trạng thái | Poll `GET /api/restaurants/{restaurantId}/printers` mỗi 30 giây |

---

## 6. API

```typescript
GET    /api/restaurants/{restaurantId}/printers
Response: [{ id, name, deviceToken, lastSeenAt, status: 'online' | 'idle' | 'offline' }]

POST   /api/restaurants/{restaurantId}/printers
Body:  { name, deviceToken }

PATCH  /api/restaurants/{restaurantId}/printers/{id}
Body:  { name?, deviceToken? }

DELETE /api/restaurants/{restaurantId}/printers/{id}  → 204

POST   /api/print/test
Body:  { printerId: string }
200:   { queued: true }
503:   { error: 'printer_offline' }
```

---

## 7. Tiêu Chí Nghiệm Thu

Từ **E4 — In Ấn**:

- [ ] Chủ quán có thể đăng ký máy in với tên và mã thiết bị CloudPRNT
- [ ] Trạng thái kết nối (Trực tuyến / Nhàn rỗi / Ngoại tuyến) làm mới mỗi 30 giây
- [ ] In thử xác nhận máy in có thể tiếp cận trước khi vận hành thực tế
- [ ] Mã thiết bị bị ẩn khi hiển thị (bảo mật: không hiển thị dạng văn bản thường)
- [ ] Xoá máy in cảnh báo rằng lệnh in đang chờ sẽ bị huỷ
