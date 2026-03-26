# Đặc Tả UX: Chủ Quán – Quản Lý Bàn & Mã QR

**Route:** `/owner/tables` · **Vai trò:** Chủ quán (xác thực Google OAuth) · **Epic:** E3

---

## 1. Tổng Quan

Cho phép chủ quán quản lý bàn vật lý của nhà hàng và tạo mã QR chứa URL thực đơn khách cho từng bàn. Khách quét mã QR để truy cập thực đơn đã được tải sẵn với `restaurantId` và `tableId` chính xác.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | "Bàn & Mã QR" + nút "Thêm Bàn" |
| `v-data-table` | Danh sách bàn có phân trang: số, chỗ ngồi, trạng thái, hành động |
| `v-chip` | Trạng thái bàn (Hoạt động / Không hoạt động) |
| `v-btn icon` | Sửa, Mã QR, Xoá cho mỗi hàng |
| `v-dialog` | Form thêm/sửa bàn |
| `v-dialog` (QR) | Xem trước mã QR + nút tải xuống |
| `v-text-field` | Số bàn, số chỗ ngồi |
| `v-switch` | Bật/tắt hoạt động |
| `v-img` | Mã QR dưới dạng SVG/PNG |
| `v-btn` | "Tải PNG" trong dialog QR |
| `v-snackbar` | "Đã lưu bàn" / "Đã sao chép link QR" |
| `v-empty-state` | "Chưa có bàn — hãy thêm bàn đầu tiên" |

---

## 3. Bố Cục

```
┌──────────────────────────────────────────────┐
│  Bàn & Mã QR                   [+ Thêm Bàn]  │  ← v-app-bar
├──────────────────────────────────────────────┤
│  # │ Tên     │ Chỗ ngồi │ Trạng thái │ Hành động │
│ ───┼─────────┼──────────┼────────────┼─────────  │
│  1 │  B1     │    4     │ ● Hoạt động│ ✎  ▣  🗑  │
│  2 │  B2     │    2     │ ● Hoạt động│ ✎  ▣  🗑  │
│  3 │  Ngoài  │    6     │ ○ Tắt      │ ✎  ▣  🗑  │
│                                              │
│  < 1  2  3 >                                 │  ← phân trang
└──────────────────────────────────────────────┘
```

▣ = icon mã QR (mở dialog QR).

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải
- `v-skeleton-loader` kiểu `table`

### 4.2 Dialog Form Bàn (Thêm / Sửa)
```
Số/Tên bàn  [________]  (bắt buộc, duy nhất)
Chỗ ngồi    [________]  (bắt buộc, ≥ 1)
Hoạt động?  [● Có]      (v-switch, mặc định: bật)
            [Lưu]  [Huỷ]
```

### 4.3 Dialog Mã QR
```
┌────────────────────────────┐
│  Mã QR — Bàn B1            │
│  ┌──────────────────────┐  │
│  │   [QR SVG/PNG]       │  │
│  └──────────────────────┘  │
│  URL: https://...          │
│  [Sao Chép Link]  [Tải PNG] │
│                  [Đóng]    │
└────────────────────────────┘
```

### 4.4 Xác Nhận Xoá
- `v-dialog` — "Xoá bàn 'B1'? Mã QR đang hoạt động của bàn này sẽ ngừng hoạt động."

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang | `GET /api/restaurants/{restaurantId}/tables` |
| Thêm bàn | Lưu dialog → `POST /api/restaurants/{restaurantId}/tables` |
| Sửa bàn | Lưu dialog → `PATCH /api/restaurants/{restaurantId}/tables/{id}` |
| Xoá bàn | Xác nhận → `DELETE /api/restaurants/{restaurantId}/tables/{id}` |
| Mở dialog QR | `GET /api/tables/{id}/qr` → hiển thị SVG trong dialog |
| Sao chép link | Sao chép URL thực đơn khách vào clipboard; thông báo "Đã sao chép!" |
| Tải PNG | Kích hoạt trình duyệt tải mã QR dạng PNG |

---

## 6. API

```typescript
GET    /api/restaurants/{restaurantId}/tables
Response: [{ id, number, name, seatCount, active }]

POST   /api/restaurants/{restaurantId}/tables
Body:  { number, name, seatCount, active: bool }

PATCH  /api/restaurants/{restaurantId}/tables/{id}
Body:  Partial<Table>

DELETE /api/restaurants/{restaurantId}/tables/{id}  → 204

GET    /api/tables/{id}/qr
Response: { qrSvg: string, guestUrl: string }
```

Định dạng `guestUrl`: `https://<host>/menu/{restaurantId}?table={tableId}`

---

## 7. Tiêu Chí Nghiệm Thu

Từ **E3 — Quản Lý Bàn & Mã QR**:

- [ ] Chủ quán có thể thêm bàn với số/tên và số chỗ ngồi
- [ ] Mỗi bàn có mã QR duy nhất chứa URL khách chính xác
- [ ] Mã QR có thể tải xuống dạng PNG để in
- [ ] Bàn không hoạt động được phân biệt trực quan; mã QR của chúng dẫn tới trang "bàn không khả dụng"
- [ ] Xoá bàn cảnh báo rằng mã QR của bàn đó sẽ ngừng hoạt động
