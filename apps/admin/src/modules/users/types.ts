// Role/status từ nguồn chung (khớp backend).
export type { UserRole, UserStatus } from './roles';
import type { UserRole, UserStatus } from './roles';
import type { AdminSchemas } from '@/lib/api-contract';

// User entity DẪN XUẤT từ contract generate (UserResponseDto), nhưng siết role/status về union
// mạnh để UI (ROLE_META/STATUS_META) index an toàn.
export type User = Omit<AdminSchemas['UserResponseDto'], 'role' | 'status'> & {
  role: UserRole;
  status?: UserStatus;
};

export interface GetUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  isActive?: boolean;
}
