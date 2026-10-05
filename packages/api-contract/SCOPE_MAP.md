# API Scope Map (đã duyệt) — nguồn áp dụng cho Bước 6

Bản đồ gán `@ApiScope('app'|'admin'|'user')` cho từng endpoint backend hiện có.
**Trạng thái:** đã chốt với chủ dự án. **Chưa áp dụng vào code** — sẽ thực thi ở Bước 6 (chạy sau cùng).

Quy ước:
- Endpoint dùng chung định nghĩa **một lần**, gán **mảng** scope — KHÔNG nhân bản.
- `none` = loại khỏi cả 3 spec client (`swagger-app/admin/user.json`).
- Prefix thực tế: `/api/v1`.

## auth (`/auth`)
| Endpoint | Method | Scope |
|---|---|---|
| login | POST | `['app','admin','user']` |
| refresh | POST | `['app','admin','user']` |
| logout | POST | `['app','admin','user']` |
| change-password | POST | `['app','admin','user']` |
| forgot-password | POST | `['app','admin','user']` |
| reset-password | POST | `['app','admin','user']` |
| register | POST | `['app','user']` |
| register-by-phone | POST | `['app','user']` |
| login-by-phone | POST | `['app','user']` |
| check-phone | POST | `['app','user']` |
| send-otp | POST | `['app','user']` |
| verifer-otp | POST | `['app','user']` |
| test / test-error / test-error1 / read-store-otp | POST/GET | `none` (debug — loại) |

## admin (`/admin`, `/admin/*`) → tất cả `['admin']`
- admin/dashboard: overview, users
- admin/notifications: send-user, send-many, broadcast
- admin/system-settings: GET, GET :key, POST, PATCH :key, DELETE :key
- admin (admin-users): GET users, GET users/:id, POST users, PATCH users/:id, DELETE users/:id,
  PATCH me/change-password, PATCH me/profile, POST users/:id/toggle-status

## users (`/users`) — TÁCH THEO ROUTE
| Endpoint | Method | Scope |
|---|---|---|
| `/users` (list) | GET | `['app','user']` |
| `/users/search` | GET | `['app','user']` |
| `/users/me` | GET | `['app','user']` |
| `/users/:id` | GET | `['app','user']` |
| `/users` (create) `@Roles('ADMIN')` | POST | `['admin']` |
| `/users/:id` (update) | PATCH | `['app','user']` |
| `/users/:id` (delete) `@Roles('ADMIN')` | DELETE | `['admin']` |

> Lưu ý: route ghi gắn `@Roles('ADMIN')` trùng vai admin/admin-users — gán `admin` ở đây cho
> đúng guard. Khi áp dụng, kiểm tra tránh trùng lặp hiển thị với admin-users (giữ 1 nguồn nếu trùng path).

## users/user-phone (`/user/phone`)
| Endpoint | Method | Scope |
|---|---|---|
| phone | GET | `['app','user']` |

## notification (`/notification`) → tất cả `['app','user']`
- POST /, POST device-token, POST device-token/remove, GET /, GET me, GET unread,
  POST read, POST read-all, GET :id, PATCH :id, DELETE :id, PATCH :id/restore

## upload (`/upload`) → tất cả `['app','user']`
- POST image, POST file, POST multiple

## system-setting (`/system-setting`, KHÔNG phải admin/) → `none`
- Loại khỏi client docs (trùng vai admin/system-settings). Giữ phục vụ nội bộ.

## health (`/health`) → `none`
- /, readiness, liveness, info — hạ tầng, loại khỏi cả 3 docs.

---

## Triển khai Bước 6 (tóm tắt, làm sau)
1. Tạo decorator `@ApiScope(...scopes: ApiScope[])` ở `src/common/decorators/api-scope.decorator.ts`
   (set metadata, hỗ trợ mảng). Có thể đặt mức class (mặc định cho mọi route) + override mức method.
2. Gắn nhãn theo bảng trên (chỉ thêm decorator, KHÔNG đổi logic).
3. Sửa `src/docs/docs.setup.ts`: từ 1 document → tạo 3 document bằng cách lọc OpenAPI theo metadata scope;
   phục vụ `/docs/app`, `/docs/admin`, `/docs/user` (giữ/loại `/docs` cũ tuỳ quyết định).
4. Script export `swagger-{app,admin,user}.json` → `packages/api-contract/specs/` rồi chạy codegen.
5. Endpoint `none`: không gắn scope → không lọt vào spec client nào.
