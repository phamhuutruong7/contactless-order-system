# Epics & User Stories

**Hệ thống đặt món không tiếp xúc** · Sprint Backlog · v1.0

---

## Tổng quan Epic

| ID | Epic | Trạng thái |
|----|------|------------|
| E1 | Hạ tầng & CI/CD | ✅ Hoàn thành |
| E2 | Xác thực & Đa tenant | 🔲 Kế hoạch |
| E3 | Quản lý thực đơn | 🔲 Kế hoạch |
| E4 | Quản lý bàn & Mã QR | 🔲 Kế hoạch |
| E5 | Luồng đặt món của thực khách | 🔲 Kế hoạch |
| E6 | Theo dõi đơn hàng thời gian thực | 🔲 Kế hoạch |
| E7 | Màn hình hiển thị bếp (KDS) | 🔲 Kế hoạch |
| E8 | Dashboard nhân viên phục vụ | 🔲 Kế hoạch |
| E9 | Dashboard chủ nhà hàng & Báo cáo | 🔲 Kế hoạch |
| E10 | Panel quản trị nền tảng | 🔲 Kế hoạch |

---

## E1 — Hạ tầng & CI/CD

**Với vai trò** lập trình viên, **tôi muốn** có một pipeline tự động đáng tin cậy **để** các thay đổi code được triển khai an toàn lên dev và prod.

| Story | Tiêu chí chấp nhận | Trạng thái |
|-------|--------------------|------------|
| Thiết lập GitHub repo và chiến lược nhánh | `main` → prod, `dev` → dev; branch protection rules hoạt động | ✅ Hoàn thành |
| Trang tài liệu VitePress triển khai lên GitHub Pages | Site hoạt động tại URL GitHub Pages; tự động deploy khi push lên main | ✅ Hoàn thành |
| Civo Dev VM cài Docker | VM chạy, `vm-setup.sh` idempotent, Docker + Compose đã cài | 🔲 Kế hoạch |
| Civo Prod VM cài blue-green | Cả hai stack (blue/green) có thể khởi động; Nginx upstream switch hoạt động | 🔲 Kế hoạch |
| GitHub Actions: workflow deploy-dev | Push lên `dev` → SSH deploy → ứng dụng truy cập được trên Dev VM | 🔲 Kế hoạch |
| GitHub Actions: workflow deploy-prod | Push lên `main` → blue-green deploy → xác nhận không có downtime | 🔲 Kế hoạch |

---

## E2 — Xác thực & Đa tenant

**Với vai trò** chủ nhà hàng / nhân viên, **tôi muốn** xác thực phân quyền an toàn **để** chỉ người dùng được phép mới truy cập dữ liệu phù hợp.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Chủ nhà hàng đăng ký và đăng nhập (email + mật khẩu) | Supabase Auth tạo tài khoản; JWT được trả về; RLS policies hoạt động |
| Nhân viên đăng nhập bằng PIN | PIN xác thực qua bcrypt hash; JWT ngắn hạn được phát hành; hết hạn sau 8h |
| Phiên thực khách được tạo khi quét QR | Phiên ẩn danh giới hạn trong `restaurant_id` + `table_id`; không lưu PII |
| Đảm bảo cô lập dữ liệu tenant | Chủ nhà hàng A không đọc được dữ liệu Nhà hàng B — xác minh bằng integration test |
| Tạo tài khoản quản trị viên nền tảng | Admin seed có thể đăng nhập; có thể tạo tenant nhà hàng |

---

## E3 — Quản lý thực đơn

**Với vai trò** chủ nhà hàng, **tôi muốn** quản lý thực đơn kỹ thuật số **để** thực khách luôn thấy thông tin chính xác, cập nhật.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Tạo / sửa / ẩn danh mục thực đơn | Danh mục xuất hiện trong menu; danh mục đã ẩn không hiển thị với thực khách |
| Tạo / sửa / ẩn món ăn | Món hiển thị tên, mô tả, giá, ảnh (nếu có) |
| Bật/tắt trạng thái có hàng theo thời gian thực | Chủ đặt hết hàng → món mờ đi với thực khách trong vòng 5s |
| Tải ảnh món ăn | Ảnh lưu vào Supabase Storage; phục vụ qua URL CDN |
| Sắp xếp lại danh mục và món | Kéo thả để sắp xếp; được lưu; phản ánh trong menu thực khách |

---

## E4 — Quản lý bàn & Mã QR

**Với vai trò** chủ nhà hàng, **tôi muốn** quản lý bàn ăn và mã QR **để** thực khách luôn truy cập đúng phiên.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Thêm / đổi tên / vô hiệu hoá bàn | Danh sách bàn phản ánh thay đổi ngay lập tức |
| Tạo mã QR cho bàn | QR mã hoá URL có ký; quét sẽ mở đúng nhà hàng + bàn |
| Tải mã QR dạng PNG | File tải về có tên bàn trong tên file |
| Tạo lại mã QR (vô hiệu mã cũ) | Link QR cũ chuyển đến trang "không hợp lệ"; mã mới hoạt động bình thường |

---

## E5 — Luồng đặt món của thực khách

**Với vai trò** thực khách, **tôi muốn** duyệt menu và đặt món từ điện thoại **để** không cần chờ nhân viên phục vụ.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Thực khách quét QR và thấy menu | Trang tải < 2s trên 4G; không hiện thông báo cài app; menu hiển thị đúng |
| Thực khách duyệt danh mục và món | Danh mục hiển thị; chi tiết món (tên, mô tả, giá, ảnh) có thể xem |
| Thực khách thêm món vào giỏ | Giỏ cập nhật; badge hiển thị số lượng món |
| Thực khách thêm ghi chú vào món | Ghi chú dạng text tự do được lưu cùng dòng order |
| Thực khách xem lại và xác nhận đơn | Hiện tóm tắt; đơn được gửi khi xác nhận; màn hình xác nhận có số đơn |
| Thực khách đặt thêm order trong cùng phiên | Các order tiếp theo liên kết với cùng phiên bàn |
| Món hết hàng hiển thị nhưng không thể đặt | Mờ đi; nhãn "Hết hàng"; nút thêm vào giỏ bị tắt |

---

## E6 — Theo dõi đơn hàng thời gian thực

**Với vai trò** thực khách và nhân viên bếp, **tôi muốn** trạng thái đơn hàng cập nhật tự động **để** không ai cần hỏi hay tải lại trang.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Đơn hàng đến bếp tức thì | SignalR đẩy sự kiện `OrderReceived` < 1s sau khi thực khách xác nhận |
| Bếp cập nhật trạng thái sang "Đang chế biến" | Thực khách thấy cập nhật trạng thái không cần tải lại trang |
| Bếp đánh dấu đơn "Sẵn sàng" | Thực khách thấy chỉ báo "Sẵn sàng"; nhân viên được thông báo |
| Khôi phục sau mất kết nối | SignalR tự ngắt kết nối; sự kiện bị bỏ lỡ được so khớp qua fallback REST |

---

## E7 — Màn hình hiển thị bếp (KDS)

**Với vai trò** nhân viên bếp, **tôi muốn** có màn hình hiển thị rõ ràng các đơn hàng vào **để** tôi có thể chuẩn bị theo thứ tự.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Màn hình bếp hiển thị tất cả đơn đang hoạt động | Đơn sắp xếp theo thứ tự cũ nhất lên trên; số bàn + món hiển thị |
| Đơn mới kích hoạt cảnh báo | Flash hình ảnh / tiếng ping âm thanh khi có đơn mới |
| Bếp có thể đánh dấu đơn sẵn sàng | Trạng thái cập nhật; đơn chuyển sang cột "Xong" |
| Đơn hoàn thành tự lưu trữ | Đơn đã xong biến mất khỏi màn hình hoạt động sau 2 phút |

---

## E8 — Dashboard nhân viên phục vụ

**Với vai trò** nhân viên, **tôi muốn** xem tất cả trạng thái bàn và đơn hàng **để** tôi quản lý phục vụ hiệu quả.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Nhân viên đăng nhập bằng PIN | PIN được xác thực; nhân viên giới hạn trong nhà hàng của họ |
| Màn hình tổng quan hiển thị tất cả bàn | Mỗi bàn hiển thị: trống / có khách / có đơn sẵn sàng |
| Nhân viên xem đơn hàng theo bàn | Danh sách đơn đầy đủ cho một bàn; trạng thái từng món hiển thị |
| Nhân viên đánh dấu bàn đã phục vụ / đóng | Phiên đóng; bàn trở về trạng thái "trống" |
| Nhân viên có thể huỷ đơn hàng | Trạng thái đơn chuyển sang "Đã huỷ"; thực khách được thông báo qua SignalR |

---

## E9 — Dashboard chủ nhà hàng & Báo cáo

**Với vai trò** chủ nhà hàng, **tôi muốn** có dashboard quản lý **để** tôi vận hành nhà hàng và theo dõi hiệu suất kinh doanh.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Chủ xem tóm tắt đơn hàng trong ngày | Hiển thị số đơn hàng, tổng doanh thu, giá trị đơn trung bình |
| Chủ lọc lịch sử đơn hàng | Lọc theo khoảng ngày, bàn, trạng thái |
| Chủ quản lý PIN nhân viên | Có thể tạo, cập nhật, vô hiệu hoá tài khoản nhân viên |
| Chủ sửa hồ sơ nhà hàng | Tên, logo, địa chỉ, giờ mở cửa được lưu và phản ánh công khai |

---

## E10 — Panel quản trị nền tảng

**Với vai trò** quản trị viên nền tảng, **tôi muốn** quản lý các tenant nhà hàng **để** tôi onboard và hỗ trợ khách hàng.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Admin tạo tenant nhà hàng | Bản ghi nhà hàng được tạo; email mời tài khoản chủ nhà hàng được gửi |
| Admin xem tất cả tenant | Bảng hiển thị tên nhà hàng, chủ sở hữu, trạng thái, số đơn hàng |
| Admin tạm dừng / kích hoạt lại nhà hàng | Nhà hàng bị tạm dừng hiển thị trang bảo trì với thực khách |

---

*Stories được cập nhật liên tục theo tiến độ sprint. Cập nhật lần cuối: Tháng 3 năm 2026.*
