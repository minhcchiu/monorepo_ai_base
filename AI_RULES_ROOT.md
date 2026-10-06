# AI_RULES_ROOT

> Rule cấp monorepo. Rule riêng từng app nằm ở `apps/<app>/AI_RULES.md`. KHÔNG trộn rule giữa các app.

## 0. Thứ tự áp dụng rule (BẮT BUỘC ĐỌC TRƯỚC)

- Trước khi tạo/sửa BẤT KỲ file nào trong `apps/<app>/`, PHẢI đọc và tuân thủ
  `apps/<app>/AI_RULES.md` của ĐÚNG app đó. Chưa đọc rule app = chưa đủ điều kiện chỉnh code app đó.
- Rule app **cụ thể hóa/bổ sung** rule root, KHÔNG được mâu thuẫn với contract chung.
- **Khi xung đột:**
  - Phần **contract dùng chung** (mục 2–4 dưới đây: envelope response, pagination, prefix `/api/v1`,
    cơ chế multi-scope, luồng phụ thuộc một chiều) → **ROOT thắng**. Không app nào được định nghĩa lại
    hay đi ngược, kể cả khi file app tự ghi "AUTHORITATIVE".
  - Phần **nội bộ của app** (stack, cấu trúc thư mục, kiến trúc lớp, đặt tên, thư viện UI/state, toast…)
    → **rule app thắng**. Root KHÔNG can thiệp.
- Rule của app này KHÔNG áp cho app khác (vd pattern Riverpod của mobile không dùng cho web).
  Mỗi app chỉ theo đúng `AI_RULES.md` của mình + mục contract chung ở root.

## 1. Cấu trúc monorepo

```
apps/
  backend     NestJS + Prisma — nguồn sự thật của API
  web-admin   Next.js — bảng quản trị (nhóm contract: admin) 
  mobile      Android Kotlin + Jetpack Compose — Gradle, KHÔNG nằm trong pnpm workspace (nhóm: app)
packages/
  api-contract  Single source of truth cho API: 3 swagger spec + types generate
  shared-ts     Type/khung dùng chung cho mọi TS client (ApiResponse, Pagination...)
```

## 2. Contract dùng chung (BẮT BUỘC tuân thủ)

- Mọi route có prefix `/api/v1`.
- Response thành công: `{ success: true, message, data }` (backend trả qua `BaseResponseDto.success`).
- Response lỗi: `{ success: false, message, errorCode? }`.
- Danh sách phân trang: `{ data, meta: { page, limit, total, totalPages } }`.
- Các khung trên định nghĩa MỘT LẦN tại `@cloudpulse/shared-ts` — client KHÔNG tự định nghĩa lại.

## 3. Cơ chế 3 tài liệu API + multi-scope

- Backend gắn `@ApiScope('app' | 'admin' | 'user', ...)` cho từng controller/route
  (file: `apps/backend/src/common/decorators/api-scope.decorator.ts`).
- Endpoint dùng chung (auth, upload, notification...) định nghĩa MỘT LẦN, gán MẢNG scope —
  KHÔNG nhân bản endpoint cho từng client.
- Endpoint KHÔNG gắn `@ApiScope` sẽ bị loại khỏi cả 3 spec client (vd health, system-setting nội bộ).
- `scope-filter.ts` lọc cả `paths` LẪN `components.schemas` theo nhóm → mỗi spec chỉ chứa
  endpoint + schema của nhóm mình, không lẫn.
- Runtime docs (Scalar UI): `/docs/app`, `/docs/admin`, `/docs/user` (+ `/docs` full nội bộ).
- Export spec ra file: `pnpm --filter @cloudpulse/backend docs:export`
  → ghi `packages/api-contract/specs/swagger-{app,admin,user}.json`.

## 4. Luồng phụ thuộc (một chiều)

```
backend (DTO + @ApiScope)
   └─ docs:export ─> packages/api-contract/specs/*.json
        └─ codegen ─> packages/api-contract/src/generated/{app,admin,user}.ts
             ├─ web-admin  import '@cloudpulse/api-contract/admin'  (CHỈ nhóm admin)
             └─ mobile     Retrofit + tay viết interface theo swagger-app.json (CHỈ nhóm app)
```

Mỗi client CHỈ đọc nhóm contract của mình. Không client nào import nhóm khác.

## 5. Quy ước bảo mật / env

- KHÔNG hardcode URL/secret/DSN/token trong source — luôn đọc từ env (`process.env` cho
  backend/web-admin, `BuildConfig` sinh từ `gradle.properties` cho mobile Android).
- Mỗi app có file mẫu env (`.env.example`, mobile: `dart_define.example.json`) chỉ chứa
  PLACEHOLDER. File env thật KHÔNG commit (đã gitignore).
