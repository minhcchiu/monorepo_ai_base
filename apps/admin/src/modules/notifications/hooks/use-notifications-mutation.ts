'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import {
  sendUserNotification,
  sendManyNotifications,
  broadcastNotification,
  deleteNotification,
} from '../api';
import { notificationKeys } from './query-keys';
import type { ApiResponse } from '@/types/api';
import type {
  SendUserNotificationPayload,
  SendManyNotificationsPayload,
  BroadcastNotificationPayload,
} from '../types';

export const useSendUserNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendUserNotificationPayload) => sendUserNotification(payload),
    onSuccess: (res) => {
      toast.success('Đã gửi thông báo', { description: res.message });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Không thể gửi thông báo';
      toast.error('Lỗi', { description: message });
    },
  });
};

export const useSendManyNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendManyNotificationsPayload) => sendManyNotifications(payload),
    onSuccess: (res) => {
      toast.success('Đã gửi thông báo', { description: res.message });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Không thể gửi thông báo';
      toast.error('Lỗi', { description: message });
    },
  });
};

export const useBroadcastNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BroadcastNotificationPayload) => broadcastNotification(payload),
    onSuccess: (res) => {
      const sentCount = res.data?.sentCount ?? 0;
      toast.success('Đã gửi thông báo đại trà', {
        description: `${res.message} — ${sentCount} người nhận`,
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Không thể gửi thông báo đại trà';
      toast.error('Lỗi', { description: message });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: (res) => {
      toast.success('Đã xoá thông báo', { description: res.message });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && (error.response?.data as ApiResponse)?.message
          ? (error.response?.data as ApiResponse).message
          : 'Không thể xoá thông báo';
      toast.error('Lỗi', { description: message });
    },
  });
};
