/**
 * @pp09base/api-contract — barrel cho types generate từ swagger.
 *
 * Mỗi client import nhóm RIÊNG của nó, KHÔNG đọc nhóm khác:
 *   - mobile/web-app  -> '@pp09base/api-contract/app'   (specs/swagger-app.json)
 *   - web-admin       -> '@pp09base/api-contract/admin' (specs/swagger-admin.json)
 *   - web-user        -> '@pp09base/api-contract/user'  (specs/swagger-user.json)
 *
 * Barrel này gom lại dưới namespace để tránh trùng tên `paths`/`components`.
 */
export * as App from './generated/app.js';
export * as Admin from './generated/admin.js';
export * as User from './generated/user.js';
