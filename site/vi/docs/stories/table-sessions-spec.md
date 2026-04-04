# Đặc tả Phiên Bàn

**Epic:** E5 — Luồng đặt món của thực khách / E8 — Dashboard nhân viên phục vụ  
**Cập nhật lần cuối:** Tháng 4 năm 2026

---

## Phiên Bàn Là Gì?

**Phiên bàn** là vòng đời của một nhóm thực khách tại một bàn — từ thời điểm người đầu tiên quét mã QR đến khi nhân viên đánh dấu bàn đã thanh toán và trống.

Trong một phiên bàn, nhiều thực khách có thể quét cùng mã QR và mỗi người đặt món độc lập. Tất cả đơn hàng của họ được gộp dưới cùng một phiên. Nhân viên có thể xem tất cả đơn hàng của bàn trong một màn hình tổng hợp, và tổng tiền hiển thị khi thanh toán là tổng cộng của mọi thực khách tại bàn đó.

---

## Trải Nghiệm Thực Khách

### Đến Bàn

Mỗi thực khách quét mã QR trên bàn bằng điện thoại. Không cần tải ứng dụng — menu mở ngay lập tức trên trình duyệt.

Người đầu tiên quét mã sẽ tự động mở phiên. Mọi thực khách khác quét cùng mã trước khi bàn đóng đều tham gia cùng phiên đó. Thực khách không cần phối hợp với nhau — hệ thống xử lý tất cả tự động. Mỗi thực khách thấy toàn bộ menu và thêm món vào giỏ hàng của riêng mình một cách độc lập.

### Đặt Món

Mỗi thực khách đặt đơn hàng của riêng mình theo cách thông thường. Từ góc độ bếp, không quan trọng là một hay sáu thực khách đặt — tất cả đơn hàng xuất hiện cùng nhau dưới bàn đó.

Thực khách có thể tiếp tục đặt thêm đơn trong suốt thời gian ghé thăm, ví dụ gọi thêm món tráng miệng sau khi ăn xong món chính. Mỗi đơn mới được thêm vào phiên đang chạy.

### Theo Dõi Trạng Thái Đơn

Mỗi thực khách có thể xem trạng thái đơn của riêng mình trên điện thoại của họ. Họ không thấy đơn của các thực khách khác — chỉ thấy của mình. Điều này giữ mọi thứ đơn giản và tránh nhầm lẫn khi có nhóm đông người.

---

## Trải Nghiệm Nhân Viên

### Xem Bàn

Khi nhân viên nhấn vào một bàn đang có khách trong màn hình sàn, họ thấy tất cả đơn hàng của phiên đó được gộp lại — bất kể có bao nhiêu thực khách đã đặt.

Màn hình bàn hiển thị:

- Từng đơn hàng và các món của nó, với trạng thái: đang chờ / đang chuẩn bị / sẵn sàng / đã phục vụ
- Tổng chạy của phiên đến thời điểm hiện tại
- Số đơn hàng riêng lẻ đã được đặt tại bàn

### Đóng Bàn

Khi thực khách sẵn sàng thanh toán, nhân viên đánh dấu tất cả món đã phục vụ (hoặc xác nhận mọi thứ đã xong) và nhấn **Đóng bàn**.

Điều xảy ra tiếp theo:

- Phiên được hoàn tất với tổng số tiền
- Bàn hiển thị ngay lập tức là **trống** trên màn hình sàn
- Mã QR sẵn sàng cho nhóm khách tiếp theo — không cần đặt lại hay thao tác quản trị
- Dữ liệu phiên đã đóng vẫn còn trong báo cáo ngày

---

## Phiên Mang Về

Đơn mang về hoạt động gần như giống hệt phiên bàn, nhưng không có bàn vật lý hay quét mã QR.

Thực khách mang về truy cập menu trực tiếp, ví dụ qua một đường link hoặc mã QR gắn tại quầy. Họ duyệt, đặt hàng và nhận cập nhật trạng thái như thực khách dùng bàn.

Các điểm khác biệt chính so với phiên bàn là:

- Không có bàn được gán
- Không có thực khách khác có thể tham gia phiên — mỗi đơn mang về là một phiên riêng
- Phiên tự động đóng khi tất cả món được đánh dấu đã phục vụ

Phiên mang về xuất hiện trong báo cáo ngày cạnh các bàn ăn tại chỗ.

---

## Các Quy Tắc Quan Trọng

- Một bàn chỉ có thể có một phiên **đang mở** tại một thời điểm
- Đóng một phiên bàn không xóa bất kỳ dữ liệu nào — chỉ đánh dấu phiên là đã hoàn thành
- Nếu mã QR được chủ tạo lại, bất kỳ phiên đang mở nào tại bàn đó đều không bị ảnh hưởng — chỉ các lần quét trong tương lai mới dùng mã mới
- Nhân viên chỉ có thể đóng phiên cho các bàn được giao cho họ, trừ khi chủ đã cấp quyền truy cập tất cả bàn
