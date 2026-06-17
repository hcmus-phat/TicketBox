# Báo cáo Khoảng cách API Backend - Frontend (API Gap Report)
**Ngày lập:** 18/06/2026
**Mục tiêu:** Ghi nhận các trang, tính năng phía Frontend (`apps/fe`) hiện đang phải dùng Mock Data (LocalStorage/Mock file) và đề xuất các API Backend cần bổ sung để hệ thống hoạt động hoàn chỉnh.

---

## 1. Danh sách các Trang/Tính năng hiện chưa có API thật

### 1.1. Luồng Mua vé và Vé của khách hàng (Public Flow)

#### 1. Trang Đặt vé thành công (`/success`)
*   **Hiện trạng:** Khi thanh toán thành công (hoặc thất bại), FE chuyển hướng đến `/success?orderId=...`. Tuy nhiên, trang này hiện đang lấy thông tin chi tiết đơn hàng từ LocalStorage qua `getStoredMockOrder(orderId)`.
*   **Thiếu API:** 
    *   `GET /orders/:id`: Lấy chi tiết đơn hàng bằng `orderId` (bao gồm tổng số tiền, trạng thái thanh toán, thông tin Concert, và danh sách vé đi kèm).
*   **Hậu quả:** FE không thể hiển thị thông tin hóa đơn thật và mã QR vé điện tử từ cơ sở dữ liệu.

#### 2. Trang Vé của tôi (`/my-tickets`)
*   **Hiện trạng:** Đang dùng `getStoredMockOrders()` từ LocalStorage để hiển thị danh sách vé e-ticket của tài khoản đang đăng nhập.
*   **Thiếu API:**
    *   `GET /orders` hoặc `GET /tickets`: Lấy toàn bộ danh sách đơn hàng đã thanh toán thành công và danh sách các vé thuộc quyền sở hữu của user hiện tại.
*   **Hậu quả:** Khách hàng tải lại trang hoặc đăng nhập thiết bị khác sẽ không thấy vé đã mua.

#### 3. Trang chọn Ghế và Sơ đồ Zone (`/concert/:id`)
*   **Hiện trạng:** Khi người dùng click vào chi tiết concert và chọn zone/ghế, hàm `getTicketZonesAsync` và `getSeatsAsync` trong `apps/fe/lib/api.ts` đang dùng cơ chế fallback: nếu concert trong DB chưa cấu hình `seatZones` hoặc `ticketTypes`, FE tự sinh ra các zone giả lập (`svip`, `vip`, `premium`, `standard`, `economy`) và các hàng ghế A, B, C, D (12 ghế mỗi hàng) từ file `mock-data.ts`.
*   **Thiếu API/Dữ liệu:**
    *   Cơ sở dữ liệu hoặc API cần trả về danh sách sơ đồ ghế thực tế đầy đủ của từng concert để đồng bộ trạng thái ghế (đã bán, đang giữ chỗ, còn trống).
*   **Hậu quả:** Dữ liệu ghế ngồi chỉ là giả lập và không được đồng bộ theo thời gian thực giữa các user.

#### 4. Cập nhật trạng thái sau khi thanh toán giả lập (`/mock-payment`)
*   **Hiện trạng:** Khi bấm nút "Thanh toán Thành công" ở trang giả lập, FE gọi hàm `createMockOrderFromDraft` để ghi nhận đơn hàng thành công vào LocalStorage. Tuy nhiên, backend vẫn ghi nhận đơn hàng ở trạng thái `PENDING_PAYMENT` (hoặc chưa sinh vé thật).
*   **Thiếu API/Webhook xử lý:**
    *   Cần API hoặc Webhook callback thanh toán thật/giả lập để chuyển trạng thái Order sang `PAID` và tự động sinh mã QR vé (`Ticket`) lưu vào DB.

---

### 1.2. Luồng Quản trị hệ thống (Admin Flow - Tuần 2)

#### 5. Trang Admin Dashboard (`/admin/dashboard`)
*   **Hiện trạng:** Đang import `adminStats` và `concerts` trực tiếp từ `@/lib/mock-data`.
*   **Thiếu API:**
    *   `GET /admin/revenue/summary`: Lấy số liệu tổng doanh thu, số vé đã bán theo từng loại vé, số đơn hàng thành công/đang chờ/thất bại để vẽ biểu đồ doanh thu.
    *   `GET /admin/concerts/:id/revenue`: Chi tiết doanh thu của từng concert cụ thể.

#### 6. Trang Admin Quản lý Danh sách Concert (`/admin/concerts`)
*   **Hiện trạng:** Đang import danh sách concert từ mock data để admin quản lý.
*   **Thiếu API:**
    *   `GET /admin/concerts`: Danh sách concert đầy đủ dành riêng cho admin quản trị (kèm thông tin chi tiết về số lượng vé đã bán, tổng doanh thu của từng show).

#### 7. CRUD Cấu hình Loại vé (`TicketType`) trong Concert
*   **Hiện trạng:** Admin thêm, sửa, xóa loại vé trong trang quản lý concert đang sử dụng API `/concerts/:concertId/ticket-types`. Tuy nhiên, nếu API Backend trả về lỗi (do chưa triển khai endpoint), FE sẽ tự động fallback lưu thông tin loại vé mới vào LocalStorage (`ticketbox-local-ticket-types`).
*   **Thiếu API hoàn chỉnh:**
    *   `POST /concerts/:concertId/ticket-types` (Tạo loại vé mới)
    *   `PATCH /concerts/:concertId/ticket-types/:id` (Cập nhật cấu hình loại vé)
    *   `DELETE /concerts/:concertId/ticket-types/:id` (Xóa loại vé)
*   **Hậu quả:** Cấu hình vé của admin bị lưu cục bộ, người dùng ở máy khác không thể thấy loại vé mới để mua.

#### 8. Upload danh sách khách mời CSV (`/admin/guests` hoặc `Guest Import UI`)
*   **Hiện trạng:** Chưa có giao diện và API thật để import danh sách khách mời.
*   **Thiếu API:**
    *   `POST /admin/guests/import`: Upload file CSV chứa danh sách khách mời.
    *   `GET /admin/guests/batches/:batchId`: Xem trạng thái tiến trình xử lý import (Valid/Duplicate/Invalid).
    *   `GET /admin/guests/batches/:batchId/errors`: Tải/xem danh sách các dòng bị lỗi trong file CSV để admin sửa đổi.

#### 9. Upload PDF tiểu sử nghệ sĩ và AI Bio (`/admin/ai-bio`)
*   **Hiện trạng:** Chưa có giao diện quản lý file PDF tiểu sử nghệ sĩ và AI Bio generator.
*   **Thiếu API:**
    *   `POST /admin/concerts/:id/ai-bio/upload`: Tải lên file PDF tiểu sử.
    *   `GET /admin/concerts/:id/ai-bio/status`: Polling trạng thái sinh Bio tự động từ AI (processing/success/failed).
    *   `PATCH /admin/concerts/:id/bio`: Cho phép sửa đổi Bio thủ công và lưu lại.

---

### 1.3. Hệ thống Thông báo và Tiện ích (Notifications & Layout)

#### 10. Notification Bell trên Header
*   **Hiện trạng:** Icon chuông thông báo trên Header hiện tại chỉ hiển thị danh sách mock tĩnh.
*   **Thiếu API:**
    *   `GET /notifications`: Lấy danh sách thông báo của user hiện tại (ví dụ: thông báo mua vé thành công, nhắc nhở sự kiện).
    *   `PATCH /notifications/:id/read` hoặc `POST /notifications/mark-all-read`: Đánh dấu thông báo đã đọc.

---

## 2. Tổng hợp các Endpoint Backend đề xuất bổ sung (API Specification Proposals)

Dưới đây là đặc tả kỹ thuật chi tiết của các endpoint đề xuất để đội ngũ Backend (`apps/be`) triển khai:

### 2.1. Đơn hàng & Vé (Orders & Tickets)
| Phương thức | Endpoint | Mô tả | Tham số truyền vào (Payload/Query) | Dữ liệu trả về (Data) |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/orders/:id` | Lấy chi tiết một đơn hàng | *Không* | Chi tiết đơn hàng (`Order`), Concert, và các `OrderItem` kèm thông tin `TicketType` tương ứng. |
| **GET** | `/orders` | Danh sách đơn hàng của User đăng nhập | *Không* | Mảng các đơn hàng (`Order[]`) |
| **GET** | `/tickets` | Danh sách vé của User đăng nhập | *Không* | Mảng các vé (`Ticket[]` kèm mã QR, tên Concert, loại vé, số ghế) |

### 2.2. Thống kê Admin (Admin Analytics)
| Phương thức | Endpoint | Mô tả | Tham số truyền vào (Payload/Query) | Dữ liệu trả về (Data) |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/admin/revenue/summary` | Tổng hợp doanh thu toàn hệ thống | *Không* | `totalRevenue`, `ticketsSold`, `activeConcerts`, thống kê theo loại vé. |
| **GET** | `/admin/concerts/:id/revenue` | Báo cáo doanh thu theo concert | *Không* | Doanh thu của concert, số vé đã bán của từng loại, tỷ lệ lấp đầy. |

### 2.3. Khách mời & AI Bio (Guests & AI Bio)
| Phương thức | Endpoint | Mô tả | Tham số truyền vào (Payload/Query) | Dữ liệu trả về (Data) |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/admin/guests/import` | Upload file CSV danh sách khách mời | `file` (Multipart/form-data) | `batchId`, `status: "PROCESSING"` |
| **GET** | `/admin/guests/batches/:id` | Trạng thái batch import CSV | *Không* | `status`, `totalRows`, `validCount`, `duplicateCount`, `invalidCount` |
| **GET** | `/admin/guests/batches/:id/errors` | Lấy danh sách dòng lỗi CSV | *Không* | Danh sách dòng lỗi kèm chi tiết lỗi (ví dụ: "Sai định dạng email ở dòng 12") |
| **POST** | `/admin/concerts/:id/ai-bio/upload` | Upload PDF nghệ sĩ sinh Bio | `file` (PDF) | `concertId`, `status: "PROCESSING"` |
| **GET** | `/admin/concerts/:id/ai-bio/status` | Polling trạng thái sinh Bio | *Không* | `status: "SUCCESS" \| "FAILED"`, `generatedBio` (nếu thành công) |
| **PATCH** | `/admin/concerts/:id/bio` | Cập nhật Bio thủ công | `{ bio: string }` | Concert sau khi cập nhật Bio |

### 2.4. Thông báo (Notifications)
| Phương thức | Endpoint | Mô tả | Tham số truyền vào (Payload/Query) | Dữ liệu trả về (Data) |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/notifications` | Danh sách thông báo của User | `page`, `limit` | Danh sách thông báo (`Notification[]`), số thông báo chưa đọc (`unreadCount`) |
| **PATCH** | `/notifications/:id/read` | Đánh dấu một thông báo đã đọc | *Không* | `success: true` |
| **POST** | `/notifications/mark-all-read` | Đánh dấu đọc toàn bộ thông báo | *Không* | `success: true` |
