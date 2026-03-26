# Kiến Trúc: Luồng Đặt Hàng

**Loại:** Máy Trạng Thái + Sơ Đồ Tuần Tự · **Phạm Vi:** Toàn bộ vòng đời đơn hàng

---

## 1. Máy Trạng Thái Đơn Hàng

```mermaid
stateDiagram-v2
  [*] --> Pending : Khách gửi đơn\nPOST /api/orders
  Pending --> Received : Nhân viên xác nhận\nPATCH status=received
  Received --> Preparing : Bếp bắt đầu chế biến\nPATCH status=preparing
  Preparing --> Ready : Món đã sẵn sàng\nPATCH status=ready
  Ready --> Served : Nhân viên đánh dấu đã phục vụ\nPATCH status=served
  Served --> [*]

  Pending --> Cancelled : Nhân viên huỷ\nPATCH status=cancelled
  Received --> Cancelled : Nhân viên huỷ\nPATCH status=cancelled
  Preparing --> Cancelled : Nhân viên huỷ\nPATCH status=cancelled
```

---

## 2. Chuỗi Đặt Hàng Đầy Đủ

```mermaid
sequenceDiagram
  participant G as Khách (Trình duyệt)
  participant API as ASP.NET Core API
  participant DB as Supabase PostgreSQL
  participant HUB as SignalR OrderHub
  participant S as Nhân Viên (Trình duyệt)
  participant P as Máy In CloudPRNT

  G->>API: POST /api/orders { tableId, restaurantId, lines[] }
  API->>DB: INSERT orders + order_lines (status=pending)
  API->>HUB: Broadcast OrderReceived { orderId, tableId, lines[] }
  HUB-->>S: Sự kiện OrderReceived
  HUB-->>G: OrderReceived (xác nhận)
  API->>API: Đưa lệnh in vào hàng đợi (ESC/POS Base64)
  API-->>G: 201 { orderId, status: 'pending' }

  P->>API: GET /api/print/jobs (lấy mỗi 2–3 giây)
  API-->>P: { jobId, content: "<Base64 ESC/POS>" }
  P->>P: In biên lai
  P->>API: POST /api/print/jobs/{jobId}/ack

  S->>API: PATCH /api/orders/{id}/status { status: 'received' }
  API->>DB: UPDATE orders SET status='received'
  API->>HUB: Broadcast OrderStatusChanged { orderId, status }
  HUB-->>G: OrderStatusChanged — trình theo dõi khách cập nhật
  HUB-->>S: OrderStatusChanged — màn hình nhân viên cập nhật

  Note over S,API: Lặp lại cho preparing → ready

  S->>API: PATCH /api/orders/{id}/status { status: 'ready' }
  API->>DB: UPDATE orders SET status='ready'
  API->>HUB: Broadcast OrderStatusChanged { orderId, status: 'ready' }
  HUB-->>G: OrderStatusChanged — "Món ăn của bạn đã sẵn sàng!"

  S->>API: PATCH /api/orders/{id}/status { status: 'served' }
  API->>DB: UPDATE orders SET status='served'
```

---

## 3. Đường Dẫn Khi Lỗi In

```mermaid
sequenceDiagram
  participant API as API
  participant HUB as SignalR OrderHub
  participant O as Chủ Nhà Hàng (Trình duyệt)
  participant P as Máy In CloudPRNT

  API->>API: Lệnh in hết hạn (máy in không lấy lệnh > 5 phút)
  API->>HUB: Broadcast PrintFailed { orderId, printerId }
  HUB-->>O: PrintFailed — hiển thị cảnh báo toast
  O->>API: POST /api/print/test { printerId }
  API-->>O: 503 { error: 'Printer offline' }
```

---

## 4. Định Nghĩa Trạng Thái

| Trạng Thái | Người Thực Hiện | Ý Nghĩa |
|--------|-------|---------|
| `pending` | Hệ thống | Đơn hàng đã gửi, chờ nhân viên xác nhận |
| `received` | Nhân viên | Nhân viên đã nhìn thấy và xác nhận đơn hàng |
| `preparing` | Nhân viên | Bếp đang tích cực chế biến |
| `ready` | Nhân viên | Món đã trang trí và sẵn sàng phục vụ |
| `served` | Nhân viên | Đã mang ra bàn |
| `cancelled` | Nhân viên | Đã huỷ trước khi hoàn thành |

---

## 5. Đảm Bảo Giao Nhận Thời Gian Thực

- **SignalR với fanout nhóm** — tất cả thành viên nhóm nhận được sự kiện
- **Khả năng phục hồi khi kết nối lại** — clients đăng ký lại nhóm khi kết nối lại; composable Vue xử lý exponential backoff (1 s → 2 s → 4 s … tối đa 30 s)
- **Sự kiện bị bỏ lỡ** — khi kết nối lại, clients gọi `GET /api/orders?tableId=X&status=active` để đồng bộ lại trạng thái
