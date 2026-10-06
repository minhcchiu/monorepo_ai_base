# @cloudpulse/api-contract

Single source of truth cho hợp đồng API giữa backend và các client.

## Luồng

```
backend (@ApiScope) ──export──> specs/swagger-{app,admin,user}.json ──codegen──> src/generated/{app,admin,user}.ts
                                                                                        │
                                  web-admin ← /admin   web-user ← /user   mobile ← /app │ (import nhóm riêng)
```

## Cấu trúc
- `specs/` — 3 spec OpenAPI tách theo nhóm (nguồn cho codegen). **Hiện đang seed tạm** bằng
  `docs-json.json` (1 spec gộp) cho tới khi backend tách scope (Bước 6).
- `src/generated/` — types do `openapi-typescript` sinh ra (đừng sửa tay).
- `src/index.ts` — barrel gom 3 nhóm dưới namespace `App` / `Admin` / `User`.

## Lệnh
```bash
# Sau khi đã `pnpm install` ở gốc:
pnpm --filter @cloudpulse/api-contract codegen        # gen cả 3 nhóm
pnpm --filter @cloudpulse/api-contract codegen:admin  # gen riêng 1 nhóm
```

## Quy ước import (client)
```ts
import type { paths } from '@cloudpulse/api-contract/admin'; // web-admin
import type { paths } from '@cloudpulse/api-contract/user';  // web-user
```
Mỗi client CHỈ import nhóm của mình.
