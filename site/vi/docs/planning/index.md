# Tài liệu Yêu cầu Sản phẩm (PRD)

**Hệ thống đặt món không tiếp xúc** · Phiên bản 1.0 · Tháng 3 năm 2026  
Trạng thái: **Bản nháp — Để xem xét cùng khách hàng**

---

## 1. Tóm tắt điều hành

**Hệ thống đặt món không tiếp xúc** là nền tảng SaaS cho phép các nhà hàng cung cấp trải nghiệm đặt món hoàn toàn kỹ thuật số, không cần cài ứng dụng. Thực khách chỉ cần quét mã QR tại bàn, duyệt menu kỹ thuật số trực tiếp và đặt món ngay từ điện thoại cá nhân. Đơn hàng được truyền theo thời gian thực tới nhân viên bếp, họ cập nhật trạng thái hiển thị đồng thời cho cả thực khách lẫn nhân viên phục vụ. Chủ nhà hàng quản lý thực đơn, bàn ăn và báo cáo thông qua dashboard chuyên dụng.

Nền tảng được thiết kế để nhiều nhà hàng có thể đăng ký và sử dụng nhanh chóng theo kiến trúc đa tenant (multi-tenant), với phân quyền vai trò rõ ràng và giao tiếp thời gian thực là nguyên tắc cốt lõi.

---

## 2. Vấn đề cần giải quyết

Quy trình đặt món truyền thống tại nhà hàng tồn tại nhiều hạn chế:

- **Tắc nghẽn nhân sự** — Thực khách phải chờ nhân viên tới ghi order, gây chậm trễ vào giờ cao điểm.
- **Sai sót trong truyền đạt** — Order bằng miệng hoặc viết tay dễ bị nghe nhầm hoặc bỏ sót.
- **Không có phản hồi trạng thái** — Thực khách không biết đơn mình đang ở đâu; buộc phải gọi nhân viên để hỏi.
- **Chi phí in ấn cao** — Menu giấy phải in lại mỗi khi có thay đổi thực đơn.
- **Vệ sinh trong thời đại COVID** — Menu vật lý và bề mặt chung vẫn là mối lo ngại tiếp xúc cho thực khách có ý thức về sức khoẻ.

---

## 3. Mục tiêu sản phẩm

| # | Mục tiêu | Chỉ số thành công |
|---|----------|--------------------|
| G1 | Giảm thời gian đặt ORDER trung bình | < 3 phút từ lúc quét QR đến khi xác nhận đơn |
| G2 | Loại bỏ sai sót chuyển tiếp order | 0 đơn hàng qua trung gian nhân viên trong luồng thông thường |
| G3 | Sự hài lòng của thực khách | ≥ 4,2 / 5 điểm đánh giá sau bữa ăn |
| G4 | Tốc độ onboarding nhà hàng | Nhà hàng mới hoạt động trong vòng 30 phút |
| G5 | Uptime nền tảng | SLA 99,5% hàng tháng |
| G6 | Độ trễ cập nhật thời gian thực | Cập nhật trạng thái Order < 1 giây (P95) |

---

## 4. Phạm vi

### Có trong phạm vi (v1.0)

- Tạo mã QR riêng cho từng bàn
- Thực khách xem menu kỹ thuật số và đặt món
- Theo dõi trạng thái đơn hàng thời gian thực (thực khách + bếp + nhân viên)
- Hệ thống in vé nhiệt (máy in bếp + máy in quầy bar)
- Dashboard quản lý của nhân viên phục vụ
- Dashboard chủ nhà hàng: quản lý menu & bàn ăn
- Panel quản trị nền tảng đa nhà hàng
- Xác thực JWT qua Supabase và lưu trữ dữ liệu
- Hub WebSocket SignalR đồng bộ trạng thái thời gian thực
- UI responsive ưu tiên mobile (không cần cài app)

### Ngoài phạm vi (v1.0)

- Thanh toán / checkout trong ứng dụng
- Chương trình tích điểm hoặc mã khuyến mãi
- Quản lý tồn kho hoặc cảnh báo hết hàng
- Đặt bàn / hệ thống booking
- App iOS/Android thuần native
- Tích hợp POS bên thứ ba (dự kiến v2)
- Menu đa ngôn ngữ (dự kiến v2)

---

## 5. Chân dung người dùng & Vai trò

### 5.1 Thực khách (Guest)

> Khách hàng ngồi tại bàn nhà hàng với điện thoại thông minh.

- **Không có tài khoản** — truy cập hệ thống bằng cách quét mã QR
- Muốn xem menu, tuỳ chỉnh món và đặt order
- Muốn theo dõi trạng thái order mà không cần gọi nhân viên
- Có thể đặt nhiều order trong cùng một lần ngồi

### 5.2 Nhân viên phục vụ (Staff)

> Nhân viên nhà hàng quản lý bàn ăn và hỗ trợ thực khách.

- Đăng nhập bằng **mã PIN** (không cần thiết lập mật khẩu phức tạp)
- Xem tất cả bàn ăn và đơn hàng đang hoạt động
- Đánh dấu đơn đã phục vụ / đóng phiên bàn
- Có thể huỷ đơn hàng của thực khách

### 5.3 Chủ/Quản lý nhà hàng (Owner)

> Chủ sở hữu hoặc quản lý của một nhà hàng cụ thể.

- Tài khoản đầy đủ với đăng nhập qua **Google OAuth** — không cần thiết lập mật khẩu
- Tài khoản bắt đầu ở trạng thái **Chờ phê duyệt**; phải được PlatformAdmin kích hoạt sau khi xác nhận thanh toán phí sử dụng nền tảng
- Quản lý thực đơn kỹ thuật số (thêm/sửa/ẩn món, cập nhật trạng thái có hàng/hết hàng)
- Quản lý bàn ăn (thêm/xoá, tạo/làm mới mã QR)
- Xem lịch sử đơn hàng, báo cáo doanh thu và phản hồi thực khách
- Quản lý mã PIN và tài khoản nhân viên

### 5.4 Quản trị viên nền tảng (Platform Admin)

> Đơn vị vận hành nền tảng SaaS — có quyền truy cập tất cả tenant.

- Tạo và quản lý tenant nhà hàng
- Xem số liệu tổng hợp và trạng thái sức khoẻ hệ thống
- Tạm dừng hoặc vô hiệu hoá nhà hàng
- Xem xét và **phê duyệt** đăng ký của chủ nhà hàng mới sau khi xác nhận thanh toán phí
- Quản lý cấu hình toàn nền tảng

---

## 6. Yêu cầu chức năng

### F1 — Mã QR & Quản lý bàn ăn

| ID | Yêu cầu | Ưu tiên |
|----|---------|---------|
| F1.1 | Mỗi bàn có một mã QR duy nhất do hệ thống tạo | Bắt buộc |
| F1.2 | Mã QR mở phiên thực khách giới hạn trong bàn và nhà hàng cụ thể | Bắt buộc |
| F1.3 | Chủ nhà hàng có thể thêm, đổi tên và vô hiệu hoá bàn | Bắt buộc |
| F1.4 | Chủ nhà hàng có thể tạo lại mã QR cho bàn (để vô hiệu mã cũ) | Bắt buộc |
| F1.5 | Mã QR có thể tải về dạng PNG/PDF để in | Nên có |
| F1.6 | Mã QR chứa token được ký HMAC — không giới hạn thời gian mặc định | Bắt buộc |

### F2 — Thực khách xem menu & đặt món

| ID | Yêu cầu | Ưu tiên |
|----|---------|---------|
| F2.1 | Thực khách truy cập menu qua quét QR — không cần cài app, không cần tài khoản | Bắt buộc |
| F2.2 | Menu hiển thị danh mục, tên món, mô tả, giá và ảnh | Bắt buộc |
| F2.3 | Thực khách thêm món vào giỏ và điều chỉnh số lượng | Bắt buộc |
| F2.4 | Thực khách thêm ghi chú tuỳ chỉnh cho từng món (ví dụ: "không hành") | Bắt buộc |
| F2.5 | Thực khách xem lại giỏ hàng và xác nhận order chỉ một thao tác | Bắt buộc |
| F2.6 | Thực khách nhận xác nhận ngay trên màn hình cùng mã số đơn hàng | Bắt buộc |
| F2.7 | Thực khách có thể tiếp tục đặt thêm order trong cùng phiên bàn | Bắt buộc |
| F2.8 | Món hết hàng được hiển thị nhưng không thể chọn, có nhãn "Hết hàng" | Bắt buộc |
| F2.9 | Menu hỗ trợ ảnh minh hoạ món (tuỳ chọn theo từng món) | Nên có |
| F2.10 | Thực khách có thể xem toàn bộ lịch sử order trong phiên hiện tại | Nên có |

### F3 — Theo dõi đơn hàng thời gian thực

| ID | Yêu cầu | Ưu tiên |
|----|---------|---------|
| F3.1 | Đơn hàng mới kích hoạt sự kiện in qua SignalR — món ăn định tuyến đến máy in bếp, đồ uống đến máy in quầy bar | Bắt buộc |
| F3.2 | Trạng thái đơn hàng tự động chuyển sang "Đang chế biến" khi vé in được gửi đi | Bắt buộc |
| F3.3 | Thực khách thấy cập nhật trạng thái trực tiếp không cần tải lại trang | Bắt buộc |
| F3.4 | Thay đổi trạng thái kích hoạt thông báo trên màn hình thực khách | Nên có |
| F3.5 | Dashboard nhân viên hiển thị tất cả đơn hoạt động, sắp xếp theo thời gian | Bắt buộc |
| F3.6 | Hệ thống cảnh báo nếu đơn ở trạng thái "Tiếp nhận" quá 5 phút (tuỳ chỉnh) | Có thể có |

### F4 — Hệ thống in vé nhiệt

| ID | Yêu cầu | Ưu tiên |
|----|---------|------|
| F4.1 | Mỗi món ăn được gắn nhãn **đồ ăn** hoặc **đồ uống** để xác định máy in đích | Bắt buộc |
| F4.2 | Đồ ăn trong đơn tự động in trên **máy in nhiệt bếp** | Bắt buộc |
| F4.3 | Đồ uống trong đơn tự động in trên **máy in nhiệt quầy bar** | Bắt buộc |
| F4.4 | Mỗi vé in hiển thị: số bàn, số đơn, danh sách món, số lượng và ghi chú | Bắt buộc |
| F4.5 | Máy in bếp và quầy bar hoạt động độc lập — đơn chỉ có đồ uống không kích hoạt máy in bếp | Bắt buộc |
| F4.6 | Một **phần mềm client in** nhẹ chạy tại nhà hàng, lắng nghe sự kiện in qua SignalR | Bắt buộc |
| F4.7 | Lỗi in (máy in offline) hiện cảnh báo trực quan trên Dashboard nhân viên | Nên có |

### F5 — Dashboard nhân viên phục vụ

| ID | Yêu cầu | Ưu tiên |
|----|---------|---------|
| F5.1 | Nhân viên xem tất cả bàn và trạng thái (trống / có khách / cần chú ý) | Bắt buộc |
| F5.2 | Nhân viên có thể đóng phiên bàn và reset bàn sau khi thực khách đã thanh toán tại quầy nhà hàng | Bắt buộc |
| F5.3 | Nhân viên có thể xem và huỷ đơn hàng | Bắt buộc |
| F5.4 | Nhân viên đăng nhập bằng PIN 4–6 chữ số (không cần email) | Bắt buộc |

### F6 — Dashboard chủ nhà hàng

| ID | Yêu cầu | Ưu tiên |
|----|---------|---------|
| F6.1 | Chủ nhà hàng tạo, sửa và ẩn danh mục thực đơn | Bắt buộc |
| F6.2 | Chủ nhà hàng tạo, sửa và ẩn món ăn (tên, mô tả, giá, ảnh, trạng thái hàng) | Bắt buộc |
| F6.3 | Chủ nhà hàng bật/tắt trạng thái có hàng theo thời gian thực (ví dụ: "hết hàng") | Bắt buộc |
| F6.4 | Chủ nhà hàng quản lý bàn và tải mã QR | Bắt buộc |
| F6.5 | Chủ nhà hàng tạo và quản lý PIN nhân viên | Bắt buộc |
| F6.6 | Chủ nhà hàng xem lịch sử đơn hàng với bộ lọc (khoảng ngày, bàn, trạng thái) | Nên có |
| F6.7 | Chủ nhà hàng xem tóm tắt doanh thu (theo ngày/tuần) | Nên có |
| F6.8 | Chủ nhà hàng cấu hình hồ sơ nhà hàng (tên, logo, địa chỉ, giờ mở cửa) | Nên có |

### F7 — Panel quản trị nền tảng

| ID | Yêu cầu | Ưu tiên |
|----|---------|---------|
| F7.1 | Quản trị viên tạo tenant nhà hàng mới | Bắt buộc |
| F7.2 | Quản trị viên xem tất cả tenant và trạng thái hoạt động | Bắt buộc |
| F7.3 | Quản trị viên tạm dừng / khôi phục tenant | Bắt buộc |
| F7.4 | Quản trị viên xem số liệu lượng đơn hàng tổng hợp | Có thể có |
| F7.5 | Quản trị viên xem xét đăng ký chờ phê duyệt của chủ nhà hàng và phê duyệt hoặc từ chối | Bắt buộc |
| F7.6 | Phê duyệt kích hoạt tài khoản chủ nhà hàng; từ chối gửi email thông báo | Bắt buộc |

### F8 — Xác thực & Phân quyền

| ID | Yêu cầu | Ưu tiên |
|----|---------|---------|
| F8.1 | Chủ nhà hàng đăng nhập qua **Google OAuth** (Supabase Auth social login); tài khoản mới bắt đầu ở trạng thái "Chờ phê duyệt" | Bắt buộc |
| F8.2 | Nhân viên xác thực qua PIN giới hạn trong từng nhà hàng (không cần email) | Bắt buộc |
| F8.3 | Phiên thực khách là ẩn danh và giới hạn trong bàn + nhà hàng | Bắt buộc |
| F8.4 | Row-Level Security (RLS) trong Supabase — tenant không thể đọc dữ liệu nhau | Bắt buộc |
| F8.5 | API kiểm tra JWT/session trên mọi request | Bắt buộc |
| F8.6 | Phân cấp quyền: Quản trị viên > Chủ nhà hàng > Nhân viên > Thực khách | Bắt buộc |
| F8.7 | Chủ nhà hàng không thể truy cập bất kỳ tính năng nào của nền tảng cho đến khi PlatformAdmin phê duyệt tài khoản | Bắt buộc |

---

## 7. Yêu cầu phi chức năng

| Hạng mục | Yêu cầu |
|----------|---------|
| **Hiệu năng** | Tải trang < 2s trên 4G mobile; round-trip gửi order < 500ms (P95) |
| **Khả năng mở rộng** | API stateless; scale ngang qua Docker blue-green; hỗ trợ 50 nhà hàng đồng thời khi ra mắt |
| **Tính sẵn sàng** | Uptime 99,5%/tháng; zero-downtime deployment qua blue-green switch |
| **Bảo mật** | Tuân thủ OWASP Top 10; toàn bộ dữ liệu qua HTTPS/WSS; không có PII trong token QR |
| **Tiếp cận** | Tuân thủ WCAG 2.1 AA trên trang menu dành cho thực khách |
| **Trình duyệt hỗ trợ** | 2 phiên bản mới nhất: Chrome, Safari, Firefox, Edge; iOS Safari 15+; Android Chrome 100+ |
| **Lưu giữ dữ liệu** | Lịch sử đơn hàng lưu 24 tháng; sau đó ẩn danh hoá cho mục đích báo cáo |
| **Audit log** | Ghi lại mọi thay đổi trạng thái, sự kiện xác thực và hành động quản trị |

---

## 8. Tóm tắt kiến trúc kỹ thuật

| Tầng | Công nghệ |
|------|-----------|
| Frontend (Tất cả vai trò) | Vue 3 + **Vuetify** — một SPA duy nhất triển khai trên **Vercel** |
| Backend API | .NET 8 Minimal API (ASP.NET Core) — trên Civo VM |
| Hub thời gian thực | ASP.NET Core SignalR (WebSocket) — co-hosted với API trên Civo VM |
| Xác thực & Cơ sở dữ liệu | Supabase (PostgreSQL + GoTrue Auth + Google OAuth) |
| Lưu trữ tệp | Supabase Storage (ảnh món ăn) |
| Hạ tầng | Civo Compute VM (backend) + Vercel (CDN frontend) |
| Triển khai | Docker Compose blue-green (backend trên Civo); Vercel Git integration (frontend) |
| CI/CD | GitHub Actions → SSH deploy lên Civo (backend); Vercel auto-deploy khi push (frontend) |
| Tài liệu | VitePress (trang web này) |

---

## 9. Mô hình dữ liệu (Tổng quan)

```
Restaurant (Nhà hàng, trạng thái chủ: pending|active|suspended)
  ├── Tables (Bàn: số bàn, qr_token)
  ├── MenuCategories (Danh mục: tên, thứ tự)
  │   └── MenuItems (Món: tên, mô tả, giá, ảnh, trạng thái hàng, loại: food|drink)
  ├── Staff (Nhân viên: tên, pin_hash, vai trò)
  └── Orders (Đơn hàng: table_id, session_id, trạng thái, thời gian)
        └── OrderItems (Chi tiết: menu_item_id, số lượng, ghi chú, trạng thái)
```

---

## 10. Hành trình người dùng: Luồng thành công

```
1. Thực khách ngồi vào bàn → quét mã QR
2. Trình duyệt mở trang menu (không cần cài app, không cần đăng nhập)
3. Thực khách duyệt danh mục, thêm món, tuỳ chọn ghi chú
4. Thực khách nhấn "Đặt món" → đơn hàng được gửi đi
5. Đồ ăn tự động in trên máy in nhiệt bếp; đồ uống tự động in trên máy in nhiệt quầy bar
6. Trạng thái đơn tự động chuyển sang "Đang chế biến"
7. Thực khách thấy ⟳ "Đang chế biến" trên thiết bị của họ
8. Nhân viên bếp / quầy bar chuẩn bị món từ vé in — không cần tương tác màn hình
9. Nhân viên mang đồ ăn và đồ uống ra bàn → đánh dấu "Đã phục vụ" trong Dashboard
10. Thực khách thấy ✓ "Đơn hàng hoàn thành"
11. Thực khách có thể đặt thêm món (lặp lại từ bước 3)
12. Thực khách thanh toán tại quầy nhà hàng → Nhân viên đóng phiên bàn
```

---

## 11. Các mốc phát hành

| Mốc | Nội dung | Mục tiêu |
|-----|----------|----------|
| **M0 — Nền tảng** | Repo, CI/CD, hạ tầng, tài liệu VitePress | ✅ Hoàn thành |
| **M1 — API cốt lõi** | Auth, CRUD nhà hàng, CRUD thực đơn, bàn + tạo QR | Sprint 1–2 |
| **M2 — Luồng thực khách** | Quét QR → menu → giỏ hàng → đặt món → xác nhận | Sprint 3–4 |
| **M3 — Thời gian thực** | Hub SignalR, màn hình bếp, cập nhật trạng thái | Sprint 5–6 |
| **M4 — Dashboards** | Dashboard nhân viên, chủ nhà hàng, báo cáo cơ bản | Sprint 7–8 |
| **M5 — Admin nền tảng** | Quản lý tenant, số liệu tổng hợp | Sprint 9 |
| **M6 — Hoàn thiện** | Kiểm tra bảo mật, tối ưu hiệu năng, kiểm tra tiếp cận | Sprint 10 |
| **Ra mắt v1.0** | Triển khai production, monitoring, SLA có hiệu lực | Sprint 11 |

---

## 12. Câu hỏi mở

| # | Câu hỏi | Người phụ trách | Trạng thái |
|---|---------|-----------------|------------|
| OQ1 | Tích hợp thanh toán có nằm trong phạm vi v1.1 không? | Khách hàng | Mở |
| OQ2 | Một loại tiền tệ hay đa tiền tệ? | Khách hàng | Mở |
| OQ3 | Món ăn có hỗ trợ tùy chọn/biến thể không (ví dụ: cỡ, mức cay)? | Product | Mở |
| OQ4 | Có cần giao diện PWA (cài ứng dụng từ trình duyệt) không? | Khách hàng | Mở |
| OQ5 | Đánh giá của thực khách — thu thập theo đơn hay theo lần ghé thăm? | Product | Mở |
| OQ6 | Có yêu cầu tuân thủ pháp lý nào không (GDPR, PDPA)? | Khách hàng | Mở |

---

*Tài liệu được duy trì bởi nhóm phát triển. Cập nhật lần cuối: Tháng 3 năm 2026.*
