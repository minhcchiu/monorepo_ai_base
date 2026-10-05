import { axiosInstance } from '@/lib/axios';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { User, GetUsersParams, CreateUserPayload, UpdateUserPayload } from './types';

export const getUsers = async (params: GetUsersParams): Promise<ApiResponse<PaginatedData<User>>> => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<User>>>('/admin/users', { params });
  return data;
};

export const getUserById = async (id: string): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.get<ApiResponse<User>>(`/admin/users/${id}`);
  return data;
};

export const createUser = async (payload: CreateUserPayload): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.post<ApiResponse<User>>('/admin/users', payload);
  return data;
};

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.patch<ApiResponse<User>>(`/admin/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id: string): Promise<ApiResponse<unknown>> => {
  const { data } = await axiosInstance.delete<ApiResponse<unknown>>(`/admin/users/${id}`);
  return data;
};

export const toggleUserStatus = async (id: string): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.post<ApiResponse<User>>(`/admin/users/${id}/toggle-status`);
  return data;
};
