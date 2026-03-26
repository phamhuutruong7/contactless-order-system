# Các Trường Hợp Ngoại Lệ

**Phạm vi:** Các tình huống ngoại lệ đã biết và cách hệ thống xử lý · **Đối tượng:** Lập trình viên và QA

---

## 1. Đặt Hàng Đồng Thời Cùng Một Bàn

**Tình huống:** Hai khách cùng bàn gửi đơn hàng cùng lúc (race condition trên `POST /api/orders`).

**Xử lý:**
- Mỗi `POST /api/orders` hoạt động độc lập; không cần khoá ở cấp độ bàn
- Cả hai đơn hàng được tạo thành công với `orderId` riêng
- Cả hai kích hoạt sự kiện `OrderReceived` trên nhóm SignalR nhà hàng
- Màn hình sàn nhân viên hiển thị hai thẻ đơn hàng riêng biệt cùng nhãn bàn
- Trang theo dõi của khách tại `table/{id}/status` hiển thị **cả hai** đơn hàng, mỗi đơn có thanh tiến trình riêng

**Không có rủi ro:** Hệ thống cố ý cho phép nhiều đơn hàng mở trên cùng một bàn (ví dụ: gọi đồ uống trước, gọi món ăn sau).

---

## 2. SignalR Mất Kết Nối Khi Đơn Hàng Đang Xử Lý

**Tình huống:** Khách mất mạng sau khi đặt hàng trong khi đang chờ sự kiện `OrderStatusChanged`.

**Xử lý:**
1. Vue composable phát hiện `connection.state === 'Disconnected'`
2. Thử kết nối lại với backoff luỹ thừa: 1 s → 2 s → 4 s → 8 s → 16 s → tối đa 30 s
3. Khi kết nối lại, gọi `GET /api/orders/{id}` một lần để lấy trạng thái hiện tại (đồng bộ hoá)
4. Giao diện cập nhật đúng trạng thái thực — khách không bỏ lỡ bất kỳ thay đổi trạng thái nào

**Trường hợp phụ:** Nếu khách vẫn mất mạng đến khi đơn hàng được phục vụ (`served`), khi kết nối lại sẽ thấy ngay trạng thái cuối.

---

## 3. Máy In CloudPRNT Ngoại Tuyến Khi Có Đơn Hàng

**Tình huống:** Máy in mất mạng hoặc tắt nguồn khi đơn hàng mới đến.

**Xử lý:**
- Lệnh in được đưa vào hàng đợi với `status='pending'`, `created_at = now()`
- Máy in thăm dò mỗi 2–3 s; khi ngoại tuyến, không có yêu cầu → lệnh vẫn ở pending
- Tiến trình nền kiểm tra các lệnh có `tuổi > 5 phút` và đánh dấu là `failed`
- Sự kiện SignalR `PrintFailed` được phát tới nhóm nhà hàng
- Chủ và nhân viên thấy toast: *"Máy in [tên] không phản hồi"*
- **Đơn hàng không bị ảnh hưởng** — vẫn tiếp tục `received → preparing → ready → served` bình thường

**Phục hồi:** Nếu máy in trở lại trong vòng 5 phút, nó sẽ thăm dò, nhận lệnh và in bình thường.

---

## 4. Món Ăn Hết Hàng Sau Khi Khách Đã Thêm Vào Giỏ

**Tình huống:** Chủ đánh dấu một món không còn trong khi khách đã thêm món đó vào giỏ hàng.

**Xử lý:**
- Sự kiện `MenuItemAvailabilityChanged` được đẩy đến tất cả máy khách đang kết nối
- Vue store của giỏ hàng cập nhật phản ứng `isAvailable` của món
- Giỏ hàng hiển thị chip cảnh báo trên món bị ảnh hưởng: *"Món này không còn"*
- **Nút Đặt Hàng bị vô hiệu hoá** khi có bất kỳ món nào trong giỏ không còn
- Khách phải xoá món đó trước khi có thể gửi đơn

**Bảo vệ phía API:** `POST /api/orders` kiểm tra tính sẵn có của từng món ở phía máy chủ. Nếu một món không còn khi gửi, trả về `422 Unprocessable Entity` kèm lỗi chi tiết — dù máy khách có bỏ lỡ sự kiện thời gian thực hay không.

---

## 5. Nhân Viên Bị Khoá PIN Trong Ca Làm

**Tình huống:** Nhân viên nhập sai PIN 3 lần liên tiếp và bị khoá 15 phút trong ca làm.

**Xử lý:**
- `locked_until = now() + 15 phút` được ghi vào bản ghi `staff`
- Endpoint đăng nhập trả về `423 Locked { unlocksAt }` kèm thời gian mở khoá
- Màn hình nhập PIN hiển thị: *"Tài khoản bị khoá đến HH:mm — vui lòng liên hệ chủ nhà hàng"*
- **Nhân viên đang đăng nhập** (JWT hợp lệ) không bị ảnh hưởng — phiên làm việc vẫn tiếp tục
- Chủ nhà hàng có thể mở khoá thủ công qua `PATCH /api/staff/{id}/unlock` (yêu cầu vai trò Owner)
- Khoá tự hết hạn tại `locked_until`; lần thử đăng nhập tiếp theo tiến hành bình thường

---

## 6. Mất Mạng Khi Khách Đang Xem Trang Theo Dõi Đơn Hàng

**Tình huống:** Khách tại `table/{id}/status` mất kết nối sau khi đặt hàng, trước khi được phục vụ.

**Xử lý:**
- Áp dụng cùng chiến lược kết nối lại như tình huống 2 (backoff luỹ thừa + GET đồng bộ)
- Trang trạng thái hiển thị `v-alert` *"Đang kết nối lại…"* trong thời gian backoff
- `v-progress-linear` chạy liên tục khi đang kết nối lại
- Khi kết nối thành công, một lần gọi `GET /api/orders/{id}` khôi phục đúng trạng thái hiện tại
- Nếu đơn hàng đã được phục vụ trong lúc mất mạng, khách thấy ngay trạng thái cuối

---

## 7. Thực Đơn Lớn (Hơn 100 Món) Hiệu Năng

**Tình huống:** Nhà hàng có nhiều danh mục và hơn 100 món — trang menu phải vẫn mượt mà.

**Xử lý:**
- Các món trong mỗi danh mục được render bằng `v-virtual-scroll` — chỉ các phần tử hiển thị mới được mount vào DOM
- Các tab danh mục dùng `v-tabs` với lazy rendering (prop `lazy`); tab không hiển thị sẽ không được render
- Hình ảnh dùng `loading="lazy"` trên thẻ `<img>`; tải theo Intersection Observer
- API `GET /api/menus/{id}` trả về một payload duy nhất (không phân trang) nhưng gọn nhờ dự án (không trả mô tả đầy đủ)
- Mục tiêu: render menu ban đầu < 1 s trên thiết bị Android tầm trung, mạng 4G

---

## 8. Mã QR Hết Hạn và Tái Gán Bàn

**Tình huống:** Nhà hàng tái gán mã QR của một bàn (ví dụ: in lại với token mới) trong khi phiên của khách đang hoạt động.

**Xử lý:**
- `qr_token` cũ trong bảng `tables` được thay bằng UUID mới
- JWT hiện có của khách vẫn **hợp lệ** (chứa `tableId`, không phải `qrToken`) — phiên không bị ảnh hưởng trong 24 giờ còn lại
- Bất kỳ lần quét mới nào của mã QR cũ sẽ nhận được `401` (token không tồn tại trong DB)
- Nhân viên có thể xác nhận: nếu mã QR cũ bị thay thế vật lý, khách với JWT còn hợp lệ vẫn xem được trạng thái đơn hàng nhưng không thể đặt thêm (checkout xác thực `tableId` vẫn còn hoạt động, không phải token)

**Hành động của chủ:** Nếu bàn ngừng hoạt động giữa ca, `PATCH /api/tables/{id} { isActive: false }` khiến `POST /api/orders` trả về `410 Gone`.

---

## 9. Khách Đổi Loại Đơn Sau Khi Đã Thêm Món Vào Giỏ Hàng

**Tình huống:** Khách chọn “Mang Đi”, thêm món, rồi đổi lại “Ăn Tại Chỗ” (hoặc ngược lại) sau khi giỏ hàng không rỗng.

**Xử lý:**
- Toggle loại đơn (`v-btn-toggle`) kích hoạt hộp xác nhận: *“Đổi loại đơn sẽ xóa thông tin bàn/mang đi. Các món đã chọn sẽ được giữ nguyên.”*
- `tableId` được đặt thành `null` khi đổi sang Mang Đi; trường số bàn ẩn
- Khi đổi lại sang Ăn Tại Chỗ, trường số bàn hiện lại (pre-filled nếu đã quét mã QR)
- Các món trong giỏ hàng **không bị xóa** — chỉ ngữ cảnh giao hàng thay đổi
- `POST /api/orders` kiểm tra: nếu `orderType = 'table'` thì `tableId` phải có và đang hoạt động; nếu `orderType = 'take_away'` thì `tableId` phải vắng mặt — trả về `422` nếu không đúng
- Không cần sự kiện SignalR; việc đổi loại chỉ xảy ra phía client cho đến khi gửi đơn
