/**
 * Response envelopes của web-admin — NGUỒN SỰ THẬT: `@cloudpulse/shared-ts`.
 *
 * Không định nghĩa lại contract ở đây nữa (tránh lệch với backend/web-user).
 * Quy ước web-admin: tầng `modules/<m>/api.ts` chỉ trả về nhánh THÀNH CÔNG
 * (lỗi đã được axios interceptor ném ra), nên `data` ở `ApiResponse` là BẮT BUỘC.
 * Khi cần đọc lỗi -> dùng `ApiErrorResponse`.
 */
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
  PaginationMeta,
} from '@cloudpulse/shared-ts';

export type { ApiErrorResponse, PaginationMeta };

/** Alias tương thích tên cũ trong web-admin. */
export type PaginatedMeta = PaginationMeta;

/** Envelope thành công với `data` bắt buộc (tầng api đã unwrap). */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> & { data: T };

/** `{ data, meta: { page, limit, total, totalPages } }` — alias contract phân trang chung. */
export type PaginatedData<T> = PaginatedResponse<T>;

/** Shape phân trang phẳng `{ items, total, page, limit }` cho vài endpoint cũ. */
export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
