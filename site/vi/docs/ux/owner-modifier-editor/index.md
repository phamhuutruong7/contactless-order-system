# Đặc Tả UX: Chủ Quán – Trình Soạn Thảo Tùy Chọn Thêm

**Route:** `/owner/modifiers` · **Vai trò:** Chủ quán (xác thực Google OAuth) · **Epic:** E3

---

## 1. Tổng Quan

Cho phép chủ quán định nghĩa các nhóm tùy chọn thêm (ví dụ: "Loại sữa", "Thêm topping") và liên kết chúng với món trong thực đơn. Mỗi nhóm có tên, cờ bắt buộc/tuỳ chọn, số lượng lựa chọn tối thiểu/tối đa, và danh sách có thứ tự các lựa chọn kèm giá bổ sung.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | "Tùy Chọn Thêm" + nút "Thêm Nhóm" |
| `v-expansion-panels` | Một panel cho mỗi nhóm tùy chọn |
| `v-expansion-panel-title` | Tên nhóm + tóm tắt quy tắc chọn + icon sửa/xoá |
| `v-expansion-panel-text` | Danh sách lựa chọn có thể sắp xếp |
| `v-list-item` | Hàng lựa chọn: tên, giá bổ sung (±), tay cầm kéo, icon xoá |
| `v-text-field` | Tên lựa chọn + giá bổ sung |
| `v-btn` | "Thêm Lựa Chọn" trong mỗi nhóm |
| `v-dialog` | Form thêm/sửa nhóm |
| `v-select` | Chọn số lượng tối thiểu/tối đa trong form nhóm |
| `v-switch` | Bật/tắt "Bắt buộc" trong form nhóm |
| `v-snackbar` | "Đã lưu" / thông báo lỗi |
| `v-empty-state` | "Chưa có nhóm tùy chọn nào" |

---

## 3. Bố Cục

```
┌──────────────────────────────────────────┐
│  Tùy Chọn Thêm              [+ Thêm Nhóm] │  ← v-app-bar
├──────────────────────────────────────────┤
│                                          │
│  ▾ Loại Sữa  (chọn đúng 1 loại)         │
│    [Sửa] [Xoá]                           │
│    ⠿  Sữa Tươi         +0đ              │
│    ⠿  Sữa Yến Mạch     +5,000đ          │
│    ⠿  Sữa Đậu Nành     +5,000đ          │
│                          [+ Thêm Lựa Chọn] │
│                                          │
│  ▾ Topping  (chọn 0–3 loại)              │
│    [Sửa] [Xoá]                           │
│    ⠿  Thêm Shot        +8,000đ           │
│    ⠿  Siro             +4,000đ           │
│                          [+ Thêm Lựa Chọn] │
│                                          │
└──────────────────────────────────────────┘
```

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải
- `v-skeleton-loader` trong khi tải dữ liệu nhóm tùy chọn

### 4.2 Dialog Form Nhóm (Thêm / Sửa)
```
Tên nhóm       [____________________]  (bắt buộc)
Bắt buộc?      [○ Không  ● Có]         (v-switch)
Chọn tối thiểu [1 ▾]
Chọn tối đa    [1 ▾]
               [Lưu]  [Huỷ]
```
Kiểm tra: tối đa ≥ tối thiểu; nếu bắt buộc, tối thiểu ≥ 1.

### 4.3 Thêm Lựa Chọn Inline
- Nhấn "Thêm Lựa Chọn" thêm hàng có thể chỉnh sửa ở cuối nhóm
- Hàng gồm: ô tên, ô giá bổ sung (± prefix), nút tick xác nhận, X huỷ

### 4.4 Sửa Lựa Chọn
- Nhấn vào hàng lựa chọn → bật chỉnh sửa inline (cùng các trường)

### 4.5 Xác Nhận Xoá
- `v-dialog` — khi xoá nhóm (kéo theo tất cả lựa chọn)
- Xoá lựa chọn đơn lẻ không cần dialog (nút X inline, khôi phục qua snackbar)

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang | `GET /api/menu/{restaurantId}/modifier-groups` |
| Thêm nhóm | Lưu dialog → `POST /api/menu/{restaurantId}/modifier-groups` |
| Sửa nhóm | Lưu dialog → `PATCH /api/menu/{restaurantId}/modifier-groups/{id}` |
| Xoá nhóm | Xác nhận → `DELETE /api/menu/{restaurantId}/modifier-groups/{id}` |
| Thêm lựa chọn | Lưu inline → `POST /api/menu/{restaurantId}/modifier-groups/{id}/options` |
| Sửa lựa chọn | Lưu inline → `PATCH …/options/{id}` |
| Xoá lựa chọn | X inline → `DELETE …/options/{id}` + snackbar hoàn tác (5 giây) |
| Kéo-thả lựa chọn | `PATCH …/options/{id}` `{ sortOrder: int }` |

---

## 6. API

```typescript
GET    /api/menu/{restaurantId}/modifier-groups
Response: [{ id, name, required, min, max, options: [{ id, name, priceDelta, sortOrder }] }]

POST   /api/menu/{restaurantId}/modifier-groups
Body:  { name, required: bool, min: int, max: int }

PATCH  /api/menu/{restaurantId}/modifier-groups/{id}
Body:  Partial<ModifierGroup>

DELETE /api/menu/{restaurantId}/modifier-groups/{id}   → 204

POST   /api/menu/{restaurantId}/modifier-groups/{id}/options
Body:  { name, priceDelta: number, sortOrder: int }

PATCH  /api/menu/{restaurantId}/modifier-groups/{id}/options/{optId}
Body:  Partial<Option>

DELETE /api/menu/{restaurantId}/modifier-groups/{id}/options/{optId}  → 204
```

---

## 7. Tiêu Chí Nghiệm Thu

Từ **E3 — Quản Lý Thực Đơn**:

- [ ] Chủ quán tạo được nhóm tùy chọn với tên, cờ bắt buộc, số lượng tối thiểu/tối đa
- [ ] Chủ quán có thể thêm, đổi tên, đổi giá, sắp xếp lại và xoá lựa chọn trong nhóm
- [ ] Xoá nhóm cảnh báo rằng tất cả lựa chọn sẽ bị xoá
- [ ] Xoá lựa chọn đơn lẻ hỗ trợ hoàn tác 5 giây qua snackbar
- [ ] Kiểm tra tối thiểu/tối đa ngăn lưu khi cấu hình không hợp lệ
