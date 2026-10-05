export type GroupBy = 'DAY' | 'WEEK' | 'MONTH';

export interface DashboardOverview {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisMonth: number;
    byRole: Record<string, number>;
  };
  notifications: {
    total: number;
    unread: number;
  };
  system: {
    totalSettings: number;
  };
}

/** `GET /admin/dashboard/summary` — số liệu tổng quan toàn hệ thống (không lọc thời gian). */
export interface DashboardSummary {
  /** Tổng số người dùng (chưa xoá mềm). */
  totalUsers: number;
  /** Số người dùng đang hoạt động. */
  activeUsers: number;
  /** Tổng số thông báo. */
  totalNotifications: number;
  /** Số thông báo chưa đọc. */
  unreadNotifications: number;
  /** Tổng số cấu hình hệ thống. */
  totalSettings: number;
}

export interface UserSeriesPoint {
  label: string;
  total: number;
  byRole: Record<string, number>;
}

export interface UserStats {
  groupBy: GroupBy;
  series: UserSeriesPoint[];
  summary: {
    totalNewUsers: number;
    growthRateThisMonth: number;
  };
}

export interface DashboardStatsParams {
  groupBy?: GroupBy;
  dateFrom?: string;
  dateTo?: string;
}
