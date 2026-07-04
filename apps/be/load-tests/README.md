# Kiểm thử race condition và idempotency cho Orders

Thư mục này chứa script k6 dùng để tạo bằng chứng kỹ thuật cho `POST /orders`:

- Không oversell khi nhiều request đặt vé chạy đồng thời.
- Retry an toàn với `Idempotency-Key`.
- Cùng `Idempotency-Key` nhưng body khác phải bị từ chối bằng `409 Conflict`.

Script mặc định bắn `50` request đồng thời vào cùng một `ticketTypeId`, mỗi request dùng một `seatNumber` khác nhau. Trước khi chạy, hãy reset số vé còn lại của ticket type xuống một số nhỏ, ví dụ `5`. Kết quả hợp lệ là số order tạo thành công không vượt quá số vé còn lại; các request dư phải trả lỗi nghiệp vụ `409`, không phải lỗi `5xx`.

## 1. Chuẩn bị backend

Chạy database, migrate, seed dữ liệu và bật API local:

```bash
docker compose up -d
pnpm --filter @repo/be exec prisma migrate dev
pnpm --filter @repo/be db:seed
pnpm --filter @repo/be dev
```

Backend mặc định chạy ở:

```text
http://localhost:3001
```

## 2. Chuẩn bị dữ liệu test

Ví dụ dưới đây dùng concert seeded cố định và ticket type `SVIP`. Reset ticket type này về `5` vé còn lại:

```bash
docker exec -it nest-prisma-postgres psql -U postgres -d nest_prisma_db
```

```sql
UPDATE ticket_types
SET remaining = 5,
    total_quantity = 5,
    max_per_user = 100
WHERE id = 'da8e128c-682d-4fbb-bee4-5f26545cae11';
```

Nếu chạy lại nhiều lần, nên dọn các seat và idempotency key do script trước đó tạo:

```sql
DELETE FROM reservation_seats
WHERE concert_id = '202dedd0-18dc-4d48-a652-d0ee8aa1f441'
  AND seat_number LIKE 'RACE-%';

DELETE FROM idempotency_records
WHERE key LIKE 'RACE-%';
```

## 3. Chạy script k6

Từ thư mục `apps/be`:

```bash
pnpm loadtest:orders
```

Hoặc từ root repo:

```bash
k6 run apps/be/load-tests/orders-race-idempotency.k6.js
```

Mặc định script tự login bằng admin seeded:

```text
admin@gmail.com / 123456
```

Lý do dùng admin: service hiện bypass rate limit cho role `admin`, giúp bài test tập trung vào khóa tồn kho và idempotency thay vì bị chặn bởi giới hạn số request theo user.

## 4. Tùy biến tham số

Ví dụ chạy với 50 request đồng thời và kỳ vọng chỉ còn 5 vé:

```powershell
k6 run `
  -e BASE_URL=http://localhost:3001 `
  -e CONCERT_ID=202dedd0-18dc-4d48-a652-d0ee8aa1f441 `
  -e TICKET_TYPE_ID=da8e128c-682d-4fbb-bee4-5f26545cae11 `
  -e EXPECTED_AVAILABLE=5 `
  -e CONCURRENCY=50 `
  apps/be/load-tests/orders-race-idempotency.k6.js
```

Nếu đã có JWT và không muốn script tự login:

```bash
k6 run -e ACCESS_TOKEN=<jwt> apps/be/load-tests/orders-race-idempotency.k6.js
```

Các biến môi trường chính:

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `BASE_URL` | `http://localhost:3001` | URL backend |
| `CONCERT_ID` | Stable seeded concert | Concert dùng để đặt vé |
| `TICKET_TYPE_ID` | Stable seeded SVIP | Ticket type bị bắn concurrent |
| `EXPECTED_AVAILABLE` | `5` | Số vé còn lại trước khi test |
| `CONCURRENCY` | `50` | Số request concurrent |
| `ACCESS_TOKEN` | rỗng | JWT có sẵn, nếu không muốn auto login |
| `LOGIN_EMAIL` | `admin@gmail.com` | Email dùng để auto login |
| `LOGIN_PASSWORD` | `123456` | Password dùng để auto login |

## 5. Bằng chứng cần thấy

Cuối run, script in summary tương tự:

```text
Orders race/idempotency evidence
- Concurrent POST /orders: 50
- Expected available seats before run: 5
- Successful new order responses: 5
- Expected 409 business rejections: 46
- 429 rate-limit responses: 0
- 5xx responses: 0
- Oversell guard: PASS (success <= expected available)
```

Tiêu chí pass:

- `Successful new order responses <= EXPECTED_AVAILABLE`.
- `Oversell guard: PASS`.
- `429 rate-limit responses = 0`.
- `5xx responses = 0`.
- Retry cùng `Idempotency-Key` trả lại đúng cùng `orderId`.
- Cùng `Idempotency-Key` nhưng body khác trả `409`.

Script cũng ghi file `orders-race-idempotency-summary.json` để đính kèm vào báo cáo hoặc demo.
