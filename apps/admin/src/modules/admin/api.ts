import { axiosInstance } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { ChangePasswordPayload, UpdateProfilePayload } from './types';

export const changePassword = async (payload: ChangePasswordPayload): Promise<ApiResponse<unknown>> => {
  const { data } = await axiosInstance.patch<ApiResponse<unknown>>('/admin/me/change-password', payload);
  return data;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<ApiResponse<unknown>> => {
  const { data } = await axiosInstance.patch<ApiResponse<unknown>>('/admin/me/profile', payload);
  return data;
};
