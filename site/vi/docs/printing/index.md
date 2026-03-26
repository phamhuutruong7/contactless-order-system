# Hướng Dẫn Tích Hợp CloudPRNT

## Tổng Quan

**Star mC-Print3** sử dụng giao thức **CloudPRNT** — giao thức in do Star Micronics phát triển, nơi **máy in tự động kết nối đến server** để hỏi _"Server có lệnh in nào cho tôi không?"_ mỗi 2–3 giây.

Ưu điểm chính:
- **Không cần phần mềm cục bộ** — không cần driver, không cần middleware, không cần server nội bộ
- **Hoạt động qua tường lửa** — máy in chỉ cần kết nối HTTPS chiều ra
- **Không mất lệnh in** — lệnh in lưu trong database cho đến khi được giao
- **Hỗ trợ nhiều chi nhánh** — mỗi máy in có device token riêng; server định tuyến đúng lệnh

---

## Cài Đặt Phần Cứng

Mỗi nhà hàng thường cần **hai máy in**: một cho bếp (đồ ăn) và một cho quầy bar (đồ uống).

### Bước 1 — Kết nối máy in

1. Kết nối Star mC-Print3 vào mạng nhà hàng qua **Ethernet** (khuyến khích) hoặc Wi-Fi
2. Bật máy in — máy sẽ in tờ trạng thái hiển thị **địa chỉ IP**
3. Mở trình duyệt, truy cập `http://<ip-máy-in>` để vào trang quản trị máy in

### Bước 2 — Cấu hình CloudPRNT trong trang quản trị

1. Chuyển đến mục **CloudPRNT**
2. Đặt **Server URL** thành:
   ```
   https://api.yourdomain.com/api/print/cloudprnt
   ```
3. Đặt **Device Token** thành token bếp hoặc bar (lấy từ Dashboard của chủ nhà hàng — xem bên dưới)
4. Bật CloudPRNT và **Lưu**

Máy in sẽ bắt đầu polling server ngay lập tức.

---

## Đăng Ký Device Token

Trước khi cấu hình phần cứng, chủ nhà hàng đăng ký cả hai token trong **Owner Dashboard**:

1. Đăng nhập vào Owner Dashboard
2. Vào **Cài đặt → Thiết bị**
3. Nhập hoặc tạo `kitchen_device_token` và `bar_device_token`
4. Lưu — các token này được lưu trong bản ghi `Restaurant` trong database

Sau đó nhập token vào trang quản trị của từng máy in tương ứng.

---

## Luồng Giao Tiếp Đầy Đủ

```
Máy in                           Backend API                         Database
  |                                    |                                  |
  |-- POST /api/print/cloudprnt ------>|                                  |
  |   { statusCode:200,                |                                  |
  |     jobToken: null }               |-- SELECT * FROM print_jobs ----->|
  |                                    |   WHERE device_token = ?         |
  |                                    |   AND status = 'pending' LIMIT 1 |
  |                                    |<-- (không có hàng) --------------|
  |<-- { jobReady: false } ------------|                                  |
  |                                    |                                  |
  |  (chờ 2–3 giây)                    |                                  |
  |                                    |                                  |
  |-- POST /api/print/cloudprnt ------>|                                  |
  |   { statusCode:200,                |                                  |
  |     jobToken: null }               |-- SELECT * FROM print_jobs ----->|
  |                                    |   WHERE device_token = ?         |
  |                                    |   AND status = 'pending' LIMIT 1 |
  |                                    |<-- (1 hàng: job uuid-1234) ------|
  |<-- { jobReady: true,               |                                  |
  |      mediaTypes: [                 |                                  |
  |        "application/vnd.star.      |                                  |
  |         starprnt"],                |                                  |
  |      jobToken: "uuid-1234" } ------|                                  |
  |                                    |                                  |
  |-- GET /api/print/job/uuid-1234 --->|                                  |
  |                                    |-- SELECT payload_base64 -------->|
  |                                    |   FROM print_jobs WHERE id=uuid  |
  |                                    |<-- (dữ liệu base64 ESC/POS) -----|
  |<-- (dữ liệu ESC/POS nhị phân) -----|                                  |
  |                                    |                                  |
  |  (máy in in hóa đơn)               |                                  |
  |                                    |                                  |
  |-- POST /api/print/delete/uuid ---->|                                  |
  |                                    |-- UPDATE print_jobs ------------>|
  |                                    |   SET status = 'completed',      |
  |                                    |   completed_at = NOW()           |
  |<-- 200 OK --------------------------|                                  |
```

### Giải Thích Từng Bước

| Bước | Bên thực hiện | Hành động |
|------|---------------|-----------|
| 1 | Máy in | POST đến `/api/print/cloudprnt` với `{ statusCode: 200, jobToken: null }` |
| 2 | Backend | Truy vấn `print_jobs` tìm lệnh `pending` khớp với device token của máy in |
| 3a | Backend | **Không có lệnh**: trả về `{ jobReady: false }` — máy in chờ và poll lại |
| 3b | Backend | **Có lệnh**: trả về `{ jobReady: true, mediaTypes: [...], jobToken: "uuid" }` |
| 4 | Máy in | GET `/api/print/job/{jobToken}` để tải dữ liệu in |
| 5 | Backend | Trả về dữ liệu ESC/POS nhị phân (giải mã từ Base64) |
| 6 | Máy in | In hóa đơn |
| 7 | Máy in | POST đến `/api/print/delete/{jobToken}` để xác nhận đã in |
| 8 | Backend | Đánh dấu lệnh in là `status = 'completed'` trong database |

---

## Các API Endpoint Của Backend

### `POST /api/print/cloudprnt`
Endpoint polling. Máy in gọi mỗi 2–3 giây.

**Request body (từ máy in):**
```json
{
  "statusCode": 200,
  "jobToken": null,
  "clientAction": []
}
```

**Phản hồi khi không có lệnh:**
```json
{ "jobReady": false }
```

**Phản hồi khi có lệnh:**
```json
{
  "jobReady": true,
  "mediaTypes": ["application/vnd.star.starprnt"],
  "jobToken": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

### `GET /api/print/job/{jobToken}`
Trả về dữ liệu in cho job token cụ thể.

- **Content-Type**: `application/vnd.star.starprnt`
- **Body**: Dữ liệu nhị phân ESC/POS (giải mã từ `payload_base64`)

---

### `DELETE /api/print/delete/{jobToken}`
Xác nhận máy in đã in xong. Backend cập nhật `status = 'completed'`.

---

## Cấu Trúc Database — Bảng `print_jobs`

```sql
CREATE TABLE print_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id),
  device_token    VARCHAR(255) NOT NULL,
  order_id        UUID REFERENCES orders(id),
  payload_base64  TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
                  -- giá trị: 'pending' | 'completed' | 'failed'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_print_jobs_device_token_status
  ON print_jobs (device_token, status);
```

> **Logic định tuyến**: Khi có đơn hàng mới, backend tạo hai lệnh in — một với `device_token = kitchen_device_token` (chỉ đồ ăn) và một với `device_token = bar_device_token` (chỉ đồ uống). Mỗi máy in chỉ nhìn thấy lệnh của mình.

---

## Nội Dung Hóa Đơn In

### Phiếu Bếp
```
==========================
  BÀN 5      ĐƠN #1042
==========================
2x Pizza Margherita
   - Thêm phô mai
1x Salad Caesar
   - Không crouton
--------------------------
Ghi chú: Dị ứng đậu phộng
==========================
  12:34  26/03/2026
==========================
```

### Phiếu Bar
```
==========================
  BÀN 5      ĐƠN #1042
==========================
2x Bia Saigon
1x Coca-Cola (không đá)
1x Nước chanh tươi
==========================
  12:34  26/03/2026
==========================
```

---

## Xử Lý Lỗi & Thử Lại

| Tình huống | Xử lý |
|-----------|-------|
| Máy in mất điện / offline | Lệnh in vẫn ở trạng thái `pending` — được giao khi máy in hoạt động lại |
| Không nhận xác nhận trong **30 giây** | Lệnh được đưa lại vào hàng đợi (status reset về `pending`) |
| Backend trả về lỗi `500` | Máy in thử lại ở chu kỳ poll tiếp theo |
| Dữ liệu lệnh in bị hỏng | Đặt status `failed`; ghi log cảnh báo; không tự thử lại |
| Mất điện trong khi in | Bảo vệ trùng lặp: kiểm tra `completed_at` trước khi giao lại |

---

## Yêu Cầu Mạng

| Yêu cầu | Chi tiết |
|---------|----------|
| Chiều kết nối | Chỉ cần HTTPS chiều ra (port 443) từ máy in đến server |
| IP tĩnh | **Không bắt buộc** cho máy in |
| Server nội bộ | **Không cần** — không cần middleware hay ứng dụng cùng mạng |
| Loại kết nối | WiFi hoặc Ethernet; Ethernet khuyến khích cho độ ổn định cao |

---

## Xử Lý Sự Cố

**Máy in đang poll nhưng không nhận được lệnh in**
- Kiểm tra `device_token` trong trang quản trị máy in có khớp chính xác với giá trị lưu trong bản ghi `Restaurant` không
- Kiểm tra bảng `print_jobs` — có hàng nào với `status = 'pending'` cho device token này không?

**Lệnh in luôn ở trạng thái `pending`**
- Kiểm tra `GET /api/print/job/{jobToken}` có trả về dữ liệu nhị phân hợp lệ không
- Xác nhận `Content-Type` mà máy in chấp nhận khớp với `application/vnd.star.starprnt`

**In bị trùng lặp**
- Đảm bảo `POST /api/print/delete/{jobToken}` là idempotent — đánh dấu lại lệnh đã `completed` phải trả về `200` mà không gây lỗi
