# Đặc Tả UX: Nhân Viên – Đơn Hàng Theo Bàn

**Route:** `/staff/table/:tableId/orders` · **Vai trò:** Nhân viên (đã xác thực) · **Epic:** E2

---

## 1. Tổng Quan

Màn hình chi tiết cho một bàn cụ thể. Nhân viên xem tất cả đơn hàng đang hoạt động của bàn được nhóm theo đơn, với khả năng chuyển trạng thái từng đơn. Đơn đã phục vụ bị ẩn mặc định để giảm nhiễu thông tin. Nút back quay về sơ đồ tầng.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Tiêu đề "Bàn N · Đơn Hàng" + mũi tên quay lại |
| `v-list` | Các phần theo từng đơn |
| `v-list-group` | Có thể thu gọn theo đơn (header: mã đơn + giờ tạo) |
| `v-list-item` | Từng dòng món: tên, modifier, ghi chú, số lượng |
| `v-chip` | Huy hiệu trạng thái mỗi đơn (màu theo trạng thái) |
| `v-btn` | Nút chuyển trạng thái: "Đã Nhận", "Đang Pha Chế", "Sẵn Sàng" |
| `v-btn type="text"` | "Đã Phục Vụ" (hành động cuối, kiểu thiếu nổi bật) |
| `v-divider` | Phân cách giữa các đơn |
| `v-empty-state` | "Không có đơn hàng đang hoạt động" khi bàn trống |
| `v-dialog` | Dialog xác nhận trước khi chuyển sang Đã Phục Vụ |

---

## 3. Bố Cục

```
┌──────────────────────────────────┐
│ ← Bàn 3 · Đơn Hàng              │  ← v-app-bar
├──────────────────────────────────┤
│                                  │
│ ▾ Đơn #A1B2  12:01  [Đã Nhận]   │  ← header list-group
│   Burger ×2                      │
│     + Phô mai thêm               │
│   Bia (lớn) ×1                   │
│   Ghi chú: không đá              │
│                 [Đánh Dấu Sẵn Sàng] │
│                                  │
│ ▾ Đơn #C3D4  12:15  [Chờ XL]    │
│   Pizza Margherita ×1            │
│           [Đánh Dấu Đã Nhận]    │
│                                  │
│ (Đơn đã phục vụ bị ẩn)          │
│ [Hiện đơn đã phục vụ]  ← toggle  │
│                                  │
└──────────────────────────────────┘
```

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải
- `v-skeleton-loader` cho danh sách trong khi dữ liệu tải

### 4.2 Có Đơn Đang Hoạt Động
- Nhóm liệt kê theo thứ tự thời gian (cũ nhất ở trên)
- Mỗi nhóm hiển thị món + chip trạng thái hiện tại + một nút chuyển trạng thái

### 4.3 Tất Cả Đã Phục Vụ / Không Có Đơn
- `v-empty-state` — "Không có đơn hàng đang hoạt động cho bàn này"

### 4.4 Xác Nhận Đã Phục Vụ
- `v-dialog` — "Đánh dấu đơn hàng đã phục vụ? Thao tác này sẽ đóng đơn."
- Hai nút: Xác Nhận / Huỷ

---

## 5. Ánh Xạ Trạng Thái → Hành Động

| Trạng Thái Hiện Tại | Nhãn Nút CTA | Trạng Thái Tiếp Theo |
|---------------------|-------------|---------------------|
| Chờ Xử Lý | Đánh Dấu Đã Nhận | Đã Nhận |
| Đã Nhận | Đánh Dấu Đang Pha Chế | Đang Pha Chế |
| Đang Pha Chế | Đánh Dấu Sẵn Sàng | Sẵn Sàng |
| Sẵn Sàng | Đánh Dấu Đã Phục Vụ | Đã Phục Vụ |
| Đã Phục Vụ | — (ẩn) | n/a |

---

## 6. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang | `GET /api/tables/{tableId}/orders?status=active` |
| Nhấn nút chuyển trạng thái | `PATCH /api/orders/{orderId}/status` → cập nhật UI lạc quan |
| SignalR `OrderStatusChanged` | Đồng bộ chip + CTA ngay lập tức (ví dụ: bếp chuyển trạng thái) |
| Nhấn "Đánh Dấu Đã Phục Vụ" | Mở dialog xác nhận trước |
| Xác nhận Đã Phục Vụ | `PATCH` → xoá đơn khỏi danh sách với animation trượt ra |
| Toggle đã phục vụ | Hiện/ẩn đơn đã phục vụ trong trang |

---

## 7. API

```typescript
GET /api/tables/{tableId}/orders?status=active
Response: [{ id, status, createdAt, lines: [{ itemName, quantity, modifiers, note }] }]

PATCH /api/orders/{orderId}/status
Body: { status: 'received' | 'preparing' | 'ready' | 'served' }
200:  { id, status, updatedAt }
```

---

## 8. Tiêu Chí Nghiệm Thu

Từ **E2 — Thao Tác Nhân Viên**:

- [ ] Nhân viên chuyển trạng thái đơn với một lần nhấn
- [ ] Tất cả đơn hàng đang hoạt động của bàn hiển thị trên một màn hình
- [ ] Modifier và ghi chú hiển thị theo từng dòng món (không cần drill-down)
- [ ] Đơn đã phục vụ bị ẩn mặc định để giảm tải nhận thức
- [ ] Thay đổi trạng thái phản ánh ngay lập tức (UI lạc quan + xác nhận SignalR)
