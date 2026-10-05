import { axiosInstance } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { DashboardOverview, DashboardSummary, UserStats, DashboardStatsParams } from './types';

export const getDashboardSummary = async (): Promise<ApiResponse<DashboardSummary>> => {
  const { data } = await axiosInstance.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary');
  return data;
};

export const getDashboardOverview = async (params?: { dateFrom?: string; dateTo?: string }): Promise<ApiResponse<DashboardOverview>> => {
  const { data } = await axiosInstance.get<ApiResponse<DashboardOverview>>('/admin/dashboard/overview', { params });
  return data;
};

export const getUserStats = async (params: DashboardStatsParams): Promise<ApiResponse<UserStats>> => {
  const { data } = await axiosInstance.get<ApiResponse<UserStats>>('/admin/dashboard/users', { params });
  return data;
};
