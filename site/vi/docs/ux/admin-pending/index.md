# Đặc Tả UX: Admin – Đơn Đăng Ký Chờ Duyệt

**Route:** `/admin/pending` · **Vai Trò:** Admin (tài khoản cấu hình sẵn) · **Epic:** E5

---

## 1. Tổng Quan

Hàng đợi hiển thị chỉ các nhà hàng có trạng thái `pending_approval`. Các chủ nhà hàng vừa đăng ký sẽ xuất hiện ở đây chờ admin xem xét. Admin có thể duyệt (kích hoạt chủ nhà hàng) hoặc từ chối (tuỳ chọn gửi lý do từ chối).

---

## 2. Danh Sách Thành Phần

| Thành Phần | Mục Đích |
|-----------|---------|
| `v-app-bar` | "Đơn Đăng Ký Chờ Duyệt" + huy hiệu số lượng |
| `v-list` / `v-list-item` | Một hàng mỗi đơn đăng ký chờ |
| `v-card` | Thẻ chi tiết đơn đăng ký |
| `v-chip` | "Chờ Duyệt" — màu hổ phách |
| `v-btn` | Duyệt (xanh) và Từ Chối (viền đỏ) mỗi mục |
| `v-dialog` | Hộp thoại từ chối với ô nhập lý do (tuỳ chọn) |
| `v-textarea` | Nhập lý do từ chối (tuỳ chọn, gửi qua email) |
| `v-empty-state` | "Không có đơn đăng ký nào đang chờ duyệt" |
| `v-snackbar` | Phản hồi "Đã duyệt" / "Đã từ chối" |

---

## 3. Bố Cục

```
┌─────────────────────────────────────────────────────┐
│  Đơn Đăng Ký Chờ Duyệt                     (3)      │  ← v-app-bar + huy hiệu
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Pho Saigon                 Gửi 2 giờ trước │    │  ← v-card
│  │  alice@example.com                           │    │
│  │  Ẩm thực: Việt Nam  |  Địa điểm: London     │    │
│  │                       [Duyệt]  [Từ Chối]    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Bun Bo Hue                 Gửi 5 giờ trước │    │
│  │  bob@example.com                             │    │
│  │  Ẩm thực: Việt Nam  |  Địa điểm: Manchester │    │
│  │                       [Duyệt]  [Từ Chối]    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 4. Trạng Thái Giao Diện

### 4.1 Đang Tải
- `v-skeleton-loader` loại `list-item-three-line` × 3

### 4.2 Hàng Đợi Trống
- `v-empty-state` — "Không có đơn đăng ký nào đang chờ duyệt 🎉"

### 4.3 Luồng Duyệt
1. Admin nhấn **Duyệt**
2. Cập nhật tức thì — hàng mờ dần và biến mất
3. `PATCH /api/admin/restaurants/{id}/status { status: 'active' }`
4. Snackbar: "Pho Saigon đã được duyệt. Chủ nhà hàng đã được thông báo qua email."
5. Huy hiệu số lượng chờ duyệt giảm đi một

### 4.4 Luồng Từ Chối
1. Admin nhấn **Từ Chối**
2. Hộp thoại mở ra:
```
Từ chối đơn đăng ký 'Pho Saigon'?

Lý do từ chối (tuỳ chọn — sẽ được gửi kèm email thông báo)
┌────────────────────────────────────────┐
│                                        │
└────────────────────────────────────────┘

[Xác Nhận Từ Chối]  [Huỷ]
```
3. `PATCH /api/admin/restaurants/{id}/status { status: 'rejected', reason? }`
4. Snackbar: "Đã từ chối đơn đăng ký của Pho Saigon."
5. Hàng bị xoá khỏi hàng đợi; huy hiệu giảm

### 4.5 Huy Hiệu Số Lượng
- Hiển thị trên app bar và thanh điều hướng admin
- Số lượng thực tế từ trường `total` của `GET /api/admin/restaurants?status=pending_approval`
- Cập nhật lại sau mỗi thao tác duyệt hoặc từ chối

---

## 5. Tương Tác

| Thao Tác | Kết Quả |
|--------|--------|
| Tải trang | `GET /api/admin/restaurants?status=pending_approval&limit=50` |
| Duyệt | `PATCH /api/admin/restaurants/{id}/status { status: 'active' }` |
| Từ chối (có/không lý do) | `PATCH /api/admin/restaurants/{id}/status { status: 'rejected', reason? }` |

---

## 6. API

```typescript
GET  /api/admin/restaurants?status=pending_approval
Phản hồi: {
  data: [{
    id, name, ownerEmail, cuisineType, location, createdAt
  }],
  total: number
}

PATCH /api/admin/restaurants/{id}/status
Body: { status: 'active' | 'rejected', reason?: string }
200:  { id, status }
```

---

## 7. Tiêu Chí Nghiệm Thu

Từ **E5 — Admin & Nền Tảng**:

- [ ] Hàng đợi chỉ hiển thị nhà hàng có trạng thái `pending_approval`, sắp xếp theo thứ tự cũ nhất trước
- [ ] Huy hiệu số lượng phản ánh đúng số đơn đăng ký đang chờ duyệt
- [ ] Admin có thể duyệt đơn đăng ký chỉ với một cú nhấp; không cần xác nhận
- [ ] Admin có thể từ chối đơn đăng ký với lý do tuỳ chọn
- [ ] Lý do từ chối được đưa vào email tự động gửi tới chủ nhà hàng
- [ ] Mục đã duyệt/từ chối biến mất khỏi hàng đợi ngay lập tức
- [ ] Trạng thái trống hiển thị khi không còn đơn đăng ký nào đang chờ duyệt
