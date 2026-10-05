/**
 * @pp09base/shared-ts
 *
 * Shared TypeScript contracts dùng chung giữa các TS client (backend, web-admin, web-user).
 * Endpoint-specific types KHÔNG ở đây — chúng được generate vào @pp09base/api-contract.
 * Ở đây chỉ chứa các khung response/pagination dùng chung cho mọi endpoint.
 *
 * Chuẩn: success `{ success, message, data }`; error `{ success, message, errorCode }`
 * (kèm các field hỗ trợ debug); pagination `{ data, meta: { page, limit, total } }`.
 */

/** Response thành công chuẩn: { success, message, data } (+ timestamp ở backend hiện tại). */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  timestamp?: string;
}

/** Response lỗi của backend. `errorCode` (chuẩn mới) đặt cạnh `statusCode` (giữ cũ). */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  statusCode?: number;
  error?: string;
  errors?: unknown;
  timestamp?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Query phân trang: { page, limit }. */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Metadata phân trang: { page, limit, total } (+ totalPages). */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Response danh sách có phân trang: { data, meta }. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** 3 nhóm tài liệu API. Dùng chung cho @ApiScope (Bước 6) và codegen (api-contract). */
export type ApiScope = 'app' | 'admin' | 'user';

/** Type guard tiện dụng cho client. */
export function isApiError(res: ApiResponse): res is ApiErrorResponse {
  return res.success === false;
}
