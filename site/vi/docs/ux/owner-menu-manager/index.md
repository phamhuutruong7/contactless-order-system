# Đặc Tả UX: Chủ Quán – Quản Lý Thực Đơn

**Route:** `/owner/menu` · **Vai trò:** Chủ quán (xác thực Google OAuth) · **Epic:** E3

---

## 1. Tổng Quan

Màn hình quản lý nội dung chính dành cho chủ quán. Cho phép CRUD đầy đủ cho danh mục và món ăn, kéo-thả để sắp xếp lại thứ tự, bật/tắt trạng thái có sẵn, và tải ảnh lên. Thay đổi phản ánh tới khách hàng theo thời gian thực qua SignalR `MenuItemAvailabilityChanged`.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Tiêu đề "Quản Lý Thực Đơn" + FAB "Thêm Danh Mục" |
| `v-expansion-panels` | Một panel cho mỗi danh mục |
| `v-expansion-panel-title` | Tên danh mục + chip số lượng món + icon sửa/xoá |
| `v-expansion-panel-text` | Danh sách món có thể sắp xếp trong danh mục |
| `v-list-item` | Hàng món: ảnh nhỏ, tên, giá, công tắc có sẵn |
| `v-switch` | Bật/tắt trạng thái có sẵn (kích hoạt `MenuItemAvailabilityChanged`) |
| `v-btn icon` | Sửa món (mở dialog), Xoá món (xác nhận) |
| `v-dialog` | Form thêm/sửa danh mục + form thêm/sửa món |
| `v-text-field` | Nhập tên, mô tả, giá |
| `v-file-input` | Tải ảnh lên (JPEG/PNG, tối đa 2 MB) |
| `v-img` | Xem trước ảnh nhỏ |
| `v-snackbar` | "Đã lưu" / "Lỗi khi lưu" |
| `v-skeleton-loader` | Trong khi dữ liệu thực đơn đang tải |
| `v-empty-state` | "Chưa có món — hãy thêm danh mục đầu tiên" |

---

## 3. Bố Cục

```
┌─────────────────────────────────────────┐
│  Quản Lý Thực Đơn        [+ Danh Mục]   │  ← v-app-bar
├─────────────────────────────────────────┤
│                                         │
│  ▾ Đồ Uống  (3 món)  [Sửa] [Xoá]       │
│    ⠿  [ảnh] Cà phê Espresso  45K  ●──  │
│    ⠿  [ảnh] Cà phê Latte     55K  ●──  │
│    ⠿  [ảnh] Cold Brew        60K  ○──  │  ← đã tắt
│                              [+ Thêm Món] │
│                                         │
│  ▾ Thức Ăn  (2 món)  [Sửa] [Xoá]       │
│    ⠿  [ảnh] Bánh Mì           25K  ●──  │
│    ⠿  [ảnh] Sandwich          75K  ●──  │
│                              [+ Thêm Món] │
│                                         │
└─────────────────────────────────────────┘
```

`⠿` = tay cầm kéo để sắp xếp lại thứ tự.

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải
- `v-skeleton-loader` kiểu `list-item-avatar-three-line` lặp 4 lần

### 4.2 Đã Có Dữ Liệu
- Danh mục đóng/mở độc lập
- Công tắc có sẵn cập nhật lạc quan rồi đồng bộ

### 4.3 Trống
- `v-empty-state` kèm minh hoạ + nút "Thêm Danh Mục"

### 4.4 Dialog Form Danh Mục (Thêm / Sửa)
- Một `v-text-field` — Tên danh mục (bắt buộc)
- Nút Lưu / Huỷ

### 4.5 Dialog Form Món (Thêm / Sửa)
```
Tên          [__________________]  (bắt buộc)
Mô tả        [__________________]  (tuỳ chọn)
Giá          [__________________]  (bắt buộc, ≥ 0)
Ảnh          [Chọn file]  [xem trước]
Danh mục     (điền sẵn, chỉ đọc khi sửa)
             [Lưu]  [Huỷ]
```

### 4.6 Xác Nhận Xoá
- `v-dialog` — "Xoá 'Cold Brew'? Thao tác này không thể hoàn tác."
- Xác nhận (destructive) / Huỷ

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang | `GET /api/menu/{restaurantId}` → danh mục + món |
| Thêm danh mục | Dialog → `POST /api/menu/{restaurantId}/categories` |
| Sửa danh mục | Dialog → `PATCH /api/menu/{restaurantId}/categories/{id}` |
| Xoá danh mục | Dialog xác nhận → `DELETE /api/menu/{restaurantId}/categories/{id}` |
| Thêm món | Dialog → `POST /api/menu/{restaurantId}/items` |
| Sửa món | Dialog → `PATCH /api/menu/{restaurantId}/items/{id}` |
| Xoá món | Dialog xác nhận → `DELETE /api/menu/{restaurantId}/items/{id}` |
| Bật/tắt có sẵn | `PATCH /api/menu/{restaurantId}/items/{id}` `{ available: bool }` → phát sóng SignalR |
| Kéo-thả sắp xếp món | `PATCH /api/menu/{restaurantId}/items/{id}` `{ sortOrder: int }` |
| Kéo-thả sắp xếp danh mục | `PATCH /api/menu/{restaurantId}/categories/{id}` `{ sortOrder: int }` |

---

## 6. API

```typescript
GET    /api/menu/{restaurantId}
Response: { categories: [{ id, name, sortOrder, items: [{ id, name, description, price, imageUrl, available, sortOrder }] }] }

POST   /api/menu/{restaurantId}/categories        Body: { name, sortOrder }
PATCH  /api/menu/{restaurantId}/categories/{id}   Body: Partial<Category>
DELETE /api/menu/{restaurantId}/categories/{id}   → 204

POST   /api/menu/{restaurantId}/items             Body: { categoryId, name, description, price, imageUrl?, available }
PATCH  /api/menu/{restaurantId}/items/{id}        Body: Partial<Item>
DELETE /api/menu/{restaurantId}/items/{id}        → 204
```

Tải ảnh: `POST /api/menu/{restaurantId}/items/{id}/image` (multipart/form-data) → `{ imageUrl }`.

---

## 7. Tiêu Chí Nghiệm Thu

Từ **E3 — Quản Lý Thực Đơn**:

- [ ] Chủ quán có thể thêm, sửa, xoá danh mục với phản hồi UI ngay lập tức
- [ ] Chủ quán có thể thêm, sửa, xoá món trong bất kỳ danh mục nào
- [ ] Công tắc có sẵn phát sóng `MenuItemAvailabilityChanged` tới khách đang kết nối
- [ ] Món và danh mục có thể sắp xếp lại bằng kéo-thả
- [ ] Tải ảnh chấp nhận JPEG/PNG ≤ 2 MB; xem trước trước khi lưu
- [ ] Thay đổi chưa lưu hiển thị xác nhận khi điều hướng đi
