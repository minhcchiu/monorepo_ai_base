import { axiosInstance } from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { LoginPayload, AuthTokens } from './types';

export const login = async (payload: LoginPayload): Promise<ApiResponse<AuthTokens>> => {
  const { data } = await axiosInstance.post<ApiResponse<AuthTokens>>('/auth/login', payload);
  return data;
};
