'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { changePassword, updateProfile } from '../api';
import type { ApiResponse } from '@/types/api';
import type { ChangePasswordPayload, UpdateProfilePayload } from '../types';
import { storeUser, getStoredUser } from '@/lib/auth';

export const useChangePassword = () =>
  useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: (res) => {
      toast.success('Password changed', { description: res.message });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Failed to change password';
      toast.error('Error', { description: message });
    },
  });

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (res, variables) => {
      const existing = getStoredUser();
      if (existing) {
        storeUser({
          ...existing,
          firstName: variables.firstName ?? existing.firstName,
          lastName: variables.lastName ?? existing.lastName,
          phone: variables.phone ?? existing.phone,
          avatar: variables.avatar ?? existing.avatar,
        });
      }
      toast.success('Profile updated', { description: res.message });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Failed to update profile';
      toast.error('Error', { description: message });
    },
  });
