# Đặc Tả UX: Nhân Viên – Sơ Đồ Tầng

**Route:** `/staff/floor` · **Vai trò:** Nhân viên (đã xác thực) · **Epic:** E2

---

## 1. Tổng Quan

Màn hình làm việc chính của nhân viên phục vụ. Hiển thị tất cả bàn trong nhà hàng dưới dạng lưới thẻ, mỗi thẻ phản ánh trạng thái đang dùng và trạng thái đơn hàng. Thẻ cập nhật theo thời gian thực qua SignalR. Nhấn vào bàn mở danh sách đơn hàng của bàn đó.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Tên nhà hàng, chip tên nhân viên, icon đăng xuất |
| `v-chip` (tên nhân viên) | Hiện tên nhân viên đang đăng nhập; nhấn để xem hồ sơ |
| `v-container` | Wrapper lưới responsive |
| `v-card` | Thẻ bàn — số bàn, màu trạng thái, số chỗ ngồi |
| `v-badge` | Huy hiệu số đơn hàng (chấm đỏ = có món sẵn sàng) |
| `v-icon` | Icon chỗ ngồi, icon chuông cho đơn hàng sẵn sàng |
| `v-progress-linear` | Thanh tải indeterminate toàn trang khi SignalR mất kết nối |
| `v-snackbar` | Toast khi đơn hàng chuyển sang trạng thái Sẵn Sàng |
| `v-btn` (icon) | Nút làm mới (dự phòng thủ công) |

---

## 3. Bố Cục

```
┌─────────────────────────────────────┐
│ Tên Nhà Hàng   [NV: An] [⏏]        │  ← v-app-bar
├─────────────────────────────────────┤
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │  B1  │  │  B2  │  │  B3  │       │  ← lưới bàn
│  │ Trống│  │  ●3  │  │ 🔔1  │       │      xanh=trống
│  │ 👥4  │  │ 👥2  │  │ 👥6  │       │      vàng=có khách
│  └──────┘  └──────┘  └──────┘       │      đỏ=đơn sẵn sàng
│  ┌──────┐  ┌──────┐  . . .          │
│  │  B4  │  │  B5  │                 │
│  │ Bận  │  │ Bận  │                 │
│  └──────┘  └──────┘                 │
│                                     │
└─────────────────────────────────────┘
```

**Ngữ nghĩa màu thẻ:**
- Xanh lá — bàn trống (không có đơn hàng đang hoạt động)
- Vàng — bàn có đơn hàng đang hoạt động; tất cả đang xử lý
- Đỏ (nhấp nháy) — có ít nhất một dòng đơn hàng Sẵn Sàng

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải
- Lưới skeleton khi `GET /api/restaurants/{id}/tables` đang tải

### 4.2 Bình Thường
- Tất cả bàn được hiển thị theo sơ đồ nhà hàng

### 4.3 Thông Báo Đơn Hàng Sẵn Sàng
- Thẻ bàn bị ảnh hưởng chuyển sang đỏ với animation nhấp nháy
- `v-snackbar` — "Bàn 3: Đơn hàng đã sẵn sàng"

### 4.4 Mất Kết Nối SignalR
- `v-progress-linear` indeterminate ở đầu trang
- Các thẻ bàn mờ đi với overlay mất kết nối

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang | `GET /api/restaurants/{id}/tables` + đăng ký SignalR |
| SignalR `OrderStatusChanged` (bất kỳ → Ready) | Cập nhật thẻ bàn thành đỏ, hiện snackbar |
| SignalR `OrderStatusChanged` (Ready → Served) | Trả lại màu thẻ |
| Nhấn thẻ bàn | Điều hướng đến `/staff/table/:tableId/orders` |
| Nhấn đăng xuất | Xoá phiên → `/staff/login` |

---

## 6. Tích Hợp SignalR

```typescript
connection.on('OrderStatusChanged', (payload) => {
  const table = tables.value.find(t => t.id === payload.tableId)
  if (table) {
    table.hasReadyOrder = payload.status === 'ready'
    if (payload.status === 'ready') showReadySnackbar(table.number)
  }
})
```

---

## 7. API

```typescript
GET /api/restaurants/{restaurantId}/tables
Response: [{
  id, number, seatCount,
  status: 'free' | 'occupied',
  activeOrders: number,
  hasReadyOrder: boolean
}]
```

---

## 8. Tiêu Chí Nghiệm Thu

Từ **E2 — Thao Tác Nhân Viên**:

- [ ] Tất cả bàn hiển thị trong lưới được sắp xếp theo số bàn
- [ ] Bàn có đơn sẵn sàng khác biệt rõ ràng (đỏ + nhấp nháy) so với bàn đang phục vụ
- [ ] Nhân viên được thông báo qua snackbar khi bất kỳ bàn nào chuyển sang Sẵn Sàng
- [ ] Nhấn thẻ bàn điều hướng đến danh sách đơn hàng của bàn đó
- [ ] Màn hình phản ánh trạng thái trực tiếp sau khi SignalR kết nối lại
