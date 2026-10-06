/**
 * Cầu nối tới types generate từ @cloudpulse/api-contract (nhóm `admin`).
 *
 * web-admin CHỈ dùng nhóm admin. `AdminSchemas` = các DTO request backend export ra.
 *
 * LƯU Ý:
 * - User entity đã dẫn xuất từ `UserResponseDto` (xem modules/users/types.ts); Auth từ `AuthResponseDto`.
 *   Các entity chưa annotate (Notification, Dashboard...) vẫn viết tay tới khi backend gắn @ApiResponse.
 * - Role đã thống nhất theo backend thật: USER|MODERATOR|ADMIN (nguồn: modules/users/roles).
 */
import type { components } from '@cloudpulse/api-contract/admin';

export type AdminSchemas = components['schemas'];
