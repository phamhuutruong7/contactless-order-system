# Đặc Tả UX: Khách – Trạng Thái Đơn Hàng

**Route:** `/menu/:restaurantId/order/:orderId/status` · **Vai trò:** Khách (ẩn danh) · **Epic:** E1

---

## 1. Tổng Quan

Màn hình theo dõi đơn hàng theo thời gian thực. Khách được chuyển đến đây ngay sau khi đặt hàng và có thể để nguyên tab để xem quá trình thực hiện. Cập nhật trạng thái đến qua SignalR — không cần polling. Stepper dọc hiển thị trực quan máy trạng thái.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Tên nhà hàng + tiêu đề "Trạng Thái Đơn Hàng"; không có nút back (luồng hoàn chỉnh) |
| `v-stepper` (dọc) | Quy trình: Chờ → Đã Nhận → Đang Pha Chế → Sẵn Sàng → Đã Phục Vụ |
| `v-stepper-item` | Mỗi trạng thái với icon + nhãn + thời gian |
| `v-icon` (animated) | Mũ bếp xoay khi Đang Pha Chế; dấu checkmark khi Đã Phục Vụ |
| `v-card` | Panel tóm tắt đơn hàng (mã đơn, bàn, món) |
| `v-list` + `v-list-item` | Danh sách món chỉ đọc để tham khảo |
| `v-chip` | Huy hiệu trạng thái hiện tại (màu theo trạng thái) |
| `v-alert type="success"` | "Đơn hàng của bạn đã sẵn sàng!" — ăn tại chỗ: "Nhân viên sẽ mang đến bàn"; mang đi: "Vui lòng nhận đơn tại quầy" — hiện khi Ready |
| `v-alert type="warning"` | Banner lỗi in (nếu nhận sự kiện SignalR `PrintFailed`) |
| `v-btn` | "Gọi Thêm" — điều hướng về menu giữ nguyên phiên |
| `v-progress-circular` | Spinner trong khi tải trạng thái ban đầu |

---

## 3. Bố Cục

```
┌────────────────────────────────┐
│ Tên Nhà Hàng · Trạng Thái ĐH  │  ← v-app-bar
├────────────────────────────────┤
│                                │
│  Đơn #A1B2 · Bàn 5             │  ← v-card header (ăn tại chỗ) / "Đơn #A1B2 · Mang Đi" (mang đi)
│  ─────────────────────────     │
│  ● Chờ Xử Lý    12:01          │  ← v-stepper-item (hoàn thành)
│  ● Đã Nhận      12:01          │  ← hoàn thành
│  ⟳ Đang Pha Chế 12:02          │  ← đang thực hiện (icon động)
│  ○ Sẵn Sàng                    │  ← sắp tới
│  ○ Đã Phục Vụ                  │  ← sắp tới
│  ─────────────────────────     │
│  Burger ×2           240.000₫  │  ← dòng món chỉ đọc
│  Bia ×1               50.000₫  │
│  ─────────────────────────     │
│  [  🍽 Gọi Thêm Từ Menu  ]     │  ← v-btn
│                                │
│  [⚠ Lỗi in — nhân viên đã     │  ← v-alert warning (có điều kiện)
│    được thông báo]             │
└────────────────────────────────┘
```

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải (tải ban đầu)
- Hiển thị `v-progress-circular` trong khi `GET /api/orders/{orderId}` đang xử lý

### 4.2 Chờ Xử Lý (Pending)
- Stepper: bước 1 đang hoạt động (chấm cam)
- Chip: "Chờ Xử Lý" (xám)
- Nội dung: "Đơn hàng của bạn đã được gửi đến bếp"

### 4.3 Đã Nhận (Received)
- Bước 1–2 hoàn thành; chuyển động có animation
- Chip: "Đã Nhận" (xanh dương)

### 4.4 Đang Pha Chế (Preparing)
- Bước 1–2 tích; bước 3 có animation
- Chip: "Đang Pha Chế" (amber)
- Icon mũ bếp xoay trên bước đang thực hiện

### 4.5 Sẵn Sàng (Ready)
- Bước 1–3 tích; bước 4 đang hoạt động
- `v-alert type="success"` — "Đơn hàng của bạn đã sẵn sàng!" (ăn tại chỗ: "Nhân viên sẽ mang đến bàn"; mang đi: "Vui lòng nhận đơn tại quầy")
- Chip chuyển sang xanh lá

### 4.6 Đã Phục Vụ (Served)
- Tất cả bước tích; bước cuối đang hoạt động
- Animation confetti nhẹ (chỉ CSS, hỗ trợ accessibility)
- `v-btn` — "Gọi Thêm" để bắt đầu lại quy trình

### 4.7 Đã Huỷ (Cancelled)
- Stepper hiện dấu X đỏ trên bước bị huỷ
- `v-alert type="error"` — "Đơn hàng của bạn đã bị huỷ. Vui lòng hỏi nhân viên."

### 4.8 Lỗi In (nền)
- Banner `v-alert type="warning"` xuất hiện phía dưới
- Nội dung: "Đang gặp sự cố máy in. Nhân viên đã được thông báo."

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang | `GET /api/orders/{orderId}` → thiết lập trạng thái ban đầu |
| SignalR `OrderStatusChanged` | Cập nhật stepper ngay lập tức (không tải lại) |
| SignalR `PrintFailed` | Hiện cảnh báo |
| Nhấn "Gọi Thêm" | Điều hướng đến `/menu/{restaurantId}` giữ nguyên `tableId` (ăn tại chỗ) hoặc không có tableId (mang đi) |
| Làm mới trang | Kết nối lại SignalR + tải lại trạng thái hiện tại |

---

## 6. Tích Hợp SignalR

```typescript
// composable useOrderStatusStore
const connection = new HubConnectionBuilder()
  .withUrl('/hubs/orders')
  .withAutomaticReconnect()
  .build()

connection.on('OrderStatusChanged', (payload: { orderId: string, orderType: 'table' | 'take_away', tableId: string | null, status: string, timestamp: string }) => {
  if (payload.orderId === currentOrderId) {
    orderStatus.value = payload.status
    statusHistory.value.push({ status: payload.status, at: payload.timestamp })
  }
})

connection.on('PrintFailed', (payload: { orderId }) => {
  if (payload.orderId === currentOrderId) showPrintWarning.value = true
})

// Tham gia nhóm nhà hàng khi kết nối
connection.invoke('JoinRestaurant', restaurantId)
```

---

## 7. Dữ Liệu & API

```typescript
GET /api/orders/{orderId}
Response: {
  id: string
  orderType: 'table' | 'take_away'
  tableId: string | null
  status: 'pending' | 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
  lines: [{ itemName, quantity, unitPriceEurCents, modifierSummary }]
  statusHistory: [{ status, occurredAt }]
}
```

---

## 8. Tiêu Chí Nghiệm Thu

Từ **E1 — Luồng Đặt Hàng Khách**:

- [ ] Khách xem cập nhật trạng thái thời gian thực không cần làm mới
- [ ] 5 trạng thái đơn hàng hiển thị khác biệt rõ ràng trong stepper
- [ ] Trạng thái "Sẵn Sàng" kích hoạt thông báo nổi bật (alert + chip xanh)
- [ ] Lỗi in không làm chặn khách xem trạng thái đơn hàng
- [ ] Khách có thể quay lại menu và đặt thêm từ màn hình này
- [ ] SignalR tự động kết nối lại nếu mất kết nối
- [ ] Thông báo “Sẵn Sàng” hướng khách ăn tại chỗ chờ tại bàn và khách mang đi nhận tại quầy
- [ ] Tiêu đề đơn hiển số bàn (ăn tại chỗ) hoặc nhãn “Mang Đi” (mang đi)
