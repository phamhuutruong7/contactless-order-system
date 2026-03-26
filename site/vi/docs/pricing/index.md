# Bảng Giá & Ước Tính Chi Phí

## Tổng Quan

Trang này cung cấp bảng phân tích chi tiết toàn bộ chi phí triển khai Hệ Thống Đặt Món Không Tiếp Xúc cho một nhà hàng, cùng với mô hình giá khuyến nghị để thu phí chủ nhà hàng theo dạng SaaS.

---

## Chi Phí Phần Cứng Một Lần (mỗi nhà hàng)

Mỗi nhà hàng cần hai máy in: một cho **bếp** (đồ ăn) và một cho **quầy bar** (đồ uống).

| Thiết bị | Số lượng | Đơn giá | Thành tiền |
|---------|----------|---------|------------|
| Star mC-Print3 (Ethernet + WiFi) | 2 | €299–349 | **€598–698** |
| Giấy nhiệt 80mm × 80mm (20 cuộn) | 1 hộp | ~€20 | **€20** |
| Cáp Ethernet (Cat6, 3m) | 2 | ~€5 | **€10** |
| Đế đặt mã QR / giá trên bàn | 10–20 | ~€1 | **€10–20** |

**Ước tính tổng phần cứng: €638–748 mỗi nhà hàng**

> Phần cứng có thể bán theo giá gốc (không lãi) hoặc có thêm biên độ lợi nhuận nhỏ. Khuyến nghị: bán theo giá gốc để giảm rủi ro tài chính cho bạn.

---

## Chi Phí Hạ Tầng Hàng Tháng (toàn bộ nền tảng)

Các chi phí này được chia sẻ cho **tất cả nhà hàng** trên nền tảng và tăng dần theo quy mô.

| Dịch vụ | Cấu hình | Chi phí/tháng |
|---------|----------|--------------|
| Civo Production VM | 2 vCPU / 4 GB RAM | ~€20 |
| Civo Development VM | 1 vCPU / 2 GB RAM | ~€10 |
| Supabase Pro (PostgreSQL + Auth + Storage) | Managed | ~€23 |
| Tên miền (.com qua Cloudflare) | 1 tên miền | ~€1 |
| GitHub Pages (tài liệu VitePress) | — | **Miễn phí** |
| Chứng chỉ SSL (Let's Encrypt / Caddy) | — | **Miễn phí** |

**Tổng hạ tầng: ~€54/tháng** (cho 1–5 nhà hàng)

Khi quy mô tăng:

| Số nhà hàng | VM khuyến nghị | Ước tính chi phí hạ tầng |
|------------|----------------|--------------------------|
| 1–5 | Civo 2 vCPU / 4 GB | ~€54/tháng |
| 6–15 | Civo 4 vCPU / 8 GB | ~€80/tháng |
| 16–30 | Civo 8 vCPU / 16 GB | ~€120/tháng |
| 30+ | Civo Kubernetes cluster | €180+/tháng |

---

## Giá Khuyến Nghị Thu Từ Chủ Nhà Hàng

Dựa trên nghiên cứu thị trường và cấu trúc chi phí thực tế, đây là mô hình giá khuyến nghị:

### Mô Hình Giá

| Loại phí | Số tiền | Ghi chú |
|---------|---------|---------|
| **Phí cài đặt ban đầu** | **€299** | Bao gồm onboarding, cấu hình phần cứng, đào tạo nhân viên, hỗ trợ tháng đầu |
| **Phần cứng (theo giá gốc)** | **€650–750** | Nhà hàng tự mua; bạn không cần quản lý hàng tồn kho |
| **Phí SaaS hàng tháng** | **€79/tháng** | Hosting, bảo trì, cập nhật, và hỗ trợ qua email |

### Tại Sao €79/Tháng?

| Đối thủ cạnh tranh | Giá hàng tháng |
|-------------------|----------------|
| Lightspeed Restaurant | €79/tháng |
| TouchBistro | €69/tháng |
| Square for Restaurants | €60/tháng |
| **Hệ thống của bạn** | **€79/tháng** |

Ở mức €79/tháng, hệ thống định vị ở **phân khúc cao cấp** — được bù đắp bởi kiến trúc tự hosting (không chia sẻ dữ liệu với bên thứ ba), tích hợp CloudPRNT, và mô hình thu phí theo nhà hàng thay vì theo thiết bị đầu cuối.

---

## Phân Tích Điểm Hòa Vốn

| Số nhà hàng | Doanh thu hàng tháng | Chi phí hạ tầng | Lợi nhuận gộp |
|------------|---------------------|-----------------|---------------|
| 1 | €79 | €54 | **€25** |
| 3 | €237 | €54 | **€183** |
| 5 | €395 | €54 | **€341** |
| 10 | €790 | €80 | **€710** |
| 20 | €1.580 | €120 | **€1.460** |

> Phí cài đặt (€299 × số nhà hàng) là doanh thu thêm một lần. Phần cứng bán theo giá gốc — không tốn chi phí cho bạn.

**Điểm hòa vốn: Ngay khi có khách hàng trả phí đầu tiên.**

---

## Tổng Chi Phí Cho Chủ Nhà Hàng (Năm Đầu)

| Hạng mục | Chi phí |
|---------|---------|
| Phí cài đặt | €299 |
| Phần cứng (2× Star mC-Print3 + phụ kiện) | ~€700 |
| SaaS hàng tháng (12 tháng) | 12 × €79 = **€948** |
| **Tổng năm 1** | **~€1.947** |
| **Năm 2 trở đi (chỉ phí tháng)** | **€79/tháng** |

So với hệ thống POS truyền thống (€2.000–5.000 ban đầu + €100–200/tháng), mức giá này **cạnh tranh đáng kể**.

---

## Dịch Vụ Bổ Sung (cơ hội upsell trong tương lai)

| Tính năng | Giá đề xuất |
|---------|------------|
| Thêm máy in (ví dụ: quầy lấy đồ nhanh) | €49 phí cài đặt + giá phần cứng |
| Dashboard phân tích nâng cao | +€19/tháng |
| Thương hiệu tùy chỉnh (white-label menu QR) | +€29/tháng |
| Hỗ trợ ưu tiên SLA (phản hồi trong 4 giờ) | +€39/tháng |
| Gói nhiều chi nhánh (nhà hàng thứ 2) | Giảm 10% phí tháng |
