'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { createUser, updateUser, deleteUser, toggleUserStatus } from '../api';
import { userKeys } from './query-keys';
import type { ApiResponse } from '@/types/api';
import type { CreateUserPayload, UpdateUserPayload } from '../types';

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (res) => {
      toast.success('User created', { description: res.message });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Failed to create user';
      toast.error('Error', { description: message });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => updateUser(id, payload),
    onSuccess: (res) => {
      toast.success('User updated', { description: res.message });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Failed to update user';
      toast.error('Error', { description: message });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (res) => {
      toast.success('User deleted', { description: res.message });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Failed to delete user';
      toast.error('Error', { description: message });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleUserStatus(id),
    onSuccess: (res) => {
      toast.success('Status updated', { description: res.message });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Failed to toggle status';
      toast.error('Error', { description: message });
    },
  });
};
