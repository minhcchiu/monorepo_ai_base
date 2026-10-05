'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardOverview, getDashboardSummary, getUserStats } from '../api';
import { dashboardKeys } from './query-keys';
import type { DashboardStatsParams } from '../types';

export const useDashboardSummary = () =>
  useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: getDashboardSummary,
  });

export const useDashboardOverview = (params?: { dateFrom?: string; dateTo?: string }) =>
  useQuery({
    queryKey: dashboardKeys.overview(params),
    queryFn: () => getDashboardOverview(params),
  });

export const useUserStats = (params: DashboardStatsParams) =>
  useQuery({
    queryKey: dashboardKeys.users(params),
    queryFn: () => getUserStats(params),
  });
