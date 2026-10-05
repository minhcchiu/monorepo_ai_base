import type { DashboardStatsParams } from '../types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => ['dashboard', 'summary'] as const,
  overview: (params?: { dateFrom?: string; dateTo?: string }) => ['dashboard', 'overview', params] as const,
  users: (params: DashboardStatsParams) => ['dashboard', 'users', params] as const,
};
