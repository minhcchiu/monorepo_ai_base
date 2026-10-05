// Nguồn role/status DUY NHẤT cho web-admin — khớp enum thật của backend
// (UserRole trong prisma schema: USER | MODERATOR | ADMIN).

export const USER_ROLES = ['USER', 'MODERATOR', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Nhãn + style badge + màu chart cho từng role. */
export const ROLE_META: Record<UserRole, { label: string; className: string; color: string }> = {
  USER:      { label: 'Người dùng', className: 'bg-blue-100 text-blue-700 border-blue-200',       color: '#6366f1' },
  MODERATOR: { label: 'Điều phối',  className: 'bg-cyan-100 text-cyan-700 border-cyan-200',       color: '#06b6d4' },
  ADMIN:     { label: 'Quản trị',   className: 'bg-violet-100 text-violet-700 border-violet-200', color: '#8b5cf6' },
};

/** Nhãn + chấm + style badge cho từng status. */
export const STATUS_META: Record<UserStatus, { label: string; dot: string; className: string }> = {
  ACTIVE:               { label: 'Hoạt động',        dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INACTIVE:             { label: 'Không hoạt động',  dot: 'bg-slate-400',   className: 'bg-slate-100 text-slate-600 border-slate-200' },
  SUSPENDED:            { label: 'Bị khóa',          dot: 'bg-red-500',     className: 'bg-red-50 text-red-700 border-red-200' },
  PENDING_VERIFICATION: { label: 'Chờ xác minh',     dot: 'bg-amber-500',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
};
