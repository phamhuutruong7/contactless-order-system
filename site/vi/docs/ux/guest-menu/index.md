# Đặc Tả UX: Khách – Duyệt Menu

**Route:** `/menu/:restaurantId` · **Vai trò:** Khách (ẩn danh) · **Epic:** E1

---

## 1. Tổng Quan

Màn hình đầu tiên mà khách chạm vào khi quét mã QR. Menu được tải một lần theo `restaurantId`; tính khả dụng của từng món cập nhật theo thời gian thực qua SignalR. Tất cả tương tác không yêu cầu đăng nhập.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Logo nhà hàng bên trái, toggle ngôn ngữ bên phải |
| `v-tabs` | Tab danh mục nằm ngang, cuộn ngang nếu nhiều danh mục |
| `v-window` | Panel nội dung ứng với mỗi tab, hỗ trợ vuốt |
| `v-card` | Thẻ món ăn — hình ảnh, tên, giá, chip "Hết Hàng" |
| `v-img` | Hình ảnh món ăn — aspect-ratio 4:3 |
| `v-skeleton-loader` | Placeholder trong khi tải lần đầu |
| `v-badge` | Số lượng giỏ hàng trên icon túi |
| `v-bottom-navigation` | Ẩn khi giỏ trống; hiện nút giỏ hàng khi có món |
| `v-chip` | Nhãn "Hết Hàng" trên thẻ không khả dụng |
| `v-snackbar` | Xác nhận thêm món vào giỏ (tự đóng sau 2 giây) |
| `v-progress-circular` | Spinner tải lại khi offline và đang kết nối lại |
| `v-empty-state` | Thông báo khi danh mục không có món nào |

---

## 3. Bố Cục

```
┌────────────────────────────────┐
│ [Logo]        Restaurant Name  │  ← v-app-bar
│               [VI | EN]        │
├────────────────────────────────┤
│ Đồ Ăn | Đồ Uống | Topping ...  │  ← v-tabs (cuộn ngang)
├────────────────────────────────┤
│                                │
│  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ Ảnh  │  │ Ảnh  │  │ Ảnh  │  │  ← grid 3 cột (desktop)
│  │Burger│  │ Bia  │  │Pizza │  │      2 cột (mobile)
│  │$12   │  │$5    │  │$15   │  │
│  └──────┘  └──────┘  └──────┘  │
│                 [Hết Hàng]↑    │  ← v-chip overlay
│  . . .                         │
│                                │
├────────────────────────────────┤
│        [🛒 Xem Giỏ Hàng (3)]   │  ← v-bottom-navigation (ẩn khi giỏ trống)
└────────────────────────────────┘
```

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải (Skeleton)
- Hiện 6 `v-skeleton-loader` dạng `card` sắp xếp theo grid
- `v-tabs` hiển thị nhưng bị vô hiệu hóa

### 4.2 Thành Công
- Lưới thẻ món đầy đủ, cuộn theo danh mục

### 4.3 Danh Mục Trống
- `v-empty-state` với icon danh sách và nội dung "Danh mục này hiện chưa có món"

### 4.4 Lỗi / Ngoại Tuyến
- Banner nội tuyến với thông báo "Đang ngoại tuyến — hiển thị menu đã lưu trong bộ nhớ cache"
- `v-progress-circular` nếu đang thử kết nối lại

### 4.5 Giỏ Hàng Có Món
- `v-bottom-navigation` xuất hiện với animation trượt lên
- `v-badge` trên icon túi hiển thị tổng số món

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Quét QR → tải trang | `GET /api/menu/{restaurantId}` → render menu; lưu vào `useMenuStore` |
| Nhấn tab danh mục | Chuyển panel tương ứng; cuộn lên đầu panel |
| Vuốt panel | Chuyển danh mục; tab đồng bộ highlight |
| Nhấn thẻ món | Điều hướng đến `/menu/{restaurantId}/item/{itemId}` |
| Nhấn thẻ "Hết Hàng" | Không làm gì — `pointer-events: none`, chip overlay |
| SignalR `MenuItemAvailabilityChanged` | Bật/tắt chip "Hết Hàng" ngay lập tức |
| Nhấn nút giỏ | Điều hướng đến `/menu/{restaurantId}/cart` |

---

## 6. Tích Hợp SignalR

```typescript
// composable useMenuStore
connection.on('MenuItemAvailabilityChanged', (payload: { itemId, available }) => {
  const item = findItem(payload.itemId)
  if (item) item.available = payload.available
})
```

---

## 7. Dữ Liệu & API

```typescript
GET /api/menu/{restaurantId}
Response: {
  restaurant: { id, name, logoUrl },
  categories: [{
    id, name, sortOrder,
    items: [{
      id, name, description, priceEurCents,
      imageUrl, available,
      modifierGroups: [...]
    }]
  }]
}
```

---

## 8. Tiêu Chí Nghiệm Thu

Từ **E1 — Luồng Đặt Hàng Khách**:

- [ ] Khách thấy menu sau khi quét mã QR không cần đăng nhập
- [ ] Trạng thái "Hết Hàng" cập nhật theo thời gian thực không cần làm mới trang
- [ ] Điều hướng tab hoạt động với cả nhấn và vuốt
- [ ] Skeleton loader hiển thị trong tối đa 1 giây trên mạng LAN
- [ ] Menu đã lưu cache hiển thị khi không có kết nối mạng
- [ ] Nút giỏ hàng ẩn khi giỏ trống, hiện khi có ít nhất 1 món
