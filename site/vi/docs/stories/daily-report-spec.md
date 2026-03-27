# Báo cáo doanh thu ngày — Đặc tả chi tiết

**Epic:** E9 — Dashboard chủ nhà hàng & Báo cáo  
**Story:** Chủ xem báo cáo doanh thu ngày  
**Cập nhật lần cuối:** Tháng 3 năm 2026

---

## Tổng quan

Chủ nhà hàng cần bảng tổng kết doanh thu cuối ngày để đối chiếu. Báo cáo hiển thị từng món ăn đã bán trong ngày (trừ đơn hủy), phân nhóm và tính thành tiền, với tổng doanh thu ở cuối. Chủ nhà hàng có thể xuất báo cáo dưới dạng PDF có định dạng chuyên nghiệp trực tiếp từ dashboard.

**Trường hợp sử dụng:**
- Đối chiếu doanh thu cuối ngày
- Xem doanh thu trong ngày đã qua
- Gửi PDF cho kế toán

---

## Thư viện PDF được đề xuất

Sau khi đánh giá các thư viện tạo PDF chính trong C#, **QuestPDF** được chọn.

| Thư viện | Giấy phép | .NET 10 | Docker | Ghi chú |
|----------|-----------|---------|--------|---------|
| **QuestPDF** | ✅ MIT (miễn phí doanh thu < $1M) | ✅ | ✅ Không phụ thuộc native | API C# dạng fluent; phù hợp cho bảng biểu |
| iText 7 | ⚠️ AGPL (SaaS cần giấy phép thương mại) | ✅ | ✅ | Rủi ro pháp lý với SaaS đa tenant |
| PdfPig | ✅ Apache 2.0 | ✅ | ✅ | Chủ yếu đọc PDF; API layout hạn chế |
| Wkhtmltopdf wrapper | ✅ MIT | ✅ | ⚠️ Cần Chromium (~150 MB) | Image Docker cồng kềnh |
| RDLC / SSRS | ✅ MIT | ❌ Không hỗ trợ .NET 10 | ❌ | Thực tế đã ngừng phát triển |

### Lý do chọn QuestPDF

- **Giấy phép MIT** — không có rủi ro pháp lý khi doanh thu tháng dưới $1 triệu (bao phủ toàn bộ giai đoạn khởi nghiệp)
- **Không có phụ thuộc runtime** — thư viện .NET thuần túy; không cần Chromium hay thư viện native; Docker image gọn nhẹ
- **API bảng dạng fluent** — `Table()` với `ColumnsDefinition` → `Cell()` ánh xạ trực tiếp vào layout báo cáo
- **Được duy trì tích cực** — phát hành thường xuyên, xác nhận tương thích .NET 10

**Gói NuGet:** `QuestPDF`  
**Tài liệu:** https://www.questpdf.com/quick-start.html

---

## Mẫu bất đồng bộ: Stream đồng bộ (Được chọn)

Ba phương án đã được đánh giá:

| Lựa chọn | Mô tả | Kết luận |
|----------|-------|----------|
| **A — Stream đồng bộ** | POST → truy vấn DB → tạo PDF trong `MemoryStream` → trả về `FileContentResult` | ✅ **Được chọn** |
| B — Background job (Hangfire) | POST đưa job vào hàng đợi → poll/trả URL tải xuống | ❌ Quá phức tạp; thêm phụ thuộc hạ tầng cho thao tác ~2-3 giây |
| C — SignalR push | POST đưa job vào hàng đợi → server đẩy URL qua hub | 🔄 Hướng nâng cấp tương lai nếu báo cáo trở nên chậm |

**Lý do chọn Phương án A:** Truy vấn (một round-trip DB với JOIN và GROUP BY, giới hạn trong một ngày) mất ~1 giây. QuestPDF render bảng nhỏ trong < 1 giây. Tổng độ trễ ~2–3 giây là chấp nhận được trong dashboard chủ. Spinner trên nút cung cấp phản hồi đủ cho người dùng.

---

## Đặc tả API

```
POST /api/restaurants/{restaurantId}/reports/daily/pdf?date=YYYY-MM-DD
```

### Xác thực & Phân quyền

| Vấn đề | Quy tắc |
|--------|---------|
| Xác thực | Cần Bearer JWT (`Authorization: Bearer <token>`) |
| Vai trò | Cần claim `owner` |
| Cô lập tenant | `restaurantId` trong URL **phải** khớp với claim `restaurant_id` trong JWT → `403 Forbidden` nếu không khớp (bảo vệ OWASP A01 IDOR) |

### Tham số truy vấn

| Tham số | Kiểu | Bắt buộc | Mặc định | Ghi chú |
|---------|------|----------|----------|---------|
| `date` | `string` | Không | Hôm nay (UTC) | Định dạng: `YYYY-MM-DD` |

### SQL (giả lập)

```sql
SELECT
    ol.item_name_snapshot   AS item_name,
    ol.unit_price_snapshot  AS unit_price,
    SUM(ol.quantity)        AS qty_ordered,
    SUM(ol.quantity * ol.unit_price_snapshot) AS subtotal
FROM orders o
JOIN order_lines ol ON ol.order_id = o.id
WHERE o.restaurant_id = :restaurantId
  AND o.status <> 'cancelled'
  AND DATE(o.created_at AT TIME ZONE 'UTC') = :date
GROUP BY ol.item_name_snapshot, ol.unit_price_snapshot
ORDER BY qty_ordered DESC;
```

> Không cần thay đổi schema — `item_name_snapshot`, `unit_price_snapshot` và `quantity` đã có sẵn trong `order_lines`.

### Phản hồi

| Trường hợp | HTTP | Content-Type | Nội dung |
|-----------|------|--------------|----------|
| Có dữ liệu | 200 | `application/pdf` | File PDF nhị phân; `Content-Disposition: attachment; filename="sales-{date}.pdf"` |
| Không có đơn hàng trong ngày | 200 | `application/pdf` | PDF với thông báo "Không có đơn hàng được ghi nhận cho ngày này" |
| Không khớp tenant | 403 | `application/json` | `{ "error": "Forbidden" }` |
| Chưa xác thực | 401 | `application/json` | 401 chuẩn |

---

## Bố cục nội dung PDF

```
┌────────────────────────────────────────────────────────┐
│  [Tên nhà hàng]                                         │
│  Báo cáo doanh thu ngày — 2026-03-27                    │
├────────────────┬──────────────┬────────────┬───────────┤
│  Tên món       │  Đơn giá     │  Số lượng  │  Thành    │
│                │              │  đã bán    │  tiền     │
├────────────────┼──────────────┼────────────┼───────────┤
│  Phở bò        │     €8.50    │     12     │  €102.00  │
│  Chả giò       │     €5.00    │      8     │   €40.00  │
│  ...           │              │            │           │
├────────────────┴──────────────┴────────────┼───────────┤
│  Tổng doanh thu ước tính                   │  €142.00  │
└────────────────────────────────────────────┴───────────┘

  Tạo bởi ContactlessOrderSystem • {thời gian UTC}
```

**Đơn vị tiền tệ:** Euro (€) — khớp với giá trị `unit_price_snapshot` hiện có trong DB  
**Sắp xếp:** Hàng được sắp xếp theo `qty_ordered` giảm dần  
**Tên file:** `sales-{date}.pdf` (ví dụ: `sales-2026-03-27.pdf`)

---

## Đặc tả UX phần giao diện

**Component:** `src/Frontend/src/pages/owner/DailyReport.vue`

### Bố cục

```
[ Bộ chọn ngày (mặc định: hôm nay) ]  [ Xuất PDF 🧾 ]

┌──────────────────────────────────────────────────────┐
│  Tên món      │  Đơn giá    │  Số lượng  │  Thành    │
│               │             │            │  tiền     │
│  Phở bò       │  €8.50      │  12        │  €102.00  │
│  ...                                                  │
└──────────────────────────────────────────────────────┘

  Tổng doanh thu ước tính:   €142.00
```

### Trạng thái nút

| Trạng thái | Giao diện |
|-----------|-----------|
| Bình thường | "Xuất PDF" — có thể nhấn |
| Đang tải | Spinner + "Đang tạo…" — vô hiệu hóa |
| Hoàn tất | Trở lại trạng thái bình thường (PDF đã tải xuống) |

### Luồng xuất PDF

1. Người dùng nhấn **Xuất PDF**
2. Nút hiển thị spinner; bị vô hiệu hóa
3. `POST /api/restaurants/{id}/reports/daily/pdf?date={date}` được gửi
4. Trình duyệt nhận phản hồi `application/pdf` → tự động tải xuống
5. Nút trở lại trạng thái bình thường

### Trạng thái trống

Nếu bảng không có hàng nào (kết quả API rỗng), hiển thị:

> *"Không có đơn hàng nào được ghi nhận cho {ngày}. Báo cáo sẽ phản ánh dữ liệu khi có đơn hàng."*

Nút **Xuất PDF** vẫn hoạt động (PDF sẽ chứa thông báo trạng thái trống).

---

## Lưu ý bảo mật

| Vấn đề | Cài đặt |
|--------|---------|
| Không ghi file lên đĩa | PDF được tạo hoàn toàn trong `MemoryStream`; không bao giờ ghi lên đĩa; không cần dọn dẹp |
| Cô lập tenant | Tham số URL `restaurantId` được kiểm tra với claim `restaurant_id` trong JWT; 403 nếu không khớp |
| Không có injection đầu vào | Tham số `date` được parse là `DateOnly`; định dạng sai → 400 |
| Cần xác thực | Endpoint được trang trí với `[Authorize(Roles = "owner")]` |

---

## Danh sách kiểm tra triển khai

### Giai đoạn 1 — Backend

- [ ] Thêm gói NuGet `QuestPDF` vào `src/Api/`
- [ ] Thêm `QuestPDF.Settings.License = LicenseType.Community;` vào `Program.cs`
- [ ] Tạo `src/Api/Endpoints/ReportEndpoints.cs` với extension `MapReportEndpoints()`
- [ ] Truy vấn `orders` JOIN `order_lines` với các bộ lọc
- [ ] Tạo QuestPDF document → `MemoryStream`
- [ ] Trả về `File(stream.ToArray(), "application/pdf", $"sales-{date}.pdf")`
- [ ] Viết integration test: chủ đã xác thực nhận 200; tenant sai nhận 403

### Giai đoạn 2 — Frontend

- [ ] Tạo `src/Frontend/src/pages/owner/DailyReport.vue`
- [ ] Thêm route `/owner/reports/daily` vào Vue Router
- [ ] Thêm link "Báo cáo ngày" vào sidebar nav của chủ
- [ ] Tạo date picker (mặc định hôm nay), data table, loading state trên nút xuất
