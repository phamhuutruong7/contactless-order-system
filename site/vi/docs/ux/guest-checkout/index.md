# UX Spec: Xác Nhận Đơn Hàng (Khách)

**Route:** `/menu/:restaurantId/checkout` · **Vai trò:** Khách (ẩn danh) · **Epic:** E1

---

## 1. Tổng Quan

Màn hình xác nhận trung gian giữa Giỏ Hàng và Trạng Thái Đơn Hàng. Trình bày bản tóm tắt chỉ đọc — bàn, món ăn, tổng tiền — trước khi khách nhấn nút xác nhận cuối cùng để gửi `POST /api/orders`. Khác với màn hình Giỏ Hàng: không thể chỉnh sửa ở đây, chỉ xác nhận hoặc quay lại.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Quay lại giỏ hàng + tiêu đề "Xác Nhận Đơn Hàng" |
| `v-card` | Container tóm tắt đơn hàng |
| `v-card-title` | Tiêu đề "Đơn Hàng Của Bạn" |
| `v-list` + `v-list-item` | Các dòng chỉ đọc (tên, số lượng, giá) |
| `v-chip` (outlined) | Nhãn loại món: Đồ ăn / Đồ uống |
| `v-divider` | Phân cách dòng với tổng tiền |
| `v-list-item` (tóm tắt) | Tổng phụ, Phí dịch vụ, Tổng cộng |
| `v-card` (outlined) | Thông tin loại đơn — số bàn (ăn tại chỗ) hoặc huy hiệu Mang Đi |
| `v-icon` + text | Số bàn + chỉ báo quét QR |
| `v-btn` (block, large, primary) | CTA "Xác Nhận & Đặt Hàng" |
| `v-btn` (text) | Hành động phụ "← Sửa Giỏ Hàng" |
| `v-progress-linear` | Thanh loading trên cùng khi đang gửi |
| `v-snackbar` | Thông báo lỗi |

---

## 3. Bố Cục

```
┌────────────────────────────────┐
│ [←] Xác Nhận Đơn Hàng         │  ← v-app-bar
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ 📍 Bàn 5                 │  │  ← ăn tại chỗ: hiển số bàn
│  │ 🛍 Mang Đi             │  │  ← mang đi: huy hiệu (có điều kiện)
│  └──────────────────────────┘  │
│                                │
│  Đơn Hàng Của Bạn              │  ← v-card-title
│  ─────────────────────────     │
│   Burger ×2  [Đồ ăn] $24.00   │
│   Lớn, Phô mai thêm            │
│   Bia ×1     [Đồ uống] $5.00  │
│  ─────────────────────────     │
│  Tổng phụ:          $29.00     │
│  Phí dịch vụ (10%):  $2.90     │
│  Tổng cộng:         $31.90     │
│                                │
│  [   Xác Nhận & Đặt Hàng   ]  │  ← v-btn (block, primary)
│  [      ← Sửa Giỏ Hàng     ]  │  ← v-btn (text)
└────────────────────────────────┘
```

---

## 4. Trạng Thái UI

### 4.1 Mặc Định (đang xem lại)
- Tất cả field chỉ đọc; không có control chỉnh sửa
- CTA được bật và hiển thị rõ ràng

### 4.2 Đang Gửi
- `v-progress-linear` indeterminate xuất hiện trên cùng màn hình
- CTA disabled + hiển thị spinner với nhãn "Đang đặt hàng…"
- Nút "Sửa Giỏ Hàng" cũng bị disabled

### 4.3 Thành Công
- Điều hướng ngay đến `/menu/{restaurantId}/order/{orderId}/status`
- `useCartStore().clear()`

### 4.4 Lỗi
- `v-progress-linear` ẩn đi
- Các nút được bật lại
- `v-snackbar` lỗi: "Đặt hàng thất bại. Vui lòng thử lại."

---

## 5. Tương Tác

| Hành động | Phản hồi |
|-----------|---------|
| Nhấn "← Sửa Giỏ Hàng" | Điều hướng về `/menu/{restaurantId}/cart` |
| Nhấn "Xác Nhận & Đặt Hàng" | `POST /api/orders` → thành công → trang trạng thái đơn hàng |
| Nút back (hệ thống / vuốt) | Quay lại giỏ hàng |

---

## 6. Dữ Liệu & API

```typescript
// Đọc từ useCartStore — không gọi API cho đến khi nhấn xác nhận

POST /api/orders
Body: { restaurantId, orderType: 'table' | 'take_away', tableId?: string, lines: [...] }
Response: { orderId: string, status: 'pending' }

// Khi thành công:
router.push(`/menu/${restaurantId}/order/${orderId}/status`)
useCartStore().clear()
```

---

## 7. Tiêu Chí Chấp Thuận

Từ **E1 — Luồng Đặt Món Khách**:

- [ ] Màn hình xác nhận chỉ đọc; không thể chỉnh sửa từ đây
- [ ] Loại đơn hiển thị rõ ràng (số bàn cho ăn tại chỗ, huy hiệu “Mang Đi” cho mang đi)
- [ ] Đồ ăn và đồ uống được phân biệt rõ ràng bằng nhãn chip
- [ ] Một lần nhấn xác nhận và gửi đơn hàng
- [ ] Khi thành công, khách được chuyển ngay đến trang trạng thái đơn
- [ ] Khi thất bại, khách có thể thử lại mà không mất dữ liệu giỏ hàng
