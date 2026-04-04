# Đặc tả Ca làm việc & Trinkgeld

**Epic:** E11 — Ca làm việc nhân viên & Trinkgeld  
**Cập nhật lần cuối:** Tháng 4 năm 2026

---

## Tại Sao Có Tính Năng Này

Trong mô hình nhà hàng nơi nhân viên nhận tiền mặt từ thực khách và thanh toán trực tiếp với thu ngân, mỗi nhân viên thu tiền trong suốt ca làm việc rồi nộp lại tổng doanh số cho thu ngân vào cuối ca. Phần chênh lệch giữa số tiền đã nộp và số tiền thực tế thu được là **Trinkgeld** (tiền tip) của họ.

Hệ thống này cung cấp cho mỗi nhân viên một bản ghi rõ ràng và đáng tin cậy để cả thu ngân lẫn nhân viên đều đồng thuận với con số cuối ngày.

---

## Một Ngày Làm Việc Diễn Ra Như Thế Nào

### 1 — Nhân Viên Đăng Nhập và Chấm Công Vào

Sau khi nhập PIN, nhân viên thấy màn hình "Chấm công vào". Họ nhấn **Chấm công vào** để báo hiệu rằng họ đang trong thời gian phục vụ tích cực.

Cho đến khi chấm công vào, hệ thống không tính bất kỳ đơn hàng nào vào tổng Trinkgeld của họ. Điều này bảo vệ nhân viên trong thời gian bàn giao hoặc chuẩn bị đầu ca.

---

### 2 — Nhân Viên Phục Vụ Thực Khách Trong Ngày

Trong khi đang chấm công vào, mỗi đơn hàng được đánh dấu **Đã phục vụ** tại một trong các bàn được giao cho họ sẽ tự động được cộng vào tổng chạy của họ. Nhân viên không cần làm gì thủ công — tổng cập nhật trong nền.

Nhân viên có thể thấy tổng chạy theo thời gian thực ở đầu màn hình sàn: "Tổng ca đến nay: 73,50 €"

---

### 3 — Nhân Viên Nghỉ Giải Lao (Chấm Công Ra và Vào Lại)

Nếu nhân viên cần nghỉ giải lao hoặc tạm thời bàn giao bàn cho đồng nghiệp, họ nhấn **Chấm công ra**.

- Hệ thống dừng tính các đơn hàng mới vào tổng của họ
- Ca làm việc vẫn mở (không mất dữ liệu)
- Họ có thể chấm công vào lại bất kỳ lúc nào — từ cùng điện thoại hoặc bất kỳ thiết bị nào đăng nhập với PIN của họ
- Một nhân viên có thể chấm công vào và ra nhiều lần tùy ý trong một ngày làm việc

Mỗi lần chấm công vào và ra đều được ghi lại với dấu thời gian, tạo ra lịch sử kiểm toán rõ ràng.

---

### 4 — Nhân Viên Kết Thúc Ca

Khi kết thúc ngày làm việc, nhân viên nhấn **Kết thúc ca**. Đây khác với chấm công ra — thao tác này hoàn tất ca vĩnh viễn.

Hệ thống hiển thị màn hình tóm tắt:

| Nội dung | Số liệu |
|----------|---------|
| Số bàn phục vụ hôm nay | 14 |
| Tổng giá trị đơn đã phục vụ | 186,00 € |
| Số tiền cần nộp cho thu ngân | 186,00 € |
| Trinkgeld của bạn | Toàn bộ tiền mặt thu được trên 186,00 € |

Màn hình tóm tắt giải thích rõ: *"Nộp 186,00 € cho thu ngân. Phần tiền mặt dư ra là của bạn giữ."*

Nhân viên có thể lưu hoặc chụp màn hình trước khi đăng xuất.

---

## Các Quy Tắc Quan Trọng

- Chỉ các đơn hàng có trạng thái **Đã phục vụ** mới được tính — đơn đang chờ hoặc đang chuẩn bị không được tính
- Chỉ các đơn hàng tại **các bàn được giao** cho nhân viên mới được tính — không tính đơn tại bàn của nhân viên khác
- Chỉ tính đơn hàng được phục vụ khi nhân viên **đang chấm công vào** — thời gian nghỉ không được tính
- Sau khi ca đã kết thúc, không thể mở lại
- Mỗi nhân viên chỉ có thể có một ca đang mở tại mỗi thời điểm trong một nhà hàng

---

## Chủ Nhà Hàng Thấy Gì

Từ Dashboard Chủ → Tab Nhân viên, chủ có thể:

- Xem nhân viên nào đang chấm công vào
- Xem tổng chạy hiện tại của từng nhân viên đang trong ca
- Xem lại các ca đã hoàn thành: ngày, tên nhân viên, số bàn đã phục vụ, tổng giá trị
- Dùng thông tin này để quyết toán với thu ngân cuối ngày

---

## Đơn Mang Về và Ca Làm Việc

Đơn mang về hoạt động tương tự nhưng không có bàn. Một phiên mang về thuộc về nhà hàng nói chung thay vì bàn của một nhân viên cụ thể.

Nếu chủ hoặc một nhân viên được chỉ định xử lý tất cả đơn mang về, chủ có thể giao việc xử lý mang về cho một nhân viên cụ thể — các đơn đó sẽ được tính vào tổng Trinkgeld của người đó.

Nếu không có phân công, tổng doanh số mang về xuất hiện riêng trong báo cáo ngày nhưng không được gán cho bất kỳ nhân viên cá nhân nào.
