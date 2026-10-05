import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

/**
 * 3 nhóm tài liệu API độc lập.
 *  - 'app'   -> mobile      (swagger-app.json,   /docs/app)
 *  - 'admin' -> web-admin   (swagger-admin.json, /docs/admin)
 *  - 'user'  -> web-user    (swagger-user.json,  /docs/user)
 */
export type ApiScopeName = 'app' | 'admin' | 'user';

export const API_SCOPE_KEY = 'api:scope';

/**
 * ApiScope Decorator
 *
 * Gán endpoint vào MỘT hoặc NHIỀU nhóm tài liệu (multi-scope).
 * Dùng được ở mức class (áp cho mọi route trong controller) hoặc mức method (override).
 *
 * Cơ chế: vừa set metadata (cho việc lọc phía server nếu cần), vừa nhúng vendor extension
 * `x-scope` vào OpenAPI operation để bước build docs lọc theo nhóm mà KHÔNG cần map ngược handler.
 *
 * Endpoint KHÔNG gắn @ApiScope -> không có `x-scope` -> tự động bị loại khỏi cả 3 spec client.
 *
 * Quy ước (ràng buộc dự án): endpoint dùng chung (auth, upload...) định nghĩa MỘT LẦN,
 * gán mảng scope — KHÔNG nhân bản endpoint.
 *
 * Usage:
 *   @ApiScope('app', 'user')           // upload, notification...
 *   @ApiScope('app', 'admin', 'user')  // auth lõi
 *   @ApiScope('admin')                 // admin/*
 */
export function ApiScope(...scopes: ApiScopeName[]) {
  return applyDecorators(SetMetadata(API_SCOPE_KEY, scopes), ApiExtension('x-scope', scopes));
}
