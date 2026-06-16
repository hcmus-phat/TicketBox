# Checklist triển khai task Frontend - Người C

## Nguyên tắc bắt buộc cho AI agent

- Trước khi sửa code, phải đọc codebase hiện tại để hiểu kiến trúc, luồng dữ liệu, API client, routing, state management, auth, admin/public layout và convention đặt tên.
- Phạm vi ưu tiên là `apps/fe`.
- Hạn chế sửa code ngoài frontend. Chỉ được đề xuất sửa backend/config khi thật sự cần để FE hoạt động đúng.
- Trước khi chỉnh sửa bất kỳ file nào ngoài `apps/fe`, AI agent phải dừng lại và hỏi xác nhận trước.
- Mỗi phần cần thêm mới phải giải thích rõ: thêm để làm gì, tác động đến flow nào, phụ thuộc API nào, rủi ro gì.
- Không được thay đổi lớn kiến trúc nếu không cần thiết.
- Không xoá mock/local data ngay lập tức nếu chưa thay bằng API thật ổn định; có thể giữ fallback tạm thời nhưng phải ghi chú rõ.
- Không hardcode dữ liệu demo nếu đã có API thật.
- Ưu tiên hoàn thành flow demo end-to-end hơn animation hoặc UI phụ.

## Quy trình làm việc đề xuất

- [ ] Đọc tổng quan repo và xác định cấu trúc `apps/fe`.
- [ ] Tìm file cấu hình route, API client, auth state, admin layout, public pages.
- [ ] Đối chiếu các task bên dưới với code hiện tại.
- [ ] Lập plan triển khai theo thứ tự ưu tiên P0 trước, P1 sau.
- [ ] Ghi rõ file dự kiến sửa/thêm.
- [ ] Hỏi xác nhận nếu cần sửa ngoài `apps/fe`.
- [ ] Triển khai từng task nhỏ, tránh sửa dàn trải.
- [ ] Chạy lint/build/test nếu project có script tương ứng.
- [ ] Cập nhật checklist sau mỗi task.
- [ ] Chuẩn bị proof/demo theo yêu cầu từng task.

---

## Tuần 1

### C-W1-01 - Thay mock auth/concert bằng API thật

- **Priority:** P0
- **Module:** `apps/fe - Auth/API Client`
- **Status:** Not Started
- **Mục tiêu:** Frontend không còn phụ thuộc local mock data cho luồng public/auth chính.
- **Công việc:** Tạo API client, gắn JWT access token, login/register thật, gọi danh sách concert/detail/ticket-types từ backend.
- **Tiêu chí nghiệm thu:** Register/login thành công; refresh trang vẫn giữ trạng thái; danh sách concert lấy từ DB seed.
- **Dependencies:** Auth API, Concert API
- **Ghi chú kỹ thuật:** Access token lưu phía FE; nếu refresh token dùng cookie thì bật credentials đúng CORS.
- **Demo/Proof:** Video/screenshot Network tab gọi API thật.

Checklist:
- [x] Tìm auth mock/local state hiện tại.
- [x] Tìm concert mock/local data hiện tại.
- [x] Tạo hoặc chuẩn hoá API client.
- [x] Gắn access token vào request.
- [x] Tích hợp register thật.
- [x] Tích hợp login thật.
- [x] Persist auth state sau refresh.
- [x] Gọi API danh sách concert.
- [x] Gọi API concert detail.
- [x] Gọi API ticket types.
- [x] Kiểm tra Network tab không còn dùng mock cho flow chính.

### C-W1-02 - Checkout nối `/orders` và `/payments/create`

- **Priority:** P0
- **Module:** `apps/fe - Checkout`
- **Status:** Not Started
- **Mục tiêu:** User mua vé bằng flow thật từ frontend đến backend.
- **Công việc:** Trang chọn vé gọi `POST /orders` với `Idempotency-Key`, sau đó gọi `POST /payments/create`. Hiển thị trạng thái pending/success/fail.
- **Tiêu chí nghiệm thu:** Chọn vé → tạo order PENDING → mock payment success → chuyển success page.
- **Dependencies:** Orders API, Payments API
- **Ghi chú kỹ thuật:** Disable button sau mỗi click mua để tránh double submit; backend vẫn phải xử lý Idempotency-Key.
- **Demo/Proof:** Video checkout + DB order/payment.

Checklist:
- [x] Tìm flow checkout hiện tại.
- [x] Xác định payload tạo order.
- [x] Sinh `Idempotency-Key` cho mỗi attempt mua.
- [x] Gọi `POST /orders`.
- [x] Gọi `POST /payments/create`.
- [x] Disable nút mua khi request đang chạy.
- [x] Hiển thị trạng thái pending.
- [x] Hiển thị success và chuyển success page.
- [x] Hiển thị fail và cho retry an toàn.
- [ ] Kiểm tra DB có order/payment tương ứng.

### C-W1-03 - My tickets/e-ticket page dùng DB

- **Priority:** P0
- **Module:** `apps/fe - E-ticket`
- **Status:** Not Started
- **Mục tiêu:** Sau thanh toán thành công, user thấy vé thật của mình.
- **Công việc:** Trang `/my-tickets` và success page lấy ticket thật từ API, hiển thị QR, concert, ticketType, buyer.
- **Tiêu chí nghiệm thu:** Payment success → `/my-tickets` hiển thị QR mới; reload không mất dữ liệu.
- **Dependencies:** Ticket API
- **Ghi chú kỹ thuật:** Không dùng LocalStorage làm source dữ liệu vé.
- **Demo/Proof:** Screenshot e-ticket + QR.

Checklist:
- [x] Tìm trang `/my-tickets` hiện tại.
- [x] Tìm success page hiện tại.
- [x] Thay LocalStorage bằng Ticket API.
- [x] Hiển thị QR thật.
- [x] Hiển thị concert.
- [x] Hiển thị ticketType.
- [x] Hiển thị buyer.
- [x] Reload trang vẫn thấy vé.
- [x] Kiểm tra vé thuộc đúng user đang đăng nhập.

### C-W1-04 - UX lỗi nghiệp vụ

- **Priority:** P1
- **Module:** `apps/fe - Error UX`
- **Status:** Not Started
- **Mục tiêu:** Người dùng không gặp màn hình trắng khi backend reject.
- **Công việc:** Hiển thị rõ các lỗi sold-out, vượt maxPerUser, hết hạn reservation, 403, 429 rate limit, 503 circuit breaker.
- **Tiêu chí nghiệm thu:** Mỗi lỗi tạo được bằng test case và hiển thị message riêng.
- **Dependencies:** Backend error codes chuẩn
- **Ghi chú kỹ thuật:** Chuẩn hóa error response từ backend: `code/message/details`.
- **Demo/Proof:** Ảnh từng toast/modal lỗi.

Checklist:
- [x] Xác định format lỗi backend hiện tại.
- [x] Mapping sold-out sang message dễ hiểu.
- [x] Mapping vượt maxPerUser.
- [x] Mapping hết hạn reservation.
- [x] Mapping 403.
- [x] Mapping 429 rate limit.
- [x] Mapping 503 circuit breaker.
- [x] Thêm empty/error state thay vì trắng màn hình.
- [ ] Chụp proof từng lỗi.

### C-W1-05 - Admin UI quản lý TicketType

- **Priority:** P1
- **Module:** `apps/fe - Admin TicketType`
- **Status:** Not Started
- **Mục tiêu:** Admin tạo cấu hình vé mà không cần sửa seed/code.
- **Công việc:** Form tạo/sửa loại vé trong admin concert management, nối API TicketType thật.
- **Tiêu chí nghiệm thu:** Admin thêm loại vé mới → public detail hiển thị → user mua được.
- **Dependencies:** TicketType API, RBAC admin
- **Ghi chú kỹ thuật:** Validate price, quantity, maxPerUser, sale window ở cả FE và BE.
- **Demo/Proof:** Demo admin form.

Checklist:
- [x] Tìm admin concert management hiện tại.
- [x] Tạo form thêm ticket type.
- [x] Tạo form sửa ticket type.
- [x] Validate price.
- [x] Validate quantity.
- [x] Validate maxPerUser.
- [x] Validate sale window.
- [x] Gọi API TicketType thật.
- [x] Public detail hiển thị ticket type mới.
- [x] Checkout mua được ticket type mới.

---

## Tuần 2

### C-W2-01 - Revenue dashboard dùng API thật

- **Priority:** P1
- **Module:** `apps/fe - Admin Dashboard`
- **Status:** Not Started
- **Mục tiêu:** Admin xem được số liệu thật từ DB.
- **Công việc:** Tạo/hoàn thiện `GET /admin/revenue/summary` và `/admin/concerts/:id/revenue` phía BE nếu thiếu, rồi FE hiển thị doanh thu, số vé bán theo loại, order paid/pending/failed.
- **Tiêu chí nghiệm thu:** Sau vài order PAID, dashboard thay đổi đúng theo DB.
- **Dependencies:** Revenue API, payment data
- **Ghi chú kỹ thuật:** Nếu backend chưa có, phối hợp A/B để tạo endpoint tối thiểu. AI agent phải hỏi trước khi sửa BE.
- **Demo/Proof:** Screenshot dashboard + DB aggregate.

Checklist:
- [ ] Tìm dashboard admin hiện tại.
- [ ] Kiểm tra Revenue API đã có chưa.
- [ ] Nếu thiếu API backend, dừng lại hỏi xác nhận trước khi sửa ngoài FE.
- [ ] Hiển thị tổng doanh thu.
- [ ] Hiển thị số vé bán theo loại.
- [ ] Hiển thị order paid/pending/failed.
- [ ] Kiểm tra số liệu thay đổi sau order PAID.
- [ ] Chụp dashboard và DB aggregate.

### C-W2-02 - UI upload CSV + report dòng lỗi

- **Priority:** P1
- **Module:** `apps/fe - Guest Import UI`
- **Status:** Not Started
- **Mục tiêu:** CSV Guest List không chỉ có API, admin thao tác được trên UI.
- **Công việc:** Admin upload guest list CSV, xem batch status, số valid/duplicate/invalid và tải/xem dòng lỗi.
- **Tiêu chí nghiệm thu:** Upload CSV 100 dòng → UI hiện summary và dòng lỗi.
- **Dependencies:** Guest import API
- **Ghi chú kỹ thuật:** Polling status batch hoặc refresh thủ công đủ cho demo.
- **Demo/Proof:** Video UI import.

Checklist:
- [ ] Tìm hoặc tạo trang admin guest import trong FE.
- [ ] Thêm upload CSV UI.
- [ ] Gọi API upload guest list.
- [ ] Hiển thị batch status.
- [ ] Hiển thị số valid.
- [ ] Hiển thị số duplicate.
- [ ] Hiển thị số invalid.
- [ ] Hiển thị/tải dòng lỗi.
- [ ] Kiểm tra với CSV 100 dòng.

### C-W2-03 - UI upload PDF + chỉnh sửa bio

- **Priority:** P1
- **Module:** `apps/fe - AI Bio UI`
- **Status:** Not Started
- **Mục tiêu:** AI Bio có luồng quản trị hoàn chỉnh.
- **Công việc:** Admin upload PDF nghệ sĩ, xem trạng thái processing/success/failed, xem bio sinh ra và chỉnh sửa thủ công.
- **Tiêu chí nghiệm thu:** Upload PDF → UI polling đến success → bio xuất hiện ở concert public; admin edit được.
- **Dependencies:** AI Bio API
- **Ghi chú kỹ thuật:** Luôn cho phép manual edit để phòng AI lỗi.
- **Demo/Proof:** Video AI bio flow.

Checklist:
- [ ] Tìm admin concert/artist bio UI hiện tại.
- [ ] Thêm upload PDF UI.
- [ ] Gọi API upload PDF.
- [ ] Polling trạng thái processing/success/failed.
- [ ] Hiển thị bio sinh ra.
- [ ] Cho phép admin sửa bio thủ công.
- [ ] Lưu bio đã chỉnh sửa.
- [ ] Public concert hiển thị bio.

### C-W2-04 - Notification bell + my tickets polish

- **Priority:** P1
- **Module:** `apps/fe - Notifications`
- **Status:** Not Started
- **Mục tiêu:** User thấy thông báo mua vé thành công ngay trong app.
- **Công việc:** In-app notification bell: số chưa đọc, dropdown danh sách, mark as read. My tickets/e-ticket responsive.
- **Tiêu chí nghiệm thu:** Payment success → bell hiện 1; mở dropdown thấy notification.
- **Dependencies:** Notification API
- **Ghi chú kỹ thuật:** Nếu chưa có realtime, polling cũng đủ demo.
- **Demo/Proof:** Screenshot notification bell.

Checklist:
- [ ] Tìm layout/header hiện tại.
- [ ] Thêm notification bell.
- [ ] Hiển thị unread count.
- [ ] Hiển thị dropdown danh sách notification.
- [ ] Gọi mark as read.
- [ ] Payment success tạo/hiển thị notification.
- [ ] My tickets responsive.
- [ ] E-ticket responsive.

### C-W2-05 - Polish UX và responsive

- **Priority:** P1
- **Module:** `apps/fe - Responsive/Error Polish`
- **Status:** Not Started
- **Mục tiêu:** Flow demo mượt, không trắng màn hình.
- **Công việc:** Fix mobile responsive, loading skeleton, disabled states, retry buttons, empty states; kiểm tra admin và public.
- **Tiêu chí nghiệm thu:** Mở bằng màn hình nhỏ vẫn mua vé/xem QR được; admin pages không vỡ layout.
- **Dependencies:** Core FE integration done
- **Ghi chú kỹ thuật:** Ưu tiên flow demo hơn animation/trang phụ.
- **Demo/Proof:** Before/after screenshots.

Checklist:
- [ ] Kiểm tra public pages trên mobile.
- [ ] Kiểm tra admin pages trên mobile/tablet.
- [ ] Thêm loading skeleton ở flow chính.
- [ ] Thêm disabled states cho form/button.
- [ ] Thêm retry buttons cho API fail.
- [ ] Thêm empty states.
- [ ] Chụp before/after.

### C-W2-06 - Video segment C

- **Priority:** P0
- **Module:** Video
- **Status:** Not Started
- **Mục tiêu:** Có clip frontend end-to-end để ghép video cuối.
- **Công việc:** Quay flow khán giả: register/login → xem concert → chọn vé → thanh toán → nhận QR. Quay admin: tạo concert/ticketType, dashboard, guest/AI nếu có.
- **Tiêu chí nghiệm thu:** Clip khoảng 10 phút, camera bật, thao tác thật không dùng mock local.
- **Dependencies:** FE stable
- **Ghi chú kỹ thuật:** Chuẩn bị dữ liệu seed trước khi quay.
- **Demo/Proof:** Video file MP4.

Checklist:
- [ ] Chuẩn bị dữ liệu seed.
- [ ] Kiểm tra register/login thật.
- [ ] Kiểm tra xem concert thật.
- [ ] Kiểm tra chọn vé thật.
- [ ] Kiểm tra thanh toán/mock payment thật.
- [ ] Kiểm tra nhận QR thật.
- [ ] Quay flow khán giả.
- [ ] Quay admin tạo concert/ticketType.
- [ ] Quay dashboard.
- [ ] Quay guest import nếu có.
- [ ] Quay AI bio nếu có.
- [ ] Xuất MP4.

---

## Prompt dùng cho AI agent

```text
Bạn là AI coding agent hỗ trợ triển khai các task frontend cho project. Nhiệm vụ của bạn là đọc codebase hiện tại, lập kế hoạch kỹ thuật, sau đó triển khai cẩn thận theo checklist.

Bối cảnh:
- Người thực hiện: Người C.
- Phạm vi chính: `apps/fe`.
- Mục tiêu: Hoàn thiện frontend tích hợp API thật cho auth, concert, checkout, e-ticket, admin ticket type, dashboard, guest import, AI bio, notification, responsive polish và video proof.
- Không được giả định kiến trúc nếu chưa đọc codebase.

Quy tắc bắt buộc:
1. Trước khi sửa code, hãy đọc codebase để hiểu cấu trúc project, routing, API client, auth state, admin/public pages, component convention, env config và scripts build/lint/test.
2. Ưu tiên sửa trong `apps/fe`.
3. Hạn chế sửa code ngoài frontend.
4. Trước khi chỉnh sửa bất kỳ file nào ngoài `apps/fe`, phải dừng lại và hỏi xác nhận. Khi hỏi, nêu rõ:
   - File/backend module cần sửa là gì.
   - Vì sao FE không thể hoàn thành nếu không sửa phần đó.
   - Thay đổi đó có tác dụng gì.
   - Rủi ro hoặc ảnh hưởng đến các module khác.
5. Mỗi component, helper, hook, API client, page hoặc state mới cần thêm phải giải thích ngắn gọn:
   - Thêm để làm gì.
   - Được dùng ở flow nào.
   - Phụ thuộc API/env nào.
   - Có thay thế mock/local data nào không.
6. Không xoá mock/local data nếu chưa thay bằng API thật hoạt động ổn định. Nếu giữ fallback, phải ghi chú rõ là fallback tạm thời.
7. Không hardcode dữ liệu demo nếu backend đã có API thật.
8. Không refactor lớn ngoài phạm vi task nếu không cần thiết.
9. Không làm vỡ flow hiện có. Sau mỗi nhóm thay đổi phải kiểm tra lại flow liên quan.
10. Ưu tiên hoàn thành P0 trước P1.

Task cần triển khai:

Tuần 1:
- C-W1-01/P0: Thay mock auth/concert bằng API thật. Tạo API client, gắn JWT access token, login/register thật, gọi danh sách concert/detail/ticket-types từ backend. Acceptance: register/login thành công; refresh trang vẫn giữ trạng thái; danh sách concert lấy từ DB seed.
- C-W1-02/P0: Checkout nối `POST /orders` và `POST /payments/create`. Dùng `Idempotency-Key`, disable button chống double submit, hiển thị pending/success/fail. Acceptance: chọn vé → tạo order PENDING → mock payment success → success page.
- C-W1-03/P0: `/my-tickets` và success page dùng Ticket API thật, hiển thị QR, concert, ticketType, buyer. Không dùng LocalStorage làm source dữ liệu vé. Acceptance: payment success → `/my-tickets` có QR mới; reload không mất dữ liệu.
- C-W1-04/P1: UX lỗi nghiệp vụ cho sold-out, maxPerUser, reservation expired, 403, 429, 503. Acceptance: mỗi lỗi có message riêng, không trắng màn hình.
- C-W1-05/P1: Admin UI quản lý TicketType. Form tạo/sửa ticket type, nối API thật, validate price/quantity/maxPerUser/sale window. Acceptance: admin thêm loại vé mới → public detail hiển thị → user mua được.

Tuần 2:
- C-W2-01/P1: Revenue dashboard dùng API thật. FE hiển thị doanh thu, số vé bán theo loại, order paid/pending/failed. Nếu thiếu backend endpoint `GET /admin/revenue/summary` hoặc `/admin/concerts/:id/revenue`, phải hỏi trước khi sửa backend. Acceptance: sau vài order PAID, dashboard thay đổi đúng theo DB.
- C-W2-02/P1: UI upload CSV guest list + report dòng lỗi. Hiển thị batch status, số valid/duplicate/invalid, xem/tải dòng lỗi. Acceptance: upload CSV 100 dòng → UI hiện summary và dòng lỗi.
- C-W2-03/P1: UI upload PDF nghệ sĩ + chỉnh sửa bio. Hiển thị processing/success/failed, bio sinh ra, cho phép edit manual. Acceptance: upload PDF → polling success → bio xuất hiện ở public concert; admin edit được.
- C-W2-04/P1: Notification bell + my tickets polish. Hiển thị unread count, dropdown list, mark as read. Nếu chưa realtime thì polling đủ cho demo. Acceptance: payment success → bell hiện 1; mở dropdown thấy notification.
- C-W2-05/P1: Polish UX/responsive. Fix mobile responsive, loading skeleton, disabled states, retry buttons, empty states. Acceptance: mobile vẫn mua vé/xem QR được; admin pages không vỡ layout.
- C-W2-06/P0: Chuẩn bị video segment C. Quay flow khán giả register/login → xem concert → chọn vé → thanh toán → nhận QR. Quay admin tạo concert/ticketType, dashboard, guest/AI nếu có. Clip khoảng 10 phút, thao tác thật, không dùng mock local.

Cách làm việc mong muốn:
1. Đọc repo và trả về bản phân tích ngắn:
   - FE framework và cấu trúc chính.
   - Các file quan trọng đã tìm thấy.
   - API/env hiện có.
   - Mock/local data hiện có.
   - Rủi ro chính.
2. Lập implementation plan theo thứ tự P0 → P1.
3. Liệt kê file dự kiến sửa/thêm.
4. Chỉ triển khai sau khi plan rõ ràng.
5. Nếu cần sửa ngoài `apps/fe`, phải hỏi xác nhận trước.
6. Sau khi sửa, chạy lệnh kiểm tra phù hợp như lint/build/test nếu project có script.
7. Cập nhật kết quả theo từng task: Done / Partial / Blocked, kèm proof cần chụp/quay.

Output cuối cùng cần có:
- Danh sách task đã hoàn thành.
- Danh sách task còn blocked và lý do.
- File đã sửa/thêm.
- Lệnh đã chạy để kiểm tra.
- Hướng dẫn demo/proof cho từng task.
```
