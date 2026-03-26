# Đặc Tả UX: Admin – Quản Lý Tenant

**Route:** `/admin/tenants` · **Vai trò:** Admin (tài khoản seeded) · **Epic:** E5

---

## 1. Tổng Quan

Cung cấp cho admin một danh sách phân trang tất cả nhà hàng đã đăng ký trên nền tảng. Admin có thể phê duyệt đăng ký mới, đình chỉ tenant đang hoạt động và kích hoạt lại các tenant bị đình chỉ.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | "Quản Lý Tenant" + ô tìm kiếm |
| `v-data-table` | Danh sách nhà hàng phân trang |
| `v-chip` | Trạng thái: Hoạt Động (xanh) / Chờ Duyệt (vàng) / Đình Chỉ (đỏ) |
| `v-btn` | Nút hành động mỗi dòng: Duyệt / Đình Chỉ / Kích Hoạt |
| `v-dialog` | Xác nhận cho thao tác Đình Chỉ và Kích Hoạt |
| `v-text-field` | Tìm kiếm theo tên nhà hàng / email chủ quán |
| `v-select` | Lọc theo trạng thái |
| `v-snackbar` | Xác nhận hành động và thông báo lỗi |

---

## 3. Bố Cục

```
┌─────────────────────────────────────────────────────────────────┐
│  Quản Lý Tenant                     [Tìm kiếm…] [Trạng Thái ▾] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────┬──────────────┬───────────────┬──────────────┬────────┐  │
│  │ ID │ Nhà Hàng     │ Email Chủ     │ Trạng Thái   │ Thao T.│  │
│  ├────┼──────────────┼───────────────┼──────────────┼────────┤  │
│  │  1 │ Phở Sài Gòn  │ alice@...     │ ● Hoạt Động  │[ĐC]    │  │
│  │  2 │ Bún Bò Huế   │ bob@...       │ ⏳ Chờ Duyệt  │[Duyệt] │  │
│  │  3 │ Cơm Tấm Vy   │ carol@...     │ ✕ Đình Chỉ   │[KH]    │  │
│  └────┴──────────────┴───────────────┴──────────────┴────────┘  │
│                                                                 │
│  Mỗi trang: [10 ▾]              1–3 / 47   [< >]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Các Trạng Thái UI

### 4.1 Đang Tải
- `v-skeleton-loader` kiểu `table-row` × 5

### 4.2 Trống / Không Có Kết Quả
- "Không tìm thấy tenant nào phù hợp với bộ lọc."

### 4.3 Chip Trạng Thái

| Trạng thái | Màu chip | Nhãn |
|------------|----------|------|
| `active` | Xanh lá | Hoạt Động |
| `pending_approval` | Vàng | Chờ Duyệt |
| `suspended` | Đỏ | Đình Chỉ |

### 4.4 Nút Hành Động (mỗi dòng)

| Trạng thái hiện tại | Nút hiển thị | API |
|---------------------|-------------|-----|
| `pending_approval` | Duyệt | `PATCH /api/admin/restaurants/{id}/status` `{ status: 'active' }` |
| `active` | Đình Chỉ | `PATCH /api/admin/restaurants/{id}/status` `{ status: 'suspended' }` |
| `suspended` | Kích Hoạt | `PATCH /api/admin/restaurants/{id}/status` `{ status: 'active' }` |

### 4.5 Dialog Xác Nhận

**Đình Chỉ:**
> "Đình chỉ 'Phở Sài Gòn'? Chủ quán và nhân viên sẽ không thể đăng nhập cho đến khi được kích hoạt lại."
> [Đình Chỉ] [Huỷ]

**Kích Hoạt:**
> "Kích hoạt lại 'Cơm Tấm Vy'? Chủ quán sẽ có toàn quyền truy cập ngay lập tức."
> [Kích Hoạt] [Huỷ]

Thao tác Duyệt không cần xác nhận — đây là hành động bổ sung ít rủi ro.

### 4.6 Tìm Kiếm & Lọc
- Ô tìm kiếm truy vấn theo tên nhà hàng hoặc email chủ quán
- Dropdown lọc trạng thái: Tất cả / Hoạt Động / Chờ Duyệt / Đình Chỉ
- Cả hai bộ lọc kết hợp với nhau; bảng cập nhật ngay khi thay đổi

---

## 5. Tương Tác

| Hành động | Kết quả |
|-----------|---------|
| Tải trang | `GET /api/admin/restaurants?page=1&limit=10` |
| Đổi trang / kích thước trang | `GET /api/admin/restaurants?page={n}&limit={size}` |
| Tìm kiếm | `GET /api/admin/restaurants?search={q}` |
| Lọc theo trạng thái | `GET /api/admin/restaurants?status={status}` |
| Duyệt | `PATCH /api/admin/restaurants/{id}/status { status:'active' }` |
| Đình chỉ (đã xác nhận) | `PATCH /api/admin/restaurants/{id}/status { status:'suspended' }` |
| Kích hoạt (đã xác nhận) | `PATCH /api/admin/restaurants/{id}/status { status:'active' }` |

---

## 6. API

```typescript
GET  /api/admin/restaurants
Query: { page?, limit?, search?, status? }
Response: {
  data: [{ id, name, ownerEmail, status, createdAt }],
  total: number,
  page:  number,
  limit: number
}

PATCH /api/admin/restaurants/{id}/status
Body: { status: 'active' | 'suspended' }
200:  { id, status }
```

---

## 7. Tiêu Chí Nghiệm Thu

Từ **E5 — Admin & Nền Tảng**:

- [ ] Admin có thể xem tất cả nhà hàng với phân trang (10/25/50 mỗi trang)
- [ ] Admin có thể lọc tenant theo trạng thái và tìm kiếm theo tên hoặc email
- [ ] Admin có thể duyệt, đình chỉ và kích hoạt lại tenant
- [ ] Thao tác Đình Chỉ yêu cầu xác nhận; Duyệt thì không
- [ ] Thay đổi trạng thái phản ánh ngay lập tức trên dòng bảng
- [ ] Chủ quán và nhân viên của tenant bị đình chỉ nhận 401/403 trên tất cả các yêu cầu xác thực
