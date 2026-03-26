# Kiến Trúc: Luồng CloudPRNT

**Loại:** Sơ đồ trình tự · **Phạm vi:** Tích hợp máy in Star Micronics CloudPRNT

---

## 1. Tổng Quan Giao Thức

CloudPRNT sử dụng **giao thức server-pull**: máy in chủ động gọi đến máy chủ để lấy lệnh in. Máy chủ không gửi dữ liệu đến máy in.

```
Máy In → GET {server}/cloudprnt/queue?token={device_token}   (cứ 2–3 giây)
Máy Chủ → 200 { jobReady: true, mediaType: 'application/vnd.star.starprnt' }
Máy In → POST {server}/cloudprnt/print?token={device_token}  (lấy nội dung in)
Máy Chủ → 200 { content: '<ESC/POS bytes (base64)>' }
Máy In → POST {server}/cloudprnt/ack?token={device_token} { jobId }
```

---

## 2. Luồng In Thành Công

```mermaid
sequenceDiagram
  participant KH as Khách
  participant API as ASP.NET Core API
  participant DB as Supabase DB
  participant Q as Hàng Đợi In
  participant HUB as OrderHub
  participant PR as Máy In CloudPRNT

  KH->>API: POST /api/orders { items }
  API->>DB: INSERT order (status='pending')
  API->>Q: Thêm lệnh in vào hàng đợi
  API->>HUB: Phát sự kiện OrderReceived
  API-->>KH: 201 { orderId }

  loop Cứ 2–3 giây
    PR->>API: GET /cloudprnt/queue?token={device_token}
    alt Có lệnh in
      API-->>PR: 200 { jobReady: true }
      PR->>API: POST /cloudprnt/print?token={device_token}
      API-->>PR: Nội dung ESC/POS (base64)
      PR->>PR: In hoá đơn
      PR->>API: POST /cloudprnt/ack { jobId, status: 'ok' }
      API->>Q: Đánh dấu lệnh hoàn thành
    else Không có lệnh in
      API-->>PR: 200 { jobReady: false }
    end
  end
```

---

## 3. Luồng Máy In Không Trực Tuyến / Lệnh Hết Hạn

```mermaid
sequenceDiagram
  participant API as ASP.NET Core API
  participant Q as Hàng Đợi In
  participant HUB as OrderHub
  participant CH as Chủ Nhà Hàng

  Q->>Q: Kiểm tra định kỳ các lệnh quá hạn
  Q->>Q: Phát hiện lệnh > 5 phút chưa được xác nhận
  Q->>API: Gọi xử lý hết hạn (job timeout handler)
  API->>Q: Đánh dấu lệnh là "Thất bại"
  API->>HUB: Phát sự kiện PrintFailed { orderId, printerId, printerName }
  HUB-->>CH: Nhận thông báo PrintFailed
  CH->>CH: Hiển thị toast cảnh báo "Máy in không phản hồi"
```

---

## 4. Bảo Mật Mã Thiết Bị

| Thuộc Tính | Chi Tiết |
|-----------|---------|
| Định dạng | UUID v4 (ví dụ: `a1b2c3d4-…`) |
| Hiển thị trong UI | 6 ký tự đầu + `…` (ví dụ: `a1b2c3…`) |
| Truyền tải | Chỉ qua HTTPS; đoạn URL, không phải query string |
| Tái tạo | `POST /api/printers/{id}/regenerate-token` — Owner only |
| Lưu trữ | `printers.device_token` — plaintext UUID (không nhạy cảm nếu chỉ qua HTTPS) |

> Không bao giờ hiển thị mã thiết bị đầy đủ trong log hoặc URL trong trình duyệt.

---

## 5. Định Dạng Hoá Đơn ESC/POS

```
============================================
         TÊN NHÀ HÀNG
         Địa Chỉ
         Điện Thoại
============================================
Bàn: Bàn 4                DD/MM/YYYY HH:mm
--------------------------------------------
ITEM NAME                               qty
  + Tùy chọn                               x
                                    VND xxx
--------------------------------------------
TỔNG CỘNG                        VND x,xxx
============================================
         Cảm ơn quý khách!
============================================
```

Nội dung được mã hoá **base64** trong phản hồi CloudPRNT và giải mã bởi firmware máy in.

---

## 6. Trạng Thái Máy In

| Trạng Thái | Điều Kiện | Màu Hiển Thị |
|-----------|----------|-------------|
| Trực Tuyến | `last_seen_at` < 60 giây trước | Xanh lá |
| Không Hoạt Động | `last_seen_at` từ 1–5 phút trước | Vàng |
| Ngoại Tuyến | `last_seen_at` > 5 phút trước | Đỏ |

`last_seen_at` được cập nhật mỗi khi máy in gọi đến endpoint `/cloudprnt/queue`.

---

## 7. Lưu Ý Phiên Bản 1

Trong phiên bản 1: **tất cả máy in** của một nhà hàng đều nhận cùng một bản sao lệnh in. Tính năng phân luồng (ví dụ: đồ uống đến quầy bar, món ăn đến bếp) sẽ được triển khai trong phiên bản sau.
