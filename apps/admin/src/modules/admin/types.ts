import type { AdminSchemas } from '@/lib/api-contract';

// Request payload lấy từ contract generate (nguồn chuẩn từ backend).
export type ChangePasswordPayload = AdminSchemas['AdminChangePasswordDto'];
export type UpdateProfilePayload = AdminSchemas['UpdateProfileDto'];
