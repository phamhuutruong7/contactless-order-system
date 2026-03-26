# UX Spec: Chi Tiết Món Ăn (Khách)

**Route:** `/menu/:restaurantId/item/:itemId` · **Vai trò:** Khách (ẩn danh) · **Epic:** E1

---

## 1. Tổng Quan

Màn hình hiển thị ảnh đầy đủ của món, mô tả và tất cả các nhóm bổ sung tùy chọn. Điều kiện bắt buộc để thêm vào giỏ hàng: tất cả nhóm bổ sung bắt buộc phải có lựa chọn hợp lệ. Giá cập nhật theo thời gian thực khi người dùng chọn các bổ sung.

---

## 2. Danh Sách Component

| Component | Mục đích |
|-----------|---------|
| `v-app-bar` | Nút quay lại + tên món |
| `v-img` | Ảnh hero đầy đủ chiều rộng (tỷ lệ 16:9, phủ kín) |
| `v-card` | Container thông tin môn + các nhóm bổ sung |
| `v-card-title` | Tên món |
| `v-card-subtitle` | Mô tả |
| `v-divider` | Phân cách mô tả và phần bổ sung |
| `v-list` + `v-list-item` | Từng tùy chọn bổ sung |
| `v-radio-group` + `v-radio` | Nhóm bổ sung "chọn 1" (bắt buộc hoặc tự chọn) |
| `v-checkbox` | Nhóm bổ sung nhiều lựa chọn |
| `v-chip` | Nhãn "Bắt buộc" / "Tùy chọn" trên tiêu đề nhóm |
| `v-counter` | Bộ đếm số lượng (−, số, +) |
| `v-textarea` | Ghi chú đặc biệt (tùy chọn, tối đa 200 ký tự) |
| `v-btn` (block + elevation-2) | Nút CTA "Thêm vào giỏ" cố định ở cuối |
| `v-progress-circular` | Spinner khi tải trang |

---

## 3. Bố Cục

```
┌────────────────────────────────┐
│ [←] Tên Món                   │  ← v-app-bar
├────────────────────────────────┤
│                                │
│  [      Ảnh Hero Món       ]   │  ← v-img (16:9, lazy)
│                                │
│  Tên Món           $0.00       │  ← v-card-title + giá (cập nhật động)
│  Mô tả ngắn...                 │  ← v-card-subtitle
│  ─────────────────────────     │
│  [Bắt buộc] Kích Thước         │  ← tiêu đề nhóm + chip
│    ○ Nhỏ                       │
│    ○ Vừa  +$0.50               │
│    ○ Lớn  +$1.00               │
│  ─────────────────────────     │
│  [Tuỳ chọn] Topping Thêm       │
│    ☐ Phô mai thêm   +$0.50     │
│    ☐ Sốt đặc biệt  +$0.30     │
│  ─────────────────────────     │
│  Ghi chú (tùy chọn)            │
│  [Dị ứng, yêu cầu đặc biệt]   │
│  ─────────────────────────     │
│  Số lượng: [−] 1 [+]           │
│                                │
│  [   Thêm vào giỏ — $0.00   ] │  ← v-btn cố định cuối
└────────────────────────────────┘
```

---

## 4. Trạng Thái UI

### 4.1 Đang Tải
- `v-progress-circular` toàn màn hình khi tải dữ liệu

### 4.2 Thành Công
- Tất cả nhóm bổ sung hiển thị theo thứ tự từ API
- Ngay lập tức sau khi load: các nhóm radio không có gì được chọn; nút "Thêm vào giỏ" bị disabled cho đến khi tất cả nhóm bắt buộc được chọn

### 4.3 Cập Nhật Giá Động
- Giá hiển thị trên tiêu đề + nút CTA: `basePrice + sum(selectedModifierDeltas) × quantity`
- Cập nhật theo thời gian thực khi người dùng thay đổi lựa chọn hoặc số lượng

### 4.4 Lỗi Xác Nhận
- Nếu nhấn "Thêm vào giỏ" khi chưa chọn đủ nhóm bắt buộc: cuộn đến nhóm thiếu + highlight đỏ tiêu đề nhóm
- Ghi chú vượt 200 ký tự: ký tự đếm chuyển đỏ + nút CTA disabled

### 4.5 Món Hết Hàng
- Hiển thị `v-chip` màu đỏ "Hết Hàng" + tất cả input disabled + nút CTA ẩn

---

## 5. Tương Tác

| Hành động | Phản hồi |
|-----------|---------|
| Nhấn [←] | Quay lại màn hình duyệt menu |
| Chọn radio | Giá cập nhật ngay lập tức |
| Tick/bỏ tick checkbox | Giá cập nhật; kiểm tra giới hạn `maxSelections` |
| Nhấn [−] số lượng (min=1) | Không cho xuống dưới 1 |
| Nhấn [+] số lượng (max=20) | Nhấn thêm khi đạt max không có tác dụng |
| Nhấn "Thêm vào giỏ" (hợp lệ) | Thêm item vào Pinia cart store + quay lại menu + `v-snackbar` xác nhận |
| Nhấn "Thêm vào giỏ" (chưa đủ) | Cuộn + highlight nhóm bắt buộc chưa chọn |

---

## 6. Dữ Liệu & API

```typescript
// useMenuStore — item detail đã được tải sẵn trong danh sách menu
// Không cần API call thêm nếu menu đã được cache
Interface CartItem {
  itemId: string
  name: string
  quantity: number
  unitPriceEurCents: number  // base + modifiers
  selectedModifiers: ModifierOption[]
  note: string
}
// useCartStore().addItem(CartItem) → cập nhật Pinia state
```

---

## 7. Tiêu Chí Chấp Thuận

Từ **E1 — Luồng Đặt Món Khách**:

- [ ] Tất cả nhóm bổ sung hiển thị với nhãn bắt buộc/tùy chọn rõ ràng
- [ ] Không thể thêm vào giỏ nếu nhóm bắt buộc chưa chọn
- [ ] Giá tự động cộng thêm giá bổ sung được chọn
- [ ] Bộ đếm số lượng giới hạn từ 1 đến 20
- [ ] Ghi chú đặc biệt được lưu cùng dòng đơn hàng
