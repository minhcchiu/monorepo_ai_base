import type { AdminSchemas } from '@/lib/api-contract';

// Request payload lấy từ contract generate (nguồn chuẩn từ backend).
export type LoginPayload = AdminSchemas['LoginDto'];

// AuthUser/AuthTokens giữ viết tay: backend chưa khai báo schema cho AuthResponseDto (rỗng).
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
