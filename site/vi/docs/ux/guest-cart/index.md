# UX Spec: Giỏ Hàng (Khách)

**Route:** `/menu/:restaurantId/cart` · **Vai trò:** Khách (ẩn danh) · **Epic:** E1

---

## 1. Tổng Quan

Màn hình xem lại đơn hàng trước khi xác nhận. Hiển thị tất cả các món đã chọn, cho phép chỉnh sửa số lượng hoặc xóa món, xác nhận bàn, và tiến hành đặt hàng. Đây là màn hình cuối cùng trước khi đơn hàng được gửi lên server.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Nút quay lại + tiêu đề "Giỏ Hàng" |
| `v-list` | Danh sách các dòng trong giỏ hàng |
| `v-list-item` | Mỗi dòng: tên món, bổ sung, số lượng, giá |
| `v-counter` | Điều chỉnh số lượng từng dòng |
| `v-btn` (icon, danger) | Nút xóa dòng (icon thùng rác) |
| `v-slide-x-transition` | Hiệu ứng xóa dòng |
| `v-divider` | Phân cách giữa các dòng |
| `v-card` + `v-card-text` | Panel xác nhận bàn |
| `v-select` | Dropdown chọn bàn (populated từ session) |
| `v-text-field` (readonly) | Hiển thị bàn đã được ghi nhận từ QR code |
| `v-summary-row` (custom) | Tóm tắt tiền: Tổng phụ, Phí dịch vụ, Tổng cộng |
| `v-btn` (block, primary) | CTA "Đặt Hàng" |
| `v-empty-state` | Giỏ hàng trống — nút quay lại menu |
| `v-dialog` | Xác nhận đặt hàng (tóm tắt + 2 nút) |

---

## 3. Bố Cục

```
┌────────────────────────────────┐
│ [←] Giỏ Hàng (3 món)          │  ← v-app-bar
├────────────────────────────────┤
│ Bàn: Bàn 5 (từ mã QR)         │  ← v-text-field readonly
│ ─────────────────────────      │
│  [🍔] Burger               x2  │
│       Lớn, Phô mai thêm        │  ← v-list-item (bổ sung được chọn)
│       [−][2][+]     $24.00 [🗑] │
│ ─────────────────────────      │
│  [🍺] Bia             x1       │
│       [−][1][+]     $5.00  [🗑] │
│ ─────────────────────────      │
│                                │
│  Tổng phụ:         $29.00      │
│  Phí dịch vụ (10%): $2.90      │  (nếu được cấu hình)
│  Tổng cộng:        $31.90      │
│                                │
│  [       Đặt Hàng →         ]  │  ← v-btn
└────────────────────────────────┘
```

---

## 4. Trạng Thái UI

### 4.1 Có Món Trong Giỏ
- Danh sách hiển thị đầy đủ các dòng
- Tổng tiền được tính và hiển thị ở cuối

### 4.2 Giỏ Trống
- `v-empty-state` với icon giỏ hàng + thông báo "Giỏ hàng của bạn trống"
- Nút "Quay lại menu" + nút CTA ẩn

### 4.3 Đang Gửi Đơn Hàng
- Nút "Đặt Hàng" chuyển thành loading spinner + disabled
- Tất cả form field disabled

### 4.4 Gửi Thành Công
- Điều hướng đến `/menu/{restaurantId}/order/{orderId}/status`
- `useCartStore().clear()` — làm trống giỏ hàng

### 4.5 Lỗi Gửi Đơn
- `v-snackbar` màu đỏ với thông báo lỗi + nút Thử Lại

---

## 5. Tương Tác

| Hành động | Phản hồi |
|-----------|---------|
| Nhấn [−] / [+] số lượng | Cập nhật số lượng trong cart store; tổng tiền tính lại |
| Số lượng về 0 | Tự động xóa dòng (có hiệu ứng slide-out) |
| Nhấn icon thùng rác | Hiển thị dialog xác nhận xóa dòng nhỏ |
| Nhấn "Đặt Hàng" | Hiển thị `v-dialog` tóm tắt xác nhận (bàn + số lượng món + tổng) |
| Xác nhận trong dialog | POST `/api/orders` với cart data + tableId |
| Hủy trong dialog | Đóng dialog; quay lại giỏ hàng |

---

## 6. Dữ Liệu & API

```typescript
// useCartStore (Pinia)
interface Cart {
  restaurantId: string
  tableId: string
  items: CartItem[]
}

// Gửi đặt hàng
POST /api/orders
Body: {
  restaurantId: string
  tableId: string
  lines: [{
    itemId: string
    quantity: number
    selectedModifierIds: string[]
    note: string
  }]
}
Response: { orderId: string, status: 'pending' }
```

---

## 7. Tiêu Chí Chấp Thuận

Từ **E1 — Luồng Đặt Món Khách**:

- [ ] Khách có thể điều chỉnh số lượng và xóa món trong giỏ
- [ ] Tổng tiền cập nhật ngay khi thay đổi số lượng
- [ ] Dialog xác nhận hiển thị trước khi gửi đơn hàng
- [ ] Sau khi đặt thành công, giỏ hàng được làm trống
- [ ] Khi gửi thất bại, thông báo lỗi rõ ràng + có nút Thử Lại
