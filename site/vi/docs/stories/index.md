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
| E7 | Hệ thống in vé nhiệt | 🔲 Kế hoạch |
| E8 | Dashboard nhân viên phục vụ | 🔲 Kế hoạch |
| E9 | Dashboard chủ nhà hàng & Báo cáo | 🔲 Kế hoạch |
| E10 | Panel quản trị nền tảng | 🔲 Kế hoạch |
| E11 | Ca làm việc nhân viên & Trinkgeld | 🔲 Kế hoạch |
| E12 | Nhận dạng nhà hàng & Subdomain | 🔲 Kế hoạch |

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
| Thiết lập .NET Aspire AppHost cho dev local | Project AppHost tham chiếu API + local Supabase container; `dotnet run --project AppHost` khởi động toàn bộ dev stack; chỉ dùng khi dev, không có trong production images | 🔲 Kế hoạch |
| Cài đặt PWA manifest và Service Worker | `/manifest.json` có mặt; Service Worker cache tài nguyên SPA; có thể cài đặt trên iOS Safari 15+ và Android Chrome 100+ | 🔲 Kế hoạch |

---

## E2 — Xác thực & Đa tenant

**Với vai trò** chủ nhà hàng / nhân viên, **tôi muốn** xác thực phân quyền an toàn **để** chỉ người dùng được phép mới truy cập dữ liệu phù hợp.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Chủ nhà hàng đăng ký qua Google OAuth | Supabase social login; tài khoản tạo với trạng thái "Chờ phê duyệt"; không thể truy cập nền tảng cho đến khi được phê duyệt |
| PlatformAdmin phê duyệt tài khoản chủ nhà hàng | Admin phê duyệt sau khi xác nhận thanh toán phí; trạng thái chủ chuyển sang "Hoạt động" |
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
| Tạo nhóm modifier cho món ăn | Chủ nhà hàng tạo nhóm modifier với tên, is_required, min_selections, max_selections; nhóm gắn với một món cụ thể |
| Thêm modifier vào nhóm | Chủ nhà hàng thêm tùy chọn tên modifier với price_delta_eur_cents tuỳ chọn; delta âm được phép |
| Sắp xếp lại và xoá nhóm modifier | Nhóm đã xoá không hiển thị với thực khách; sắp xếp được lưu |

---

## E4 — Quản lý bàn & Mã QR

**Với vai trò** chủ nhà hàng, **tôi muốn** quản lý bàn ăn và mã QR **để** thực khách luôn truy cập đúng phiên.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Thêm / đổi tên / vô hiệu hoá bàn | Danh sách bàn phản ánh thay đổi ngay lập tức |
| Xem và tải mã QR nhà hàng | Mã QR nhà hàng duy nhất được ký HMAC hiển thị trong Owner Dashboard; có thể tải về dạng PNG |
| Tạo lại mã QR nhà hàng | Mã QR cũ chuyển đến trang “không hợp lệ”; mã mới hoạt động bình thường |
| Thực khách chọn số bàn khi thanh toán | Thanh toán hiển thị dropdown số bàn; trường bắt buộc trước khi gửi đơn; số bàn lưu vào Order |

---

## E5 — Luồng đặt món của thực khách

**Với vai trò** thực khách, **tôi muốn** duyệt menu và đặt món từ điện thoại **để** không cần chờ nhân viên phục vụ.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Thực khách quét QR và thấy menu | Trang tải < 2s trên 4G; không hiện thông báo cài app; menu hiển thị đúng |
| Thực khách duyệt danh mục và món | Danh mục hiển thị; chi tiết món (tên, mô tả, giá, ảnh) có thể xem |
| Thực khách thêm món vào giỏ | Giỏ cập nhật; badge hiển thị số lượng món |
| Thực khách thêm ghi chú vào món | Ghi chú dạng text tự do được lưu cùng dòng order || Thực khách chọn modifier bắt buộc trước khi thêm vào giỏ | Nút “Thêm vào giỏ” bị vô hiệu cho đến khi chọn đủ modifier bắt buộc; vi phạm validation hiển thị lỗi rõ ràng |
| Thực khách chọn modifier tuỳ chọn | Nhóm modifier tuỳ chọn hiển thị là add-on có thể chọn thêm; chênh lệch giá cập nhật tổng giỏ hàng |
| Thực khách chọn số bàn khi thanh toán | Dropdown trong luồng thanh toán; bắt buộc; số bàn lưu vào đơn hàng || Thực khách xem lại và xác nhận đơn | Hiện tóm tắt; đơn được gửi khi xác nhận; màn hình xác nhận có số đơn |
| Thực khách đặt thêm order trong cùng phiên | Các order tiếp theo liên kết với cùng phiên bàn |
| Món hết hàng hiển thị nhưng không thể đặt | Mờ đi; nhãn "Hết hàng"; nút thêm vào giỏ bị tắt || Nhiều thực khách cùng bàn cùng đặt món | Mỗi thực khách quét cùng mã QR và duyệt menu độc lập; tất cả đơn hàng được gộp vào cùng phiên bàn tự động — không cần phối hợp giữa các thực khách |
| Thực khách đặt mang về | Phiên mang về hoạt động tương tự — thực khách duyệt, đặt, theo dõi trạng thái; không cần gán bàn; phiên tự đóng khi tất cả món được đánh dấu đã phục vụ |
| Bàn được đặt lại sạch sẽ cho nhóm khách tiếp theo | Sau khi nhân viên đóng bàn, mã QR ngay lập tức bắt đầu phiên mới; nhóm khách mới có thể quét và đặt hàng mà không cần chờ đợi |
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

## E7 — Hệ thống in vé nhiệt

**Với vai trò** nhân viên bếp hoặc quầy bar, **tôi muốn** đơn hàng tự động in ra máy in nhiệt của tôi **để** tôi có thể chuẩn bị món mà không cần nhìn vào màn hình.

| Story | Tiêu chí chấp nhận |
|-------|-----------------|
| Gắn nhãn loại món ăn | Chủ nhà hàng có thể đặt item_type (food/drink) cho từng món; trường bắt buộc |
| Đồ ăn tự in lên máy in bếp | Khi đặt đơn, đồ ăn định tuyến đến máy in nhiệt bếp; vé in hiển thị số bàn, số đơn, món, số lượng, ghi chú |
| Đồ uống tự in lên máy in bar | Khi đặt đơn, đồ uống định tuyến đến máy in nhiệt quầy bar; cùng định dạng vé |
| Đơn hỗn hợp in trên cả hai máy | Đơn có cả đồ ăn lẫn đồ uống kích hoạt cả hai máy in độc lập |
| Chủ nhà hàng đăng ký device token máy in bếp | Owner Dashboard tạo kitchen device token; token lưu trong backend; dùng để máy in bếp xác thực khi polling |
| Chủ nhà hàng đăng ký device token máy in bar | Tương tự kitchen token nhưng cho bar; token riêng biệt cho phép định tuyến độc lập |
| Máy in bếp polling CloudPRNT endpoint | Máy in Star mC-Print3 gọi `GET /api/print/poll?deviceToken=<kitchen_token>` mỗi 2–3s; nhận Base64 ESC/POS khi có job |
| Máy in bar polling CloudPRNT endpoint | Máy in bar gọi `GET /api/print/poll?deviceToken=<bar_token>`; cùng luồng với bếp |
| Máy in xác nhận hoàn thành job | Sau khi in, máy in gọi `POST /api/print/status/{jobId}` để đánh dấu hoàn thành; không có xác nhận sau 30s thì job được đưa lại hàng chờ |
| Cảnh báo nhân viên khi lỗi in | Nếu máy in offline, Dashboard nhân viên hiển thị cảnh báo kèm chi tiết đơn bị ảnh hưởng |

---

## E8 — Dashboard nhân viên phục vụ

**Với vai trò** nhân viên, **tôi muốn** xem tất cả trạng thái bàn và đơn hàng **để** tôi quản lý phục vụ hiệu quả.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Nhân viên đăng nhập bằng PIN | PIN được xác thực; nhân viên giới hạn trong nhà hàng của họ |
| Nhân viên chấm công vào để bắt đầu phục vụ | Sau khi đăng nhập, nhân viên nhấn nút “Chấm công vào” để đánh dấu bắt đầu thời gian phục vụ; hệ thống ghi lại thời gian chính xác |
| Nhân viên chấm công ra tạm thời | Nhân viên có thể nhấn “Chấm công ra” bất kỳ lúc nào — ví dụ trong giờ nghỉ hoặc khi bàn giao — mà không kết thúc ca làm việc; thời gian nghỉ không được tính vào tổng doanh số |
| Nhân viên chấm công vào lại sau giờ nghỉ | Nhân viên có thể chấm công vào lại nhiều lần trong cùng một ngày làm việc; mỗi cặp vào/ra được theo dõi riêng biệt |
| Nhân viên chỉ thấy bàn được phân công | Màn hình sàn chỉ hiển thị các bàn được chủ nhà hàng giao cho nhân viên đó; các bàn khác có thể nhìn thấy nhưng bị mờ và không thể tương tác |
| Màn hình sàn hiển thị trạng thái bàn | Mỗi bàn được phân công của nhân viên hiển thị: trống / có khách / có đơn sẵn sàng — cập nhật theo thời gian thực |
| Nhân viên xem đơn hàng theo bàn | Danh sách đơn đầy đủ cho một bàn; trạng thái từng món hiển thị |
| Nhân viên đóng bàn sau khi thực khách thanh toán | Sau khi thực khách thanh toán, nhân viên nhấn “Đóng bàn”; bàn đặt lại thành trống và nhóm khách tiếp theo có thể bắt đầu phiên mới ngay lập tức |
| Nhân viên có thể huỷ đơn hàng | Trạng thái đơn chuyển sang “Đã huỷ”; thực khách được thông báo |
| Nhân viên kết thúc ca làm việc | Khi ca xong, nhân viên nhấn “Kết thúc ca” để hoàn tất ngày làm việc; hệ thống tính tổng giá trị tất cả đơn đã phục vụ tại bàn của họ trong các khoảng thời gian đã chấm công |
| Nhân viên xem tóm tắt Trinkgeld | Sau khi kết thúc ca, nhân viên thấy tóm tắt rõ ràng: số bàn đã phục vụ, tổng giá trị đơn hàng, và số tiền cần nộp lại cho thu ngân; phần còn lại là Trinkgeld của họ — [đặc tả chi tiết →](staff-sessions-spec/) |

---

## E9 — Dashboard chủ nhà hàng & Báo cáo

**Với vai trò** chủ nhà hàng, **tôi muốn** có dashboard quản lý **để** tôi vận hành nhà hàng và theo dõi hiệu suất kinh doanh.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Chủ quản lý PIN nhân viên | Có thể tạo, cập nhật, vô hiệu hoá tài khoản nhân viên |
| Chủ sửa hồ sơ nhà hàng | Tên, logo, địa chỉ, giờ mở cửa được lưu và phản ánh công khai |
| Chủ xem báo cáo doanh thu ngày | Bộ chọn ngày mặc định là hôm nay; bảng hiển thị tên món, đơn giá, số lượng đặt (trừ đơn hủy) và thành tiền; thẻ tóm tắt hiển thị tổng Doanh thu ước tính; nút "Xuất PDF" kích hoạt tạo PDF phía server (QuestPDF); hiển thị trạng thái loading khi đang tạo; trình duyệt tự tải xuống PDF; hiển thị trạng thái trống nếu không có đơn; trả về 403 nếu yêu cầu dữ liệu nhà hàng khác — [đặc tả chi tiết →](daily-report-spec.md) || Chủ nhà hàng giao bàn cho từng nhân viên | Trong phần Quản lý nhân viên, chủ chọn bàn nào thuộc nhân viên nào; nhân viên chỉ thấy và quản lý các bàn được giao trong ca làm việc |
| Chủ đóng ngày | Chủ nhấn “Đóng ngày” để tạo báo cáo doanh thu cuối ngày; báo cáo bao gồm tất cả đơn đã phục vụ trong ngày (trừ đơn hủy), tổng doanh thu và phân tích doanh số theo từng nhân viên |
| Báo cáo ngày lưu trong 48 giờ | Báo cáo được tạo có thể truy cập trong 48 giờ; sau đó tự động bị xóa; thời gian hết hạn được hiển thị rõ ràng khi mở báo cáo |
---

## E10 — Panel quản trị nền tảng

**Với vai trò** quản trị viên nền tảng, **tôi muốn** quản lý các tenant nhà hàng **để** tôi onboard và hỗ trợ khách hàng.

| Story | Tiêu chí chấp nhận |
|-------|--------------------|
| Admin tạo tenant nhà hàng | Bản ghi nhà hàng được tạo; email mời tài khoản chủ nhà hàng được gửi |
| Admin xem tất cả tenant | Bảng hiển thị tên nhà hàng, email chủ, trạng thái (pending/active/suspended), số đơn hàng |
| Admin xem xét đăng ký chờ phê duyệt | Danh sách chủ nhà hàng có trạng thái "Chờ phê duyệt"; hiển thị thông tin Google; hành động phê duyệt/từ chối |
| Admin phê duyệt chủ nhà hàng | Trạng thái chuyển sang "Hoạt động"; chủ nhận thông báo và có thể truy cập dashboard |
| Admin tạm dừng / kích hoạt lại nhà hàng | Nhà hàng bị tạm dừng hiển thị trang bảo trì với thực khách |
| Admin gán URL slug cho nhà hàng | Khi duyệt nhà hàng mới, admin xác nhận tên ngắn (slug) duy nhất của nhà hàng, ví dụ “pho-saigon”; tên này trở thành phần địa chỉ web tại pho-saigon.contactless-order-system.de |
| Admin xem báo cáo ngày tổng hợp | Admin có thể chọn ngày bất kỳ và xem tóm tắt từ tất cả nhà hàng đang hoạt động: số đơn hàng và tổng doanh thu theo từng nhà hàng trong ngày đó |

---

## E11 — Ca làm việc nhân viên & Trinkgeld

**Với vai trò** nhân viên phục vụ, **tôi muốn** theo dõi doanh số của mình trong ca làm việc **để** tôi biết mình kiếm được bao nhiêu Trinkgeld và quyết toán đúng với thu ngân.

| Story | Tiêu chí chấp nhận |
|-------|-----------------------|
| Nhân viên hiểu khái niệm chấm công vào | Ứng dụng làm rõ rằng chấm công vào nghĩa là “Tôi đang phục vụ”; không có gì được tính trong khi chưa chấm công vào |
| Chấm công vào và ra có thể thực hiện nhiều lần | Một nhân viên có thể chấm công vào và ra ba lần trong một ngày (ví dụ ca trưa, giờ nghỉ, ca tối); tất cả các khoảng thời gian hoạt động được cộng lại |
| Doanh số chỉ tính trong thời gian hoạt động | Đơn được phục vụ khi nhân viên đã chấm công ra không được tính vào Trinkgeld |
| Tóm tắt ca hiển thị vào cuối ngày | Màn hình tóm tắt hiển thị rõ: tổng giá trị đơn được phục vụ, số tiền cần nộp cho thu ngân, và phần còn lại là Trinkgeld của nhân viên |
| Dữ liệu ca tồn tại trong giờ nghỉ | Nếu nhân viên chấm công ra và đăng xuất khỏi ứng dụng, ca vẫn đang mở; chấm công vào lại từ bất kỳ thiết bị nào tiếp tục cùng ca đó |
| Chủ xem được tóm tắt ca của từng nhân viên | Chủ có thể xem lại chi tiết ca theo từng nhân viên từ dashboard chủ nhà hàng — hợp ích cho việc quyết toán cuối ngày |

*Mô tả luồng và màn hình chi tiết → [Đặc tả ca làm việc nhân viên](staff-sessions-spec/)*

---

## E12 — Nhận dạng nhà hàng & Subdomain

**Với vai trò** chủ nhà hàng, **tôi muốn** nhà hàng của tôi có địa chỉ web riêng **để** thực khách có đường dẫn gọn gàng và dễ nhận biết để quét.

| Story | Tiêu chí chấp nhận |
|-------|-----------------------|
| Mỗi nhà hàng có tên ngắn duy nhất (slug) | Khi nhà hàng được phê duyệt, họ nhận được tên ngắn như “pho-saigon”; tên này được dùng trong tất cả URL của nhà hàng đó |
| Nhà hàng truy cập được qua subdomain riêng | Thực khách và nhân viên vào nhà hàng tại pho-saigon.contactless-order-system.de — không có số ID nhà hàng hiển thị trong địa chỉ |
| Mã QR sử dụng URL subdomain có thương hiệu | Tất cả mã QR tạo cho các bàn dùng địa chỉ subdomain của nhà hàng; quét mã QR đưa thực khách trực tiếp đến menu nhà hàng đó |
| Đăng nhập nhân viên cũng giới hạn trong subdomain | Nhân viên đăng nhập tại subdomain của nhà hàng riêng; nhà hàng đúng được xác định tự động |
| Dashboard chủ truy cập được tại subdomain | Chủ quản lý nhà hàng từ địa chỉ subdomain của họ |
| Slug duy nhất trên toàn nền tảng | Hai nhà hàng không thể có cùng slug; admin giải quyết xung đột tại thời điểm đăng ký |

---

*Stories được cập nhật liên tục theo tiến độ sprint. Cập nhật lần cuối: Tháng 4 năm 2026.*
